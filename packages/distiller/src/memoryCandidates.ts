import type {
  IngestError,
  MemoryCandidate,
  MemoryCandidateKind,
  RawEvidence,
  RawTrace,
  RawTraceEvent,
  TrainingSample,
} from '../../trace-core/src/types';
import { distillTrainingText } from '../../governance/src/redaction';

function compactText(value: unknown, max = 560): string {
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

function roleOf(event: RawTraceEvent): string | undefined {
  return event.role ?? (messageFromEvent(event)?.role as string | undefined);
}

function eventText(event: RawTraceEvent): string {
  const message = messageFromEvent(event);
  return message ? contentText(message.content) : event.preview;
}

function evidenceLabel(evidence: RawEvidence): string {
  return compactText(evidence.summary ?? evidence.displayTarget ?? evidence.target, 180);
}

function toolLabel(event: RawTraceEvent): string {
  if (!isRecord(event.payload)) return event.label;
  const tool = isRecord(event.payload.tool) ? event.payload.tool : event.payload;
  return String(tool.name ?? tool.toolName ?? event.label.replace(/^Tool (card|call|result):\s*/, '') ?? event.label);
}

function baseBlockers(trace: RawTrace, errors: IngestError[]): string[] {
  const blockers = new Set<string>();
  if (trace.risk.level === 'L4') blockers.add('L4 trace cannot be promoted to memory without external approval');
  if (trace.risk.containsCredentialHint) blockers.add('Credential or secret-like content detected');
  if (trace.status === 'failed' || errors.length > 0) blockers.add('Trace contains failure metadata');
  return Array.from(blockers);
}

function statusFor(trace: RawTrace, blockers: string[], confidence: number): MemoryCandidate['status'] {
  if (blockers.some((blocker) => /L4|Credential|secret/i.test(blocker))) return 'blocked';
  if (trace.risk.level === 'L3' || blockers.length > 0 || confidence < 62) return 'needs_review';
  return 'candidate';
}

function confidenceFor(input: {
  trace: RawTrace;
  evidenceCount: number;
  toolEventCount: number;
  sourceSignalCount: number;
  hasFinalOutcome: boolean;
  hasFailure: boolean;
}): number {
  let score = 44;
  if (input.trace.status === 'completed') score += 14;
  if (input.hasFinalOutcome) score += 12;
  score += Math.min(14, input.evidenceCount * 4);
  score += Math.min(12, input.toolEventCount * 2);
  score += Math.min(10, input.sourceSignalCount * 3);
  if (input.hasFailure) score -= 8;
  if (input.trace.risk.level === 'L3') score -= 12;
  if (input.trace.risk.level === 'L4') score -= 34;
  if (input.trace.risk.containsCredentialHint) score -= 28;
  if (input.trace.risk.containsCustomerDataHint) score -= 8;
  if (input.trace.risk.containsSourceCodeHint) score -= 6;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function clean(value: string): string {
  return distillTrainingText(value).clean || compactText(value);
}

function createCandidate(input: {
  trace: RawTrace;
  kind: MemoryCandidateKind;
  title: string;
  summary: string;
  body: string;
  triggers: string[];
  sourceSignals: string[];
  evidence: RawEvidence[];
  sourceEvents: RawTraceEvent[];
  samples: TrainingSample[];
  errors: IngestError[];
  confidenceAdjust?: number;
}): MemoryCandidate {
  const blockers = baseBlockers(input.trace, input.errors);
  const confidence = Math.max(0, Math.min(100, confidenceFor({
    trace: input.trace,
    evidenceCount: input.evidence.length,
    toolEventCount: input.sourceEvents.filter((event) =>
      event.type === 'tool_call' || event.type === 'tool_use' || event.type === 'tool_result'
    ).length,
    sourceSignalCount: input.sourceSignals.length,
    hasFinalOutcome: !!input.samples.find((sample) => sample.output.cleanAssistantOutcome),
    hasFailure: input.errors.length > 0 || input.trace.status === 'failed',
  }) + (input.confidenceAdjust ?? 0)));
  const status = statusFor(input.trace, blockers, confidence);
  const readyForMemoryBase = status === 'candidate' && blockers.length === 0;
  return {
    id: `memory_${input.kind}_${input.trace.latestRevisionId}_${input.trace.id}`,
    traceId: input.trace.id,
    revisionId: input.trace.latestRevisionId,
    sourceSessionId: input.trace.sourceSessionId,
    projectKey: input.trace.projectKey,
    title: input.title,
    kind: input.kind,
    status,
    riskLevel: input.trace.risk.level,
    confidence,
    summary: clean(input.summary),
    body: clean(input.body),
    triggers: input.triggers.map((item) => clean(item)).slice(0, 6),
    blockers,
    labels: Array.from(new Set([
      'kodax',
      input.kind,
      input.trace.runtime.surface ?? 'kodax-cli',
      input.trace.runtime.scope ?? 'unknown-scope',
      input.trace.risk.level,
      readyForMemoryBase ? 'ready_for_memory_base' : 'needs_memory_review',
      ...input.sourceSignals,
    ].filter(Boolean))),
    evidenceIds: input.evidence.map((item) => item.id),
    sourceEventIds: input.sourceEvents.map((event) => event.id),
    sampleIds: input.samples.map((sample) => sample.id),
    createdAt: input.trace.importedAt,
    updatedAt: input.trace.updatedAt,
    metadata: {
      generatedBy: 'traceops-memory-distiller-v1',
      traceStatus: input.trace.status,
      riskReasons: input.trace.risk.reasons,
      sourceSignals: input.sourceSignals,
      readyForMemoryBase,
    },
  };
}

export function generateMemoryCandidates(
  trace: RawTrace,
  events: RawTraceEvent[],
  evidence: RawEvidence[],
  errors: IngestError[],
  samples: TrainingSample[],
): MemoryCandidate[] {
  const activeEvents = events.filter((event) => event.active !== false);
  const toolEvents = activeEvents.filter((event) =>
    event.type === 'tool_call' || event.type === 'tool_use' || event.type === 'tool_result'
  );
  const firstUser = activeEvents.find((event) => event.type === 'message' && roleOf(event) === 'user');
  const finalAssistant = [...activeEvents].reverse().find((event) => event.type === 'message' && roleOf(event) === 'assistant');
  const userGoal = compactText(firstUser ? eventText(firstUser) : trace.title, 360);
  const finalOutcome = compactText(finalAssistant ? eventText(finalAssistant) : samples.find((sample) => sample.output.cleanAssistantOutcome)?.output.cleanAssistantOutcome, 520);
  const fileEvidence = evidence.filter((item) => item.kind.startsWith('file_') || item.kind === 'path_scope' || item.kind === 'search_scope');
  const checkEvidence = evidence.filter((item) => item.kind === 'check_result');
  const decisionEvidence = evidence.filter((item) => item.kind === 'decision');
  const candidates: MemoryCandidate[] = [];

  if (toolEvents.length > 0 || evidence.length > 0) {
    candidates.push(createCandidate({
      trace,
      kind: 'workflow_pattern',
      title: `${trace.title} / workflow memory`,
      summary: `可复用流程：${userGoal}`,
      body: [
        `User goal: ${userGoal}`,
        toolEvents.length > 0 ? `Tool path: ${toolEvents.slice(0, 8).map((event, index) => `${index + 1}. ${toolLabel(event)} - ${compactText(event.preview, 120)}`).join('\n')}` : undefined,
        evidence.length > 0 ? `Evidence: ${evidence.slice(0, 6).map((item) => `- ${item.kind}: ${evidenceLabel(item)}`).join('\n')}` : undefined,
        finalOutcome ? `Observed outcome: ${finalOutcome}` : undefined,
      ].filter(Boolean).join('\n\n'),
      triggers: ['相似项目目标', '相似工具调用链', '需要复用 KodaX 执行路径'],
      sourceSignals: ['workflow_pattern', toolEvents.length > 0 ? 'tool_chain' : 'evidence_chain'],
      evidence,
      sourceEvents: toolEvents,
      samples,
      errors,
      confidenceAdjust: 4,
    }));
  }

  if (fileEvidence.length > 0) {
    candidates.push(createCandidate({
      trace,
      kind: 'project_knowledge',
      title: `${trace.title} / project memory`,
      summary: `项目知识：${fileEvidence.slice(0, 3).map((item) => item.displayTarget ?? item.target).join(', ')}`,
      body: [
        `Project context from KodaX trace: ${trace.projectKey ?? 'unknown project'}`,
        `Goal: ${userGoal}`,
        `Relevant files and scopes:\n${fileEvidence.slice(0, 10).map((item) => `- ${item.kind}: ${item.displayTarget ?? item.target}${item.summary ? ` — ${item.summary}` : ''}`).join('\n')}`,
        finalOutcome ? `Outcome: ${finalOutcome}` : undefined,
      ].filter(Boolean).join('\n\n'),
      triggers: ['再次进入同一项目', '需要理解相关文件或搜索范围', '项目上下文复用'],
      sourceSignals: ['project_context', 'artifact_ledger'],
      evidence: fileEvidence,
      sourceEvents: toolEvents,
      samples,
      errors,
    }));
  }

  if (trace.status === 'failed' || errors.length > 0 || samples.some((sample) => sample.kind === 'repair')) {
    const repairSamples = samples.filter((sample) => sample.kind === 'repair');
    candidates.push(createCandidate({
      trace,
      kind: 'failure_recovery',
      title: `${trace.title} / failure memory`,
      summary: `失败恢复经验：${errors[0]?.message ?? trace.title}`,
      body: [
        `Goal: ${userGoal}`,
        errors.length > 0 ? `Failure signals:\n${errors.slice(0, 6).map((error) => `- ${error.errorType}: ${error.message}`).join('\n')}` : 'Failure signal inferred from trace or repair sample.',
        repairSamples.length > 0 ? `Repair sample outcome:\n${repairSamples.map((sample) => `- ${sample.output.cleanAssistantOutcome ?? sample.responsePreview}`).join('\n')}` : undefined,
        finalOutcome ? `Final observed outcome: ${finalOutcome}` : undefined,
      ].filter(Boolean).join('\n\n'),
      triggers: ['相似失败', '需要恢复执行', '需要避开已知错误路径'],
      sourceSignals: ['failure_recovery', errors.length > 0 ? 'ingest_error' : 'repair_sample'],
      evidence,
      sourceEvents: activeEvents.filter((event) => event.type === 'error_metadata' || event.type === 'tool_result'),
      samples: repairSamples.length > 0 ? repairSamples : samples,
      errors,
      confidenceAdjust: -4,
    }));
  }

  if (checkEvidence.length > 0 || decisionEvidence.length > 0) {
    const decisionLikeEvidence = [...decisionEvidence, ...checkEvidence];
    candidates.push(createCandidate({
      trace,
      kind: decisionEvidence.length > 0 ? 'decision_record' : 'tool_practice',
      title: `${trace.title} / decision memory`,
      summary: `决策与验证信号：${decisionLikeEvidence.slice(0, 3).map(evidenceLabel).join(' / ')}`,
      body: [
        `Goal: ${userGoal}`,
        `Decision/check evidence:\n${decisionLikeEvidence.slice(0, 8).map((item) => `- ${item.kind}: ${evidenceLabel(item)}`).join('\n')}`,
        finalOutcome ? `Outcome: ${finalOutcome}` : undefined,
      ].filter(Boolean).join('\n\n'),
      triggers: ['需要复用验证口径', '需要复用执行决策', '相似检查或验收场景'],
      sourceSignals: ['decision_or_check', checkEvidence.length > 0 ? 'check_result' : 'decision'],
      evidence: decisionLikeEvidence,
      sourceEvents: toolEvents,
      samples,
      errors,
      confidenceAdjust: 8,
    }));
  }

  return candidates;
}
