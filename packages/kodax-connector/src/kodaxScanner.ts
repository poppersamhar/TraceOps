import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import type {
  KodaXRuntimeEventInput,
  KodaXRuntimeEventKind,
  KodaXTraceSpanInput,
  KodaXTraceSpanKind,
  RawTraceRuntime,
  TraceStatus,
} from '../../trace-core/src/types';

type JsonRecord = Record<string, unknown>;

export interface KodaXSessionSummary {
  id: string;
  filePath: string;
  projectKey?: string;
  tag?: string;
  title: string;
  msgCount: number;
  createdAt?: string;
  gitRoot?: string;
  runtimeInfo?: JsonRecord;
  scope?: 'user' | 'managed-task-worker';
}

export interface KodaXTranscriptEntry {
  entryId: string;
  parentId: string | null;
  timestamp: string;
  type: 'message' | 'compaction' | 'branch_summary';
  message: JsonRecord;
  active: boolean;
  summary?: string;
}

export interface KodaXFullSession {
  id: string;
  filePath: string;
  projectKey?: string;
  tag?: string;
  title: string;
  gitRoot: string;
  createdAt?: string;
  runtimeInfo?: JsonRecord;
  scope?: 'user' | 'managed-task-worker';
  messages: JsonRecord[];
  activeMessages: JsonRecord[];
  transcriptEntries: KodaXTranscriptEntry[];
  uiHistory: JsonRecord[];
  lineage?: { version: 2; activeEntryId: string | null; entries: JsonRecord[] };
  artifactLedger: JsonRecord[];
  errorMetadata?: JsonRecord;
  extensionRecords: JsonRecord[];
  malformedCount: number;
}

export interface KodaXRuntimeFileImport {
  filePath: string;
  projectRoot?: string;
  projectKey?: string;
  recordCount: number;
  malformedCount: number;
  events: KodaXRuntimeEventInput[];
  spans: KodaXTraceSpanInput[];
}

export interface KodaXRuntimeFileBatch {
  roots: string[];
  files: KodaXRuntimeFileImport[];
  events: KodaXRuntimeEventInput[];
  spans: KodaXTraceSpanInput[];
  malformedCount: number;
}

export function resolveKodaXSessionsDir(): string {
  if (process.env.KODAX_SESSIONS_DIR) return path.resolve(process.env.KODAX_SESSIONS_DIR);
  if (process.env.KODAX_PROFILE_DIR && path.isAbsolute(process.env.KODAX_PROFILE_DIR)) {
    return path.join(path.resolve(process.env.KODAX_PROFILE_DIR), 'sessions');
  }
  if (process.env.KODAX_HOME && path.isAbsolute(process.env.KODAX_HOME)) {
    return path.join(path.resolve(process.env.KODAX_HOME), 'sessions');
  }
  return path.join(os.homedir(), '.kodax', 'sessions');
}

function isSessionJsonl(name: string): boolean {
  return name.endsWith('.jsonl')
    && !name.endsWith('.archive.jsonl')
    && !name.endsWith('.islands.jsonl')
    && !name.startsWith('.');
}

async function collectSessionFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isFile() && isSessionJsonl(entry.name)) {
      out.push(entryPath);
      continue;
    }
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      out.push(...await collectSessionFiles(entryPath));
    }
  }
  return out;
}

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

function readString(record: JsonRecord | undefined, key: string): string | undefined {
  const value = record?.[key];
  return typeof value === 'string' ? value : undefined;
}

function readNumber(record: JsonRecord | undefined, key: string): number | undefined {
  const value = record?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readNestedString(record: JsonRecord | undefined, paths: string[][]): string | undefined {
  for (const keys of paths) {
    let cursor: unknown = record;
    for (const key of keys) {
      const current = asRecord(cursor);
      cursor = current?.[key];
    }
    if (typeof cursor === 'string' && cursor.trim()) return cursor;
  }
  return undefined;
}

function readNestedRecord(record: JsonRecord | undefined, paths: string[][]): JsonRecord | undefined {
  for (const keys of paths) {
    let cursor: unknown = record;
    for (const key of keys) {
      const current = asRecord(cursor);
      cursor = current?.[key];
    }
    const next = asRecord(cursor);
    if (next) return next;
  }
  return undefined;
}

function readScope(record: JsonRecord | undefined): 'user' | 'managed-task-worker' | undefined {
  return record?.scope === 'managed-task-worker' ? 'managed-task-worker' : 'user';
}

function projectKeyFromFile(sessionsDir: string, filePath: string): string | undefined {
  const rel = path.relative(sessionsDir, filePath);
  const parts = rel.split(path.sep);
  if (parts.length > 1 && parts[0] !== 'archived') return parts[0];
  return undefined;
}

function parseLines(text: string): { records: JsonRecord[]; malformedCount: number } {
  const records: JsonRecord[] = [];
  let malformedCount = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line) as unknown;
      const record = asRecord(parsed);
      if (record) records.push(record);
    } catch {
      malformedCount += 1;
    }
  }
  return { records, malformedCount };
}

function parseRuntimeRecords(text: string): { records: JsonRecord[]; malformedCount: number } {
  const trimmed = text.trim();
  if (!trimmed) return { records: [], malformedCount: 0 };

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return {
          records: parsed.filter((item): item is JsonRecord => !!asRecord(item)),
          malformedCount: parsed.filter((item) => !asRecord(item)).length,
        };
      }
      const root = asRecord(parsed);
      if (!root) return { records: [], malformedCount: 1 };
      const nested = [
        root.events,
        root.spans,
        root.records,
        root.items,
      ].filter(Array.isArray).flat();
      if (nested.length > 0) {
        return {
          records: nested.filter((item): item is JsonRecord => !!asRecord(item)),
          malformedCount: nested.filter((item) => !asRecord(item)).length,
        };
      }
      return { records: [root], malformedCount: 0 };
    } catch {
      // Fall back to JSONL parsing below.
    }
  }

  return parseLines(text);
}

function normalizedString(value: unknown, max = 500): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.trim();
  return text ? text.slice(0, max) : undefined;
}

function normalizedIsoTime(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function runtimeScope(value: unknown): RawTraceRuntime['scope'] | undefined {
  return value === 'user' || value === 'managed-task-worker' ? value : undefined;
}

function workspaceKind(value: unknown): RawTraceRuntime['workspaceKind'] | undefined {
  return value === 'detected' || value === 'managed' ? value : undefined;
}

function normalizeRuntimeSnapshot(record: JsonRecord | undefined): Partial<RawTraceRuntime> | undefined {
  const runtime = readNestedRecord(record, [['runtime'], ['runtimeInfo']]) ?? record;
  if (!runtime) return undefined;
  const snapshot: Partial<RawTraceRuntime> = {
    canonicalRepoRoot: normalizedString(runtime.canonicalRepoRoot ?? runtime.gitRoot),
    workspaceRoot: normalizedString(runtime.workspaceRoot),
    executionCwd: normalizedString(runtime.executionCwd ?? runtime.cwd),
    branch: normalizedString(runtime.branch, 180),
    workspaceKind: workspaceKind(runtime.workspaceKind),
    surface: normalizedString(runtime.surface, 120),
    profileId: normalizedString(runtime.profileId, 180),
    profileVersion: normalizedString(runtime.profileVersion, 120),
    provider: normalizedString(runtime.provider, 120),
    model: normalizedString(runtime.model, 180),
    reasoningMode: normalizedString(runtime.reasoningMode, 120),
    permissionMode: normalizedString(runtime.permissionMode, 120),
    agentMode: normalizedString(runtime.agentMode, 120),
    scope: runtimeScope(runtime.scope),
  };
  return Object.values(snapshot).some((item) => item !== undefined) ? snapshot : undefined;
}

function unwrapRuntimeRecord(record: JsonRecord): JsonRecord {
  const payload = asRecord(record.payload);
  return asRecord(record.span)
    ?? asRecord(record.event)
    ?? asRecord(record.record)
    ?? asRecord(payload?.event)
    ?? record;
}

function fileStem(filePath: string): string {
  return path.basename(filePath).replace(/\.(jsonl|ndjson|json)$/i, '');
}

function runtimeSessionId(record: JsonRecord, fallback: string): string | undefined {
  return readNestedString(record, [
    ['sessionId'],
    ['sourceSessionId'],
    ['attributes', 'sessionId'],
    ['attributes', 'sourceSessionId'],
    ['metadata', 'sessionId'],
    ['metadata', 'sourceSessionId'],
    ['hostMetadata', 'sessionId'],
    ['workflowCorrelation', 'sessionId'],
    ['payload', 'sessionId'],
    ['payload', 'hostMetadata', 'sessionId'],
  ]) ?? fallback;
}

function runtimeProjectKey(record: JsonRecord, fallback?: string): string | undefined {
  return readNestedString(record, [
    ['projectKey'],
    ['attributes', 'projectKey'],
    ['metadata', 'projectKey'],
    ['hostMetadata', 'projectKey'],
    ['payload', 'projectKey'],
    ['payload', 'hostMetadata', 'projectKey'],
  ]) ?? fallback;
}

function runtimeGitRoot(record: JsonRecord, fallback?: string): string | undefined {
  return readNestedString(record, [
    ['gitRoot'],
    ['canonicalRepoRoot'],
    ['attributes', 'gitRoot'],
    ['attributes', 'canonicalRepoRoot'],
    ['metadata', 'gitRoot'],
    ['hostMetadata', 'gitRoot'],
  ]) ?? fallback;
}

const traceSpanKinds = new Set<KodaXTraceSpanKind>(['agent', 'model', 'tool', 'workflow', 'handoff', 'eval', 'custom']);

function traceSpanKind(value: unknown): KodaXTraceSpanKind | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.toLowerCase().replace(/-/g, '_');
  if (traceSpanKinds.has(normalized as KodaXTraceSpanKind)) return normalized as KodaXTraceSpanKind;
  if (normalized === 'generation' || normalized === 'llm' || normalized === 'model_call') return 'model';
  if (normalized === 'tool_call' || normalized === 'tool_use' || normalized === 'tool_result') return 'tool';
  if (normalized === 'guardrail' || normalized === 'stop_hook' || normalized === 'compaction' || normalized === 'fanout') return 'custom';
  return undefined;
}

function traceSpanStatus(value: unknown): KodaXTraceSpanInput['status'] | undefined {
  if (value === 'ok' || value === 'error' || value === 'cancelled') return value;
  if (value === 'failed' || value === 'failure') return 'error';
  if (value === 'canceled') return 'cancelled';
  if (value === 'completed' || value === 'succeeded' || value === 'success') return 'ok';
  return undefined;
}

function workflowRuntimeKind(value: unknown): KodaXRuntimeEventKind | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.toLowerCase().replace(/[-.]/g, '_');
  if (
    normalized === 'session_started'
    || normalized === 'session_updated'
    || normalized === 'message'
    || normalized === 'tool_use'
    || normalized === 'tool_result'
    || normalized === 'artifact'
    || normalized === 'workflow_phase'
    || normalized === 'child_agent'
    || normalized === 'handoff'
    || normalized === 'session_completed'
    || normalized === 'session_failed'
    || normalized === 'custom'
  ) return normalized as KodaXRuntimeEventKind;
  if (normalized === 'workflow_started' || normalized === 'phase_started' || normalized === 'phase_completed' || normalized === 'synthesis_completed') return 'workflow_phase';
  if (normalized === 'agent_spawned' || normalized === 'agent_completed' || normalized === 'agent_failed' || normalized === 'agent_summary_updated') return 'child_agent';
  if (normalized === 'artifact_written') return 'artifact';
  if (normalized === 'workflow_completed') return 'workflow_phase';
  if (normalized === 'workflow_failed') return 'workflow_phase';
  return undefined;
}

function traceStatus(value: unknown): TraceStatus | undefined {
  if (value === 'running' || value === 'completed' || value === 'failed' || value === 'unknown') return value;
  if (value === 'workflow_failed' || value === 'agent_failed' || value === 'error') return 'failed';
  if (value === 'workflow_completed' || value === 'completed') return 'completed';
  return undefined;
}

function normalizeTraceFileSpan(record: JsonRecord, filePath: string, projectRoot?: string, projectKey?: string): KodaXTraceSpanInput | undefined {
  const raw = unwrapRuntimeRecord(record);
  const fallbackSessionId = normalizedString(readString(raw, 'traceId'), 180) ?? fileStem(filePath);
  const sessionId = runtimeSessionId(raw, fallbackSessionId);
  const kind = traceSpanKind(raw.kind ?? raw.type ?? raw.spanType ?? raw.name);
  const name = normalizedString(raw.name ?? raw.label ?? raw.type ?? raw.kind, 240);
  if (!sessionId || !kind || !name) return undefined;
  const attributes: Record<string, unknown> = {
    ...asRecord(raw.attributes),
    ...asRecord(raw.metadata),
    sourceFile: filePath,
    sourceKind: 'kodax_trace_file',
  };
  return {
    spanId: normalizedString(raw.spanId ?? raw.id, 220),
    traceId: normalizedString(raw.traceId, 220),
    sessionId,
    projectKey: runtimeProjectKey(raw, projectKey),
    title: normalizedString(raw.title ?? raw.workflowName ?? raw.goal, 240),
    gitRoot: runtimeGitRoot(raw, projectRoot),
    scope: runtimeScope(raw.scope ?? attributes.scope),
    runtime: normalizeRuntimeSnapshot(raw),
    kind,
    name,
    parentSpanId: normalizedString(raw.parentSpanId ?? raw.parentId, 220),
    startedAt: normalizedIsoTime(raw.startedAt ?? raw.startTime ?? raw.start_time ?? raw.timestamp),
    endedAt: normalizedIsoTime(raw.endedAt ?? raw.endTime ?? raw.end_time ?? raw.completedAt ?? raw.timestamp),
    status: traceSpanStatus(raw.status),
    input: raw.input,
    output: raw.output ?? raw.result ?? raw.resultSummary,
    error: raw.error,
    attributes,
  };
}

function normalizeWorkflowFileEvent(record: JsonRecord, filePath: string, projectRoot?: string, projectKey?: string): KodaXRuntimeEventInput | undefined {
  const raw = unwrapRuntimeRecord(record);
  const eventType = raw.eventType ?? raw.type ?? raw.kind ?? raw.name ?? raw.status;
  const kind = workflowRuntimeKind(eventType);
  if (!kind) return undefined;
  const sessionId = runtimeSessionId(raw, fileStem(filePath));
  if (!sessionId) return undefined;
  const label = normalizedString(raw.label ?? raw.name ?? eventType, 240) ?? kind.replace(/_/g, ' ');
  const preview = normalizedString(
    raw.preview
      ?? raw.summary
      ?? raw.resultSummary
      ?? raw.latestMessage
      ?? raw.message
      ?? raw.status,
    1000,
  );
  return {
    eventId: normalizedString(raw.eventId ?? raw.id ?? `${fileStem(filePath)}_${raw.sequence ?? raw.index ?? raw.timestamp ?? label}`, 220),
    sessionId,
    projectKey: runtimeProjectKey(raw, projectKey),
    title: normalizedString(raw.title ?? raw.workflowName ?? raw.goal, 240),
    gitRoot: runtimeGitRoot(raw, projectRoot),
    scope: runtimeScope(raw.scope),
    runtime: normalizeRuntimeSnapshot(raw),
    kind,
    label,
    preview,
    payload: {
      ...raw,
      sourceFile: filePath,
      sourceKind: 'kodax_workflow_file',
    },
    occurredAt: normalizedIsoTime(raw.occurredAt ?? raw.timestamp ?? raw.startedAt ?? raw.endedAt ?? raw.updatedAt ?? raw.createdAt),
    parentEntryId: normalizedString(raw.parentEntryId ?? raw.parentId ?? raw.parentSpanId, 220),
    sourceEntryId: normalizedString(raw.sourceEntryId ?? raw.id, 220),
    status: traceStatus(raw.status ?? eventType),
  };
}

function isMessage(value: unknown): value is JsonRecord {
  const record = asRecord(value);
  return !!record
    && (record.role === 'user' || record.role === 'assistant' || record.role === 'system')
    && ('content' in record);
}

function summaryMessage(summary: string, type: 'compaction' | 'branch_summary'): JsonRecord {
  if (type === 'branch_summary') {
    return {
      role: 'user',
      content: `The following is a summary of a branch that this conversation came back from:\n\n<summary>\n${summary}\n</summary>`,
    };
  }
  return {
    role: 'system',
    content: `[对话历史摘要]\n\n${summary}`,
  };
}

function collectActiveIds(entries: JsonRecord[], activeEntryId: string | null): Set<string> {
  const byId = new Map<string, JsonRecord>();
  for (const entry of entries) {
    const id = readString(entry, 'id');
    if (id) byId.set(id, entry);
  }

  const activeIds = new Set<string>();
  let cursor: string | null | undefined = activeEntryId;
  while (cursor) {
    const entry = byId.get(cursor);
    if (!entry) break;
    activeIds.add(cursor);
    const parent = entry.parentId;
    cursor = typeof parent === 'string' ? parent : null;
  }
  return activeIds;
}

function buildTranscriptEntries(lineageEntries: JsonRecord[], activeEntryId: string | null): KodaXTranscriptEntry[] {
  const activeIds = collectActiveIds(lineageEntries, activeEntryId);
  const out: KodaXTranscriptEntry[] = [];

  for (const entry of lineageEntries) {
    const id = readString(entry, 'id');
    const timestamp = readString(entry, 'timestamp');
    const type = readString(entry, 'type');
    if (!id || !timestamp) continue;

    const parentId = typeof entry.parentId === 'string' ? entry.parentId : null;
    if (type === 'message' && isMessage(entry.message)) {
      out.push({
        entryId: id,
        parentId,
        timestamp,
        type: 'message',
        message: entry.message,
        active: activeIds.has(id),
      });
      continue;
    }

    if ((type === 'compaction' || type === 'branch_summary') && typeof entry.summary === 'string') {
      out.push({
        entryId: id,
        parentId,
        timestamp,
        type,
        message: summaryMessage(entry.summary, type),
        active: activeIds.has(id),
        summary: entry.summary,
      });
    }
  }
  return out;
}

function normalizeSessionRecords(sessionsDir: string, filePath: string, records: JsonRecord[], malformedCount: number): KodaXFullSession | null {
  const meta = records.find((record) => record._type === 'meta');
  if (!meta) return null;

  const metaUpdates = records.filter((record) => record._type === 'meta_update');
  const lastMetaUpdate = metaUpdates.at(-1);
  const id = readString(meta, 'id') ?? path.basename(filePath, '.jsonl');
  const title = readString(lastMetaUpdate, 'title') ?? readString(meta, 'title') ?? 'Untitled KodaX session';
  const gitRoot = readString(meta, 'gitRoot') ?? '';
  const runtimeInfo = asRecord(meta.runtimeInfo);
  const uiHistorySource = Array.isArray(lastMetaUpdate?.uiHistory)
    ? lastMetaUpdate.uiHistory
    : Array.isArray(meta.uiHistory)
      ? meta.uiHistory
      : [];
  const uiHistory = uiHistorySource.filter((item): item is JsonRecord => !!item && typeof item === 'object' && !Array.isArray(item));
  const scope = readScope(meta);
  const projectKey = projectKeyFromFile(sessionsDir, filePath);
  const activeEntryId =
    readString(lastMetaUpdate, 'activeEntryId')
    ?? readString(meta, 'activeEntryId')
    ?? null;

  const lineageEntries: JsonRecord[] = [];
  const artifactLedger: JsonRecord[] = [];
  const extensionRecords: JsonRecord[] = [];
  const legacyMessages: JsonRecord[] = [];

  for (const record of records) {
    if (record._type === 'lineage_entry' && asRecord(record.entry)) {
      lineageEntries.push(record.entry as JsonRecord);
    } else if (record._type === 'artifact_ledger_entry' && asRecord(record.entry)) {
      artifactLedger.push(record.entry as JsonRecord);
    } else if (record._type === 'extension_record' && asRecord(record.record)) {
      extensionRecords.push(record.record as JsonRecord);
    } else if (isMessage(record)) {
      legacyMessages.push(record);
    }
  }

  const lineage = lineageEntries.length > 0
    ? { version: 2 as const, activeEntryId, entries: lineageEntries }
    : undefined;
  const transcriptEntries = lineage
    ? buildTranscriptEntries(lineage.entries, lineage.activeEntryId)
    : legacyMessages.map((message, index) => ({
      entryId: `legacy_${index + 1}`,
      parentId: index > 0 ? `legacy_${index}` : null,
      timestamp: readString(meta, 'createdAt') ?? new Date(0).toISOString(),
      type: 'message' as const,
      message,
      active: true,
    }));
  const activeMessages = transcriptEntries
    .filter((entry) => entry.active && entry.type === 'message')
    .map((entry) => entry.message);

  return {
    id,
    filePath,
    projectKey,
    tag: readString(lastMetaUpdate, 'tag') ?? readString(meta, 'tag'),
    title,
    gitRoot,
    createdAt: readString(meta, 'createdAt'),
    runtimeInfo,
    scope,
    messages: transcriptEntries.map((entry) => entry.message),
    activeMessages,
    transcriptEntries,
    uiHistory,
    lineage,
    artifactLedger,
    errorMetadata: asRecord(meta.errorMetadata),
    extensionRecords,
    malformedCount,
  };
}

export async function listKodaXSessions(sessionsDir = resolveKodaXSessionsDir()): Promise<KodaXSessionSummary[]> {
  const files = await collectSessionFiles(sessionsDir);
  const summaries: KodaXSessionSummary[] = [];

  for (const file of files) {
    try {
      const text = await fs.readFile(file, 'utf8');
      const firstLine = text.split(/\r?\n/).find((line) => line.trim());
      if (!firstLine) continue;
      const first = asRecord(JSON.parse(firstLine));
      if (!first || first._type !== 'meta') continue;
      summaries.push({
        id: readString(first, 'id') ?? path.basename(file, '.jsonl'),
        filePath: file,
        projectKey: projectKeyFromFile(sessionsDir, file),
        tag: readString(first, 'tag'),
        title: readString(first, 'title') ?? 'Untitled KodaX session',
        msgCount: typeof first.activeMessageCount === 'number' ? first.activeMessageCount : 0,
        createdAt: readString(first, 'createdAt'),
        gitRoot: readString(first, 'gitRoot'),
        runtimeInfo: asRecord(first.runtimeInfo),
        scope: readScope(first),
      });
    } catch {
      continue;
    }
  }

  return summaries.sort((a, b) => (b.createdAt ?? b.id).localeCompare(a.createdAt ?? a.id));
}

export async function loadKodaXFullSession(summary: KodaXSessionSummary, sessionsDir = resolveKodaXSessionsDir()): Promise<KodaXFullSession | null> {
  const text = await fs.readFile(summary.filePath, 'utf8');
  const { records, malformedCount } = parseLines(text);
  return normalizeSessionRecords(sessionsDir, summary.filePath, records, malformedCount);
}

export async function sessionsDirExists(sessionsDir = resolveKodaXSessionsDir()): Promise<boolean> {
  try {
    const stat = await fs.stat(sessionsDir);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

function envRuntimeRoots(): string[] {
  return (process.env.KODAX_PROJECT_ROOTS ?? process.env.TRACEOPS_KODAX_PROJECT_ROOTS ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function runtimeRootsFromSummary(summary: KodaXSessionSummary): string[] {
  const runtimeInfo = asRecord(summary.runtimeInfo);
  return [
    summary.gitRoot,
    readString(runtimeInfo, 'canonicalRepoRoot'),
    readString(runtimeInfo, 'workspaceRoot'),
    readString(runtimeInfo, 'executionCwd'),
  ].filter((item): item is string => Boolean(item && path.isAbsolute(item)));
}

async function existingDirectory(dir: string): Promise<string | undefined> {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory() ? await fs.realpath(dir) : undefined;
  } catch {
    return undefined;
  }
}

async function resolveRuntimeRoots(summaries: KodaXSessionSummary[], extraRoots: string[] = []): Promise<string[]> {
  const candidates = [
    ...extraRoots,
    ...envRuntimeRoots(),
    ...summaries.flatMap(runtimeRootsFromSummary),
    path.join(os.homedir(), '.kodax'),
  ];
  const roots = new Set<string>();
  for (const candidate of candidates) {
    if (!candidate || !path.isAbsolute(candidate)) continue;
    const root = await existingDirectory(candidate);
    if (root) roots.add(root);
  }
  return Array.from(roots);
}

function runtimeFileDirsForRoot(root: string): string[] {
  const projectKodax = path.basename(root) === '.kodax' ? root : path.join(root, '.kodax');
  return [
    path.join(projectKodax, '.traces'),
    path.join(projectKodax, 'traces'),
    path.join(projectKodax, '.workflows'),
    path.join(projectKodax, 'workflows'),
    path.join(projectKodax, '.workflow-runs'),
    path.join(projectKodax, 'workflow-runs'),
    path.join(projectKodax, 'runs'),
  ];
}

function isRuntimeJsonFile(name: string): boolean {
  return /\.(jsonl|ndjson|json)$/i.test(name)
    && !name.endsWith('.archive.jsonl')
    && !name.startsWith('.');
}

async function collectRuntimeFilesFromDir(dir: string, depth = 0): Promise<string[]> {
  if (depth > 4) return [];
  const out: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isFile() && isRuntimeJsonFile(entry.name)) {
      out.push(entryPath);
      continue;
    }
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      out.push(...await collectRuntimeFilesFromDir(entryPath, depth + 1));
    }
  }
  return out;
}

async function collectKodaXRuntimeFiles(roots: string[]): Promise<Array<{ filePath: string; projectRoot?: string; projectKey?: string }>> {
  const files = new Map<string, { filePath: string; projectRoot?: string; projectKey?: string }>();
  for (const root of roots) {
    const dirs = runtimeFileDirsForRoot(root);
    for (const dir of dirs) {
      const found = await collectRuntimeFilesFromDir(dir);
      for (const filePath of found) {
        files.set(filePath, {
          filePath,
          projectRoot: path.basename(root) === '.kodax' ? undefined : root,
          projectKey: path.basename(root) === '.kodax' ? undefined : path.basename(root),
        });
      }
    }
  }
  return Array.from(files.values()).sort((a, b) => a.filePath.localeCompare(b.filePath));
}

async function loadKodaXRuntimeFile(input: { filePath: string; projectRoot?: string; projectKey?: string }): Promise<KodaXRuntimeFileImport> {
  const text = await fs.readFile(input.filePath, 'utf8');
  const { records, malformedCount } = parseRuntimeRecords(text);
  const events: KodaXRuntimeEventInput[] = [];
  const spans: KodaXTraceSpanInput[] = [];

  for (const record of records) {
    const span = normalizeTraceFileSpan(record, input.filePath, input.projectRoot, input.projectKey);
    if (span) spans.push(span);

    const event = normalizeWorkflowFileEvent(record, input.filePath, input.projectRoot, input.projectKey);
    if (event) events.push(event);
  }

  return {
    ...input,
    recordCount: records.length,
    malformedCount,
    events,
    spans,
  };
}

export async function loadKodaXRuntimeFiles(
  summaries: KodaXSessionSummary[],
  options: { roots?: string[]; limit?: number } = {},
): Promise<KodaXRuntimeFileBatch> {
  const roots = await resolveRuntimeRoots(summaries, options.roots);
  const candidates = (await collectKodaXRuntimeFiles(roots)).slice(0, Math.max(1, options.limit ?? 500));
  const files: KodaXRuntimeFileImport[] = [];
  for (const candidate of candidates) {
    try {
      const imported = await loadKodaXRuntimeFile(candidate);
      if (imported.events.length > 0 || imported.spans.length > 0 || imported.malformedCount > 0) {
        files.push(imported);
      }
    } catch {
      files.push({
        ...candidate,
        recordCount: 0,
        malformedCount: 1,
        events: [],
        spans: [],
      });
    }
  }

  return {
    roots,
    files,
    events: files.flatMap((file) => file.events),
    spans: files.flatMap((file) => file.spans),
    malformedCount: files.reduce((sum, file) => sum + file.malformedCount, 0),
  };
}
