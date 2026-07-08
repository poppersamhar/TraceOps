import { createHash } from 'node:crypto';

import type { KodaXFullSession, KodaXSessionSummary } from './kodaxScanner';
import { aggregateRisk, scanEvidenceRisk, scanTextRisk } from '../../governance/src/risk';
import type {
  EvidenceKind,
  RawEvidence,
  RawTrace,
  RawTraceEvent,
  RawTraceRevision,
  RiskLevel,
} from '../../trace-core/src/types';

interface NormalizedBundle {
  trace: RawTrace;
  revision: RawTraceRevision;
  events: RawTraceEvent[];
  evidence: RawEvidence[];
}

const normalizerVersion = 'p0-risk-v2';
const toolCardNormalizerVersion = 'ui-tool-cards-v1';

function sanitizeIdPart(value: string | undefined): string {
  return (value || 'unknown').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80);
}

function stableHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20);
}

function textPreview(value: unknown, max = 180): string {
  if (typeof value === 'string') return value.replace(/\s+/g, ' ').trim().slice(0, max);
  const text = JSON.stringify(value ?? '');
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

function messagePreview(message: Record<string, unknown>): string {
  const content = message.content;
  if (typeof content === 'string') return textPreview(content);
  if (Array.isArray(content)) {
    const textParts = content
      .map((block) => {
        if (!block || typeof block !== 'object') return '';
        const record = block as Record<string, unknown>;
        if (record.type === 'text' && typeof record.text === 'string') return record.text;
        if (record.type === 'tool_use') return `[tool_use ${String(record.name ?? '')}]`;
        if (record.type === 'tool_result') return '[tool_result]';
        if (record.type === 'thinking') return '[thinking]';
        return `[${String(record.type ?? 'block')}]`;
      })
      .filter(Boolean);
    return textPreview(textParts.join(' '));
  }
  return textPreview(content);
}

function contentBlocks(message: Record<string, unknown>): Record<string, unknown>[] {
  return Array.isArray(message.content)
    ? message.content.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item))
    : [];
}

function uiToolCards(uiHistory: Record<string, unknown>[]): Record<string, unknown>[] {
  return uiHistory.flatMap((item) => {
    if (item.type !== 'tool_group' || !Array.isArray(item.tools)) return [];
    return item.tools.filter((tool): tool is Record<string, unknown> => !!tool && typeof tool === 'object' && !Array.isArray(tool));
  });
}

function readString(record: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === 'string' ? value : undefined;
}

function normalizeKind(value: unknown): EvidenceKind {
  const allowed = new Set<EvidenceKind>([
    'file_read',
    'file_modified',
    'file_created',
    'file_deleted',
    'path_scope',
    'search_scope',
    'command_scope',
    'check_result',
    'decision',
    'image_input',
    'tombstone',
  ]);
  return typeof value === 'string' && allowed.has(value as EvidenceKind)
    ? value as EvidenceKind
    : 'decision';
}

function maxRisk(a: RiskLevel | undefined, b: RiskLevel): RiskLevel {
  const weight: Record<RiskLevel, number> = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 };
  return !a || weight[b] > weight[a] ? b : a;
}

export function normalizeKodaXSession(summary: KodaXSessionSummary, full: KodaXFullSession): NormalizedBundle {
  const now = new Date().toISOString();
  const projectKey = summary.projectKey ?? full.projectKey ?? sanitizeIdPart(full.gitRoot.split('/').at(-1));
  const traceId = `trace_kodax_${sanitizeIdPart(projectKey)}_${sanitizeIdPart(full.id)}`;
  const sourceHash = stableHash({
    normalizerVersion,
    toolCardNormalizerVersion,
    id: full.id,
    activeEntryId: full.lineage?.activeEntryId,
    lineageIds: full.lineage?.entries.map((entry) => entry.id),
    artifactIds: full.artifactLedger.map((entry) => entry.id),
    uiToolCards: uiToolCards(full.uiHistory).map((tool) => ({
      id: tool.id,
      name: tool.name,
      status: tool.status,
      startTime: tool.startTime,
      endTime: tool.endTime,
    })),
    errorMetadata: full.errorMetadata,
    malformedCount: full.malformedCount,
  });
  const revisionId = `rev_${sourceHash}`;
  const events: RawTraceEvent[] = [];
  const risks = [];
  let order = 0;
  let toolUseEvents = 0;
  let toolResultEvents = 0;
  const canonicalToolIds = new Set<string>();

  for (const entry of full.transcriptEntries) {
    const messageRisk = scanTextRisk(entry.message);
    risks.push(messageRisk);
    events.push({
      id: `${revisionId}_evt_${order + 1}`,
      traceId,
      revisionId,
      source: 'kodax_session',
      sourceEntryId: entry.entryId,
      parentEntryId: entry.parentId,
      occurredAt: entry.timestamp,
      order: order++,
      type: entry.type,
      role: entry.message.role === 'user' || entry.message.role === 'assistant' || entry.message.role === 'system'
        ? entry.message.role
        : undefined,
      active: entry.active,
      label: entry.type === 'message' ? `${String(entry.message.role ?? 'message')}` : entry.type,
      preview: entry.summary ?? messagePreview(entry.message),
      payload: entry,
      riskLevel: messageRisk.level,
    });

    for (const block of contentBlocks(entry.message)) {
      if (block.type === 'tool_use') {
        const blockId = typeof block.id === 'string' ? block.id : undefined;
        if (blockId) canonicalToolIds.add(blockId);
        const risk = scanTextRisk(block);
        risks.push(risk);
        toolUseEvents += 1;
        events.push({
          id: `${revisionId}_evt_${order + 1}`,
          traceId,
          revisionId,
          source: 'kodax_session',
          sourceEntryId: entry.entryId,
          parentEntryId: entry.parentId,
          occurredAt: entry.timestamp,
          order: order++,
          type: 'tool_use',
          active: entry.active,
          label: `Tool call: ${String(block.name ?? 'unknown')}`,
          preview: textPreview(block.input ?? block),
          payload: block,
          riskLevel: risk.level,
        });
      }
      if (block.type === 'tool_result') {
        const toolUseId = typeof block.tool_use_id === 'string' ? block.tool_use_id : undefined;
        if (toolUseId) canonicalToolIds.add(toolUseId);
        const risk = scanTextRisk(block);
        risks.push(risk);
        toolResultEvents += 1;
        events.push({
          id: `${revisionId}_evt_${order + 1}`,
          traceId,
          revisionId,
          source: 'kodax_session',
          sourceEntryId: entry.entryId,
          parentEntryId: entry.parentId,
          occurredAt: entry.timestamp,
          order: order++,
          type: 'tool_result',
          active: entry.active,
          label: `Tool result: ${String(block.tool_use_id ?? 'unknown')}`,
          preview: textPreview(block.content ?? block),
          payload: block,
          riskLevel: risk.level,
        });
      }
    }
  }

  for (const tool of uiToolCards(full.uiHistory)) {
    const id = readString(tool, 'id');
    const alreadyCanonical = id ? canonicalToolIds.has(id) : false;
    if (alreadyCanonical) continue;
    const risk = scanTextRisk(tool);
    risks.push(risk);
    toolUseEvents += 1;
    if (tool.output !== undefined || tool.error !== undefined) {
      toolResultEvents += 1;
    }
    const startTime = typeof tool.startTime === 'number'
      ? new Date(tool.startTime).toISOString()
      : now;
    events.push({
      id: `${revisionId}_evt_${order + 1}`,
      traceId,
      revisionId,
      source: 'kodax_session',
      sourceEntryId: id,
      occurredAt: startTime,
      order: order++,
      type: 'tool_call',
      active: true,
      label: `Tool card: ${String(tool.name ?? 'unknown')}`,
      preview: textPreview(tool.preview ?? tool.output ?? tool.error ?? tool.input ?? tool),
      payload: { source: 'uiHistory.tool_group', tool },
      riskLevel: risk.level,
    });
  }

  const evidence: RawEvidence[] = full.artifactLedger.map((raw, index) => {
    const kind = normalizeKind(raw.kind);
    const target = readString(raw, 'target') ?? 'unknown';
    const summaryText = readString(raw, 'summary');
    const metadata = raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata)
      ? raw.metadata as Record<string, unknown>
      : undefined;
    const risk = scanEvidenceRisk(kind, target, summaryText, metadata);
    risks.push(risk);
    return {
      id: `${revisionId}_ev_${index + 1}`,
      traceId,
      revisionId,
      source: 'kodax_artifact_ledger',
      sourceLedgerId: readString(raw, 'id') ?? `ledger_${index + 1}`,
      kind,
      sourceTool: readString(raw, 'sourceTool'),
      action: readString(raw, 'action'),
      target,
      displayTarget: readString(raw, 'displayTarget'),
      summary: summaryText,
      sessionEntryId: readString(raw, 'sessionEntryId'),
      timestamp: readString(raw, 'timestamp') ?? now,
      metadata,
      riskLevel: risk.level,
    };
  });

  for (const item of evidence) {
    events.push({
      id: `${revisionId}_evt_${order + 1}`,
      traceId,
      revisionId,
      source: 'kodax_session',
      sourceEntryId: item.sessionEntryId,
      occurredAt: item.timestamp,
      order: order++,
      type: 'artifact',
      label: `Evidence: ${item.kind}`,
      preview: item.summary ?? item.displayTarget ?? item.target,
      payload: item,
      riskLevel: item.riskLevel,
    });
  }

  if (full.errorMetadata) {
    const risk = scanTextRisk(full.errorMetadata);
    risks.push(risk);
    events.push({
      id: `${revisionId}_evt_${order + 1}`,
      traceId,
      revisionId,
      source: 'kodax_session',
      occurredAt: now,
      order: order++,
      type: 'error_metadata',
      label: 'Session error metadata',
      preview: textPreview(full.errorMetadata),
      payload: full.errorMetadata,
      riskLevel: maxRisk(risk.level, 'L1'),
    });
  }

  const risk = aggregateRisk(risks);
  const trace: RawTrace = {
    id: traceId,
    source: 'kodax',
    sourceSessionId: full.id,
    projectKey,
    title: full.title || summary.title,
    status: full.errorMetadata ? 'failed' : 'completed',
    ingestionStatus: 'imported',
    createdAt: full.createdAt,
    importedAt: now,
    updatedAt: now,
    runtime: {
      canonicalRepoRoot: readString(full.runtimeInfo, 'canonicalRepoRoot') ?? full.gitRoot,
      workspaceRoot: readString(full.runtimeInfo, 'workspaceRoot'),
      executionCwd: readString(full.runtimeInfo, 'executionCwd'),
      branch: readString(full.runtimeInfo, 'branch'),
      workspaceKind: full.runtimeInfo?.workspaceKind === 'managed' ? 'managed' : full.runtimeInfo?.workspaceKind === 'detected' ? 'detected' : undefined,
      surface: readString(full.runtimeInfo, 'surface') ?? 'kodax-cli',
      profileId: readString(full.runtimeInfo, 'profileId'),
      profileVersion: readString(full.runtimeInfo, 'profileVersion'),
      provider: readString(full.runtimeInfo, 'provider'),
      model: readString(full.runtimeInfo, 'model'),
      reasoningMode: readString(full.runtimeInfo, 'reasoningMode'),
      permissionMode: readString(full.runtimeInfo, 'permissionMode'),
      agentMode: readString(full.runtimeInfo, 'agentMode'),
      scope: full.scope,
    },
    counts: {
      messages: full.messages.length,
      activeMessages: full.activeMessages.length,
      lineageEntries: full.lineage?.entries.length ?? full.messages.length,
      transcriptEntries: full.transcriptEntries.length,
      artifactLedgerEntries: evidence.length,
      toolUseEvents,
      toolResultEvents,
      compactions: full.transcriptEntries.filter((entry) => entry.type === 'compaction').length,
      branchSummaries: full.transcriptEntries.filter((entry) => entry.type === 'branch_summary').length,
      goalEvents: full.lineage?.entries.filter((entry) => entry.type === 'goal').length ?? 0,
    },
    risk,
    latestRevisionId: revisionId,
    latestSourceHash: sourceHash,
  };

  const revision: RawTraceRevision = {
    id: revisionId,
    traceId,
    sourceHash,
    sourceMessageCount: full.messages.length,
    sourceLineageEntryCount: full.lineage?.entries.length ?? full.messages.length,
    sourceArtifactCount: evidence.length,
    importedAt: now,
    rawSnapshotRef: full.filePath,
  };

  return { trace, revision, events, evidence };
}
