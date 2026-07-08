import type {
  IngestError,
  RawEvidence,
  RawTrace,
  RawTraceEvent,
  TrainingSample,
  TrainingSampleKind,
  TrainingSampleQuality,
  TrainingSampleStatus,
} from '../../trace-core/src/types';
import { distillTrainingText } from '../../governance/src/redaction';

function compactText(value: unknown, max = 420): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function messageFromEvent(event: RawTraceEvent): Record<string, unknown> | undefined {
  if (!isRecord(event.payload)) return undefined;
  const message = event.payload.message;
  return isRecord(message) ? message : undefined;
}

function contentText(content: unknown): string {
  if (typeof content === 'string') return compactText(content, 4000);
  if (!Array.isArray(content)) return compactText(content, 4000);
  return content
    .map((block) => {
      if (!isRecord(block)) return '';
      if (block.type === 'text' && typeof block.text === 'string') return block.text;
      if (block.type === 'tool_use') return `[tool_use ${String(block.name ?? '')}]`;
      if (block.type === 'tool_result') return '[tool_result]';
      if (block.type === 'thinking') return '[thinking]';
      return `[${String(block.type ?? 'block')}]`;
    })
    .filter(Boolean)
    .join(' ');
}

function eventText(event: RawTraceEvent): string {
  const message = messageFromEvent(event);
  return message ? contentText(message.content) : event.preview;
}

function roleOf(event: RawTraceEvent): string | undefined {
  return event.role ?? (messageFromEvent(event)?.role as string | undefined);
}

function blockersFor(trace: RawTrace, finalAssistant?: RawTraceEvent, evidenceCount = 0, toolEventCount = 0, errors: IngestError[] = []): string[] {
  const blockers = new Set<string>();

  if (trace.risk.level === 'L4') blockers.add('High risk trace requires manual review before training use');
  if (trace.risk.level === 'L3') blockers.add('Medium-high risk trace requires governance review');
  if (trace.risk.containsCredentialHint) blockers.add('Credential or secret-like content detected');
  if (trace.risk.containsLocalPathHint) blockers.add('Local filesystem path detected');
  if (trace.risk.containsSourceCodeHint) blockers.add('Source code or file mutation signal detected');
  if (trace.risk.containsCustomerDataHint) blockers.add('Customer, account, browser, or connector data signal detected');
  if (toolEventCount > 0 && evidenceCount === 0) blockers.add('No evidence captured for this tool chain');
  if (!finalAssistant) blockers.add('No assistant outcome available for supervised sample output');
  if (trace.status === 'failed' || errors.length > 0) blockers.add('Trace contains failure metadata');

  return Array.from(blockers);
}

function statusFor(trace: RawTrace, blockers: string[]): TrainingSampleStatus {
  if (trace.risk.level === 'L4' || trace.risk.containsCredentialHint || blockers.includes('No assistant outcome available for supervised sample output')) {
    return 'blocked';
  }
  if (blockers.length > 0 || trace.risk.level === 'L3') return 'needs_review';
  return 'candidate';
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function qualityFor(input: {
  trace: RawTrace;
  finalAssistant?: RawTraceEvent;
  evidenceCount: number;
  toolEventCount: number;
  blockers: string[];
  cleanUserGoal: string;
  cleanAssistantOutcome: string;
  redactionCount: number;
  readyForFineTune: boolean;
}): TrainingSampleQuality {
  let score = 100;
  const signals: TrainingSampleQuality['signals'] = [];

  const add = (label: string, impact: TrainingSampleQuality['signals'][number]['impact'], detail: string, delta = 0) => {
    score += delta;
    signals.push({ label, impact, detail });
  };

  if (input.readyForFineTune) add('clean text ready', 'positive', 'Input and assistant outcome are available after distillation.');
  else add('missing clean text', 'negative', 'Fine-tune export requires clean user goal and assistant outcome.', -28);

  if (!input.finalAssistant) add('no assistant outcome', 'negative', 'No supervised output can be produced from this trace.', -35);
  if (input.trace.status === 'failed') add('failed trace', 'negative', 'Trace contains failure metadata.', -30);

  if (input.trace.risk.level === 'L4') add('L4 governance risk', 'negative', 'High-risk trace must stay blocked until underlying issues are resolved.', -42);
  else if (input.trace.risk.level === 'L3') add('L3 governance risk', 'warning', 'Trace requires human governance review before training use.', -18);
  else add('low risk', 'positive', `Risk level is ${input.trace.risk.level}.`);

  if (input.trace.risk.containsCredentialHint) add('credential signal', 'negative', 'Secret-like content was detected.', -28);
  if (input.trace.risk.containsLocalPathHint) add('local path signal', 'warning', 'Local filesystem paths were detected.', -8);
  if (input.trace.risk.containsCustomerDataHint) add('enterprise data signal', 'warning', 'Customer, account, browser, or connector data signal was detected.', -10);
  if (input.trace.risk.containsSourceCodeHint) add('source mutation signal', 'warning', 'Source code or file mutation signal was detected.', -10);

  if (input.toolEventCount > 0 && input.evidenceCount === 0) {
    add('missing evidence', 'warning', 'Tool chain exists but no evidence is captured.', -14);
  } else if (input.evidenceCount > 0) {
    add('evidence linked', 'positive', `${input.evidenceCount} evidence item(s) are linked.`);
  }

  if (input.cleanAssistantOutcome.length < 2) add('thin outcome', 'warning', 'Assistant outcome is very short.', -8);
  if (input.cleanUserGoal.length < 2) add('thin prompt', 'warning', 'User goal is very short.', -8);
  if (input.redactionCount > 0) {
    add('redacted text', 'warning', `${input.redactionCount} redaction(s) were applied before export.`, -Math.min(16, input.redactionCount * 3));
  }
  if (input.blockers.length > 0) add('governance blockers', 'warning', `${input.blockers.length} blocker(s) still need attention.`, -Math.min(24, input.blockers.length * 5));

  const finalScore = clampScore(score);
  let grade: TrainingSampleQuality['grade'] = 'excellent';
  if (input.trace.risk.level === 'L4' || input.trace.risk.containsCredentialHint || !input.finalAssistant || finalScore < 45) grade = 'blocked';
  else if (finalScore < 70 || input.blockers.length > 0) grade = 'review';
  else if (finalScore < 86) grade = 'good';

  return {
    score: finalScore,
    grade,
    signals,
  };
}

function labelsFor(input: {
  kind: TrainingSampleKind;
  trace: RawTrace;
  toolEventCount: number;
  evidenceCount: number;
  sourceSignals: string[];
}): string[] {
  return Array.from(new Set([
    input.kind,
    'kodax',
    input.trace.runtime.surface ?? 'kodax-cli',
    input.trace.runtime.scope ?? 'unknown-scope',
    input.trace.risk.level,
    input.toolEventCount > 0 ? 'has_tools' : 'no_tools',
    input.evidenceCount > 0 ? 'has_evidence' : 'no_evidence',
    ...input.sourceSignals,
  ].filter(Boolean)));
}

function createSample(input: {
  trace: RawTrace;
  id: string;
  kind: TrainingSampleKind;
  title: string;
  userGoal: string;
  assistantOutcome?: string;
  finalAssistant?: RawTraceEvent;
  toolEvents: RawTraceEvent[];
  evidence: RawEvidence[];
  eventCount: number;
  errors: IngestError[];
  sourceSignals: string[];
  extraBlockers?: string[];
  createdAt?: string;
  updatedAt?: string;
}): TrainingSample {
  const distilledInput = distillTrainingText(input.userGoal);
  const distilledOutput = distillTrainingText(input.assistantOutcome);
  const redactionCount = distilledInput.distillation.redactionCount + distilledOutput.distillation.redactionCount;
  const removedThinking = distilledInput.distillation.removedThinking || distilledOutput.distillation.removedThinking;
  const blockers = Array.from(new Set([
    ...blockersFor(input.trace, input.finalAssistant, input.evidence.length, input.toolEvents.length, input.errors),
    ...(input.extraBlockers ?? []),
  ]));
  const readyForFineTune = !!distilledInput.clean && !!distilledOutput.clean && input.trace.status === 'completed';
  const quality = qualityFor({
    trace: input.trace,
    finalAssistant: input.finalAssistant,
    evidenceCount: input.evidence.length,
    toolEventCount: input.toolEvents.length,
    blockers,
    cleanUserGoal: distilledInput.clean,
    cleanAssistantOutcome: distilledOutput.clean,
    redactionCount,
    readyForFineTune,
  });

  return {
    id: input.id,
    traceId: input.trace.id,
    revisionId: input.trace.latestRevisionId,
    source: 'raw_trace',
    sourceSessionId: input.trace.sourceSessionId,
    projectKey: input.trace.projectKey,
    title: input.title,
    kind: input.kind,
    status: statusFor(input.trace, blockers),
    trainable: false,
    riskLevel: input.trace.risk.level,
    quality,
    blockers,
    labels: labelsFor({
      kind: input.kind,
      trace: input.trace,
      toolEventCount: input.toolEvents.length,
      evidenceCount: input.evidence.length,
      sourceSignals: input.sourceSignals,
    }),
    promptPreview: compactText(distilledInput.clean || input.userGoal),
    responsePreview: compactText(distilledOutput.clean || input.assistantOutcome || 'No assistant outcome captured'),
    toolEventCount: input.toolEvents.length,
    evidenceCount: input.evidence.length,
    eventCount: input.eventCount,
    createdAt: input.createdAt ?? input.trace.importedAt,
    updatedAt: input.updatedAt ?? input.trace.updatedAt,
    input: {
      userGoal: input.userGoal,
      cleanUserGoal: distilledInput.clean,
      runtime: input.trace.runtime,
      toolEventIds: input.toolEvents.map((event) => event.id),
      evidenceIds: input.evidence.map((item) => item.id),
      sourceEventIds: [
        ...input.toolEvents.map((event) => event.id),
        ...(input.finalAssistant?.id ? [input.finalAssistant.id] : []),
      ],
    },
    output: {
      assistantOutcome: input.assistantOutcome,
      cleanAssistantOutcome: distilledOutput.clean,
      finalEventId: input.finalAssistant?.id,
    },
    metadata: {
      generatedBy: 'traceops-p0-sampler',
      traceStatus: input.trace.status,
      ingestionStatus: input.trace.ingestionStatus,
      riskReasons: input.trace.risk.reasons,
      distillation: {
        version: 'kodax-clean-text-v1',
        redactionCount,
        removedThinking,
        readyForFineTune,
      },
      datasetBuilder: {
        version: 'kodax-dataset-builder-v1',
        sourceSignals: input.sourceSignals,
      },
    },
  };
}

function evidenceSummary(evidence: RawEvidence[]): string {
  return evidence
    .slice(0, 6)
    .map((item) => `${item.kind}: ${item.summary ?? item.displayTarget ?? item.target}`)
    .join('\n');
}

function toolSummary(toolEvents: RawTraceEvent[]): string {
  return toolEvents
    .slice(0, 8)
    .map((event, index) => `${index + 1}. ${event.label}: ${event.preview}`)
    .join('\n');
}

function traceContext(
  trace: RawTrace,
  activeEvents: RawTraceEvent[],
  toolEvents: RawTraceEvent[],
  evidence: RawEvidence[],
  errors: IngestError[],
) {
  const firstUser = activeEvents.find((event) => event.type === 'message' && roleOf(event) === 'user');
  const finalAssistant = [...activeEvents].reverse().find((event) => event.type === 'message' && roleOf(event) === 'assistant');
  return {
    firstUser,
    finalAssistant,
    userGoal: firstUser ? eventText(firstUser) : trace.title,
    assistantOutcome: finalAssistant ? eventText(finalAssistant) : undefined,
    toolEvents,
    evidence,
    errors,
  };
}

export function generateTrainingSamples(
  trace: RawTrace,
  events: RawTraceEvent[],
  evidence: RawEvidence[],
  errors: IngestError[],
): TrainingSample[] {
  const activeEvents = events.filter((event) => event.active !== false);
  const toolEvents = activeEvents.filter((event) =>
    event.type === 'tool_call' || event.type === 'tool_use' || event.type === 'tool_result'
  );
  const context = traceContext(trace, activeEvents, toolEvents, evidence, errors);
  const samples: TrainingSample[] = [];

  samples.push(createSample({
    trace,
    id: `sample_${trace.latestRevisionId}_${trace.id}`,
    kind: 'sft',
    title: trace.title,
    userGoal: context.userGoal,
    assistantOutcome: context.assistantOutcome,
    finalAssistant: context.finalAssistant,
    toolEvents,
    evidence,
    eventCount: activeEvents.length,
    errors,
    sourceSignals: ['instruction_response'],
  }));

  if (toolEvents.length > 0) {
    samples.push(createSample({
      trace,
      id: `sample_tool_use_${trace.latestRevisionId}_${trace.id}`,
      kind: 'tool_use',
      title: `${trace.title} / tool-use`,
      userGoal: `Replay the tool-use chain for this KodaX task.\n\nUser goal:\n${context.userGoal}\n\nTool chain:\n${toolSummary(toolEvents)}`,
      assistantOutcome: `Tool chain summary:\n${toolSummary(toolEvents)}\n\nEvidence:\n${evidenceSummary(evidence) || 'No evidence captured.'}\n\nFinal outcome:\n${context.assistantOutcome ?? 'No assistant outcome captured.'}`,
      finalAssistant: context.finalAssistant,
      toolEvents,
      evidence,
      eventCount: activeEvents.length,
      errors,
      sourceSignals: ['tool_chain', 'artifact_evidence'],
    }));
  }

  const planningEvents = activeEvents.filter((event) =>
    event.type === 'goal' || event.type === 'compaction' || event.type === 'branch_summary'
  );
  if (planningEvents.length > 0 || activeEvents.length >= 6) {
    samples.push(createSample({
      trace,
      id: `sample_planning_${trace.latestRevisionId}_${trace.id}`,
      kind: 'planning',
      title: `${trace.title} / planning`,
      userGoal: `Create an execution plan for this KodaX task.\n\nGoal:\n${context.userGoal}`,
      assistantOutcome: [
        `Task: ${trace.title}`,
        `Events reviewed: ${activeEvents.length}`,
        `Tool events: ${toolEvents.length}`,
        `Evidence items: ${evidence.length}`,
        planningEvents.length > 0 ? `Planning signals:\n${planningEvents.map((event) => `- ${event.label}: ${event.preview}`).join('\n')}` : 'Planning signal inferred from multi-step execution.',
        context.assistantOutcome ? `Final outcome:\n${context.assistantOutcome}` : undefined,
      ].filter(Boolean).join('\n\n'),
      finalAssistant: context.finalAssistant,
      toolEvents,
      evidence,
      eventCount: activeEvents.length,
      errors,
      sourceSignals: ['planning', planningEvents.length > 0 ? 'explicit_plan_signal' : 'inferred_plan_signal'],
    }));
  }

  const repairSignals = [
    ...errors.map((error) => error.message),
    ...activeEvents.filter((event) => event.type === 'error_metadata').map((event) => event.preview),
    ...evidence.filter((item) => item.kind === 'check_result' && /fail|error|失败|错误/i.test(`${item.summary ?? ''} ${item.action ?? ''}`)).map((item) => item.summary ?? item.action ?? item.target),
  ].filter(Boolean);
  if (trace.status === 'failed' || errors.length > 0 || repairSignals.length > 0) {
    samples.push(createSample({
      trace,
      id: `sample_repair_${trace.latestRevisionId}_${trace.id}`,
      kind: 'repair',
      title: `${trace.title} / repair`,
      userGoal: `Diagnose and recover from this KodaX task failure.\n\nGoal:\n${context.userGoal}\n\nFailure signals:\n${repairSignals.join('\n') || 'Trace marked as failed.'}`,
      assistantOutcome: context.assistantOutcome ?? 'No successful repair outcome captured.',
      finalAssistant: context.finalAssistant,
      toolEvents,
      evidence,
      eventCount: activeEvents.length,
      errors,
      sourceSignals: ['failure_recovery'],
    }));
  }

  const hasBranchSignal = activeEvents.some((event) => event.type === 'branch_summary' || event.active === false);
  if (hasBranchSignal) {
    samples.push(createSample({
      trace,
      id: `sample_preference_${trace.latestRevisionId}_${trace.id}`,
      kind: 'preference',
      title: `${trace.title} / preference`,
      userGoal: `Select the preferred KodaX trajectory for this task.\n\nGoal:\n${context.userGoal}`,
      assistantOutcome: [
        'Preferred trajectory is the active path.',
        ...activeEvents
          .filter((event) => event.type === 'branch_summary' || event.active === false)
          .slice(0, 6)
          .map((event) => `Alternative signal: ${event.label}: ${event.preview}`),
        context.assistantOutcome ? `Accepted outcome:\n${context.assistantOutcome}` : undefined,
      ].filter(Boolean).join('\n\n'),
      finalAssistant: context.finalAssistant,
      toolEvents,
      evidence,
      eventCount: activeEvents.length,
      errors,
      sourceSignals: ['preference', 'branch_or_off_path'],
    }));
  }

  const evalEvidence = evidence.filter((item) => item.kind === 'check_result');
  if (evalEvidence.length > 0 || context.assistantOutcome) {
    samples.push(createSample({
      trace,
      id: `sample_eval_${trace.latestRevisionId}_${trace.id}`,
      kind: 'eval',
      title: `${trace.title} / eval`,
      userGoal: `Evaluate whether the KodaX task result satisfies the goal.\n\nGoal:\n${context.userGoal}`,
      assistantOutcome: [
        context.assistantOutcome ? `Expected outcome:\n${context.assistantOutcome}` : undefined,
        evalEvidence.length > 0 ? `Check evidence:\n${evidenceSummary(evalEvidence)}` : 'No explicit check_result evidence; use final assistant outcome as the expected behavior.',
      ].filter(Boolean).join('\n\n'),
      finalAssistant: context.finalAssistant,
      toolEvents: [],
      evidence: evalEvidence,
      eventCount: activeEvents.length,
      errors,
      sourceSignals: ['evaluation', evalEvidence.length > 0 ? 'check_result' : 'final_outcome'],
    }));
  }

  return samples;
}

export function generateTrainingSample(
  trace: RawTrace,
  events: RawTraceEvent[],
  evidence: RawEvidence[],
  errors: IngestError[],
): TrainingSample {
  return generateTrainingSamples(trace, events, evidence, errors)[0];
}
