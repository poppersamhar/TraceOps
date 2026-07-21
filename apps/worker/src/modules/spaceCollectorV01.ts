import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import os from 'node:os';
import path from 'node:path';

import { Router, type Response } from 'express';

import { redactEvaluationText } from '../../../../packages/governance/src/redaction';
import {
  listKodaXSessions,
  loadKodaXFullSession,
  resolveKodaXSessionsDir,
  sessionsDirExists,
  type KodaXFullSession,
  type KodaXSessionSummary,
} from '../../../../packages/kodax-connector/src/kodaxScanner';
import {
  emptyEvaluationRedactionStats,
  mergeEvaluationRedactionStats,
  preprocessSpaceWorkflowSession,
  SPACE_EVALUATION_POLICY_VERSION,
  SPACE_WORKFLOW_SESSION_SCHEMA,
  type SpaceWorkflowSession,
} from './spaceEvaluationPreprocessor';

export const TRACEOPS_COLLECTOR_VERSION = '0.1.2';
export const TRACEOPS_COLLECTOR_SCHEMA = 'traceops-space-workflow-package-v1';
export const TRACEOPS_SESSION_INDEX_SCHEMA = 'traceops-space-workflow-index-v1';

const DEFAULT_SESSION_LIMIT = Number.POSITIVE_INFINITY;

export interface CollectorStatus {
  product: 'TraceOps Space Workflow Collector';
  version: typeof TRACEOPS_COLLECTOR_VERSION;
  source: {
    name: 'KodaX Space';
    path: string;
    exists: boolean;
    detectedSessions: number;
    eligibleSessions: number;
    excludedSessions: number;
  };
  privacy: {
    automaticUpload: false;
    rawFilesModified: false;
    output: 'workflow_json_gzip';
  };
  lastRun?: CollectorRunSummary;
}

export interface CollectorRunSummary {
  id: string;
  status: 'completed';
  generatedAt: string;
  filename: string;
  downloadUrl: string;
  sourceSessions: number;
  processedSessions: number;
  mainSessions: number;
  workerSessions: number;
  linkedWorkerSessions: number;
  workerSessionsNeedingReview: number;
  conversationEntries: number;
  toolCalls: number;
  toolResults: number;
  skillUsages: number;
  sessionsWithMaskedData: number;
  failedSessions: number;
  excludedSessions: number;
  redactions: number;
  thinkingBlocksRemoved: number;
  structuredFieldsRedacted: number;
  compressedBytes: number;
  checksum: string;
}

export interface WorkflowSessionListItem {
  sessionKey: string;
  title: string;
  tag?: string;
  scope: 'main' | 'worker';
  createdAt?: string;
  messageCount: number;
  projectGroupKey: string;
}

export interface CollectorPackage {
  manifest: {
    schema: typeof TRACEOPS_COLLECTOR_SCHEMA;
    collectorVersion: typeof TRACEOPS_COLLECTOR_VERSION;
    generatedAt: string;
    packageId: string;
    contentChecksum: string;
    compatibility: {
      intendedConsumers: ['TraceOps Workflow Analysis', 'TraceOps v0.2.0 Evaluation Review'];
      sessionSchema: typeof SPACE_WORKFLOW_SESSION_SCHEMA;
      sessionIndexSchema: typeof TRACEOPS_SESSION_INDEX_SCHEMA;
      redactionPolicy: typeof SPACE_EVALUATION_POLICY_VERSION;
    };
    source: {
      product: 'KodaX Space';
      storage: 'shared_kodax_session_store';
      scope: 'user_and_managed_worker_sessions';
    };
    collectionPolicy: {
      preserveAllReadableSessions: true;
      preserveMainAndWorkerSessions: true;
      privacyHandling: 'field_level_masking';
      sessionsDroppedForPrivacy: false;
      evaluationDecisionsDeferred: true;
    };
    counts: {
      discovered: number;
      eligible: number;
      processed: number;
      failed: number;
      excluded: number;
      conversationEntries: number;
      transcriptEntries: number;
      toolCalls: number;
      toolResults: number;
      skillUsages: number;
      sessionsWithMaskedData: number;
      redactions: number;
      thinkingBlocksRemoved: number;
      structuredFieldsRedacted: number;
      pseudonymizedIdentifiers: number;
      truncatedValues: number;
      malformedRecords: number;
      mainSessions: number;
      workerSessions: number;
      linkedWorkerSessions: number;
      inferredWorkerSessions: number;
      orphanWorkerSessions: number;
      ambiguousWorkerSessions: number;
      workerSessionsNeedingReview: number;
    };
    exclusions: Record<string, number>;
    processing: string[];
    notice: string;
  };
  workflowReport: {
    sessions: number;
    mainSessions: number;
    workerSessions: number;
    conversationEntries: number;
    transcriptEntries: number;
    toolCalls: number;
    toolResults: number;
    skillUsages: number;
    sessionsWithMaskedData: number;
    privateReasoningBlocksOmitted: number;
    workers: {
      total: number;
      linked: number;
      inferred: number;
      orphan: number;
      ambiguous: number;
      needsReview: number;
    };
  };
  sessionIndex: Array<{
    schema: typeof TRACEOPS_SESSION_INDEX_SCHEMA;
    sessionKey: string;
    scope: 'main' | 'worker';
    title: string;
    createdAt?: string;
    taskStatus: SpaceWorkflowSession['taskStatus'];
    linkStatus: SpaceWorkflowSession['topology']['linkStatus'];
    parentSessionKey?: string;
    childSessionKeys: string[];
    conversationEntries: number;
    transcriptEntries: number;
    toolCalls: number;
    toolResults: number;
    skills: string[];
    tools: string[];
    hasErrors: boolean;
    sensitiveValuesMasked: number;
  }>;
  sessions: SpaceWorkflowSession[];
}

type CollectorRun = CollectorRunSummary & {
  payload: Buffer;
};

const runs = new Map<string, CollectorRun>();
let latestRunId: string | undefined;
let collectionInFlight = false;

function hash(value: unknown, length = 24): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, length);
}

function sessionKey(summary: KodaXSessionSummary): string {
  return `space_session_${hash({ id: summary.id, projectKey: summary.projectKey })}`;
}

function projectGroupKey(summary: KodaXSessionSummary): string {
  return `space_scope_${hash(summary.projectKey ?? summary.gitRoot ?? 'unknown')}`;
}

function safePreviewText(value: string | undefined): string {
  return redactEvaluationText(value).clean;
}

function safeSourcePath(sessionsDir: string): string {
  const home = os.homedir();
  if (sessionsDir === home) return '~';
  if (sessionsDir.startsWith(`${home}${path.sep}`)) return `~${sessionsDir.slice(home.length)}`;
  return sessionsDir;
}

function collectorLimit(): number {
  const configured = Number(process.env.TRACEOPS_COLLECTOR_MAX_SESSIONS ?? DEFAULT_SESSION_LIMIT);
  return Number.isFinite(configured) && configured > 0 ? Math.floor(configured) : DEFAULT_SESSION_LIMIT;
}

function isEligible(summary: KodaXSessionSummary): boolean {
  return Boolean(summary.filePath);
}

export async function listSpaceWorkflowSessions(
  sessionsDir = resolveKodaXSessionsDir(),
): Promise<WorkflowSessionListItem[]> {
  if (!await sessionsDirExists(sessionsDir)) return [];
  const summaries = await listKodaXSessions(sessionsDir);
  return summaries.filter(isEligible).map((summary) => ({
    sessionKey: sessionKey(summary),
    title: safePreviewText(summary.title) || 'Untitled session',
    tag: summary.tag ? safePreviewText(summary.tag) : undefined,
    scope: summary.scope === 'managed-task-worker' ? 'worker' : 'main',
    createdAt: summary.createdAt,
    messageCount: summary.msgCount,
    projectGroupKey: projectGroupKey(summary),
  }));
}

export async function getSpaceWorkflowSession(
  requestedSessionKey: string,
  sessionsDir = resolveKodaXSessionsDir(),
): Promise<SpaceWorkflowSession | undefined> {
  if (!await sessionsDirExists(sessionsDir)) return undefined;
  const summaries = await listKodaXSessions(sessionsDir);
  const summary = summaries.find((item) => sessionKey(item) === requestedSessionKey);
  if (!summary) return undefined;
  const full = await loadKodaXFullSession(summary, sessionsDir);
  if (!full) return undefined;
  return preprocessSpaceWorkflowSession(summary, full).session;
}

interface ProcessedSession {
  summary: KodaXSessionSummary;
  full: KodaXFullSession;
  session: SpaceWorkflowSession;
}

type WorkerTopologyCounts = CollectorPackage['workflowReport']['workers'];

const SESSION_REFERENCE_TOKEN = /[A-Za-z0-9][A-Za-z0-9_-]{5,}/g;

function collectKnownSessionReferences(
  value: unknown,
  knownSessionIds: Set<string>,
  output: Set<string>,
  depth = 0,
  seen = new Set<object>(),
): void {
  if (depth > 12 || value === null || value === undefined) return;
  if (typeof value === 'string') {
    if (knownSessionIds.has(value)) output.add(value);
    for (const token of value.match(SESSION_REFERENCE_TOKEN) ?? []) {
      if (knownSessionIds.has(token)) output.add(token);
    }
    return;
  }
  if (typeof value !== 'object') return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const item of value) collectKnownSessionReferences(item, knownSessionIds, output, depth + 1, seen);
    return;
  }
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'filePath') continue;
    collectKnownSessionReferences(item, knownSessionIds, output, depth + 1, seen);
  }
}

function sessionReferenceSource(full: KodaXFullSession): unknown[] {
  return [
    full.runtimeInfo,
    full.messages,
    full.uiHistory,
    full.lineage,
    full.artifactLedger,
    full.errorMetadata,
    full.extensionRecords,
  ];
}

function sameProject(left: ProcessedSession, right: ProcessedSession): boolean {
  if (left.summary.projectKey && right.summary.projectKey) return left.summary.projectKey === right.summary.projectKey;
  if (left.full.projectKey && right.full.projectKey) return left.full.projectKey === right.full.projectKey;
  return Boolean(left.full.gitRoot && right.full.gitRoot && left.full.gitRoot === right.full.gitRoot);
}

function applyWorkerTopology(
  mainSessions: ProcessedSession[],
  workerSessions: ProcessedSession[],
): WorkerTopologyCounts {
  const mainIds = new Set(mainSessions.map((item) => item.summary.id));
  const workerIds = new Set(workerSessions.map((item) => item.summary.id));
  const mainById = new Map(mainSessions.map((item) => [item.summary.id, item]));
  const referencedWorkersByMain = new Map<string, Set<string>>();

  for (const main of mainSessions) {
    const references = new Set<string>();
    collectKnownSessionReferences(sessionReferenceSource(main.full), workerIds, references);
    for (const workerId of references) {
      const parents = referencedWorkersByMain.get(workerId) ?? new Set<string>();
      parents.add(main.summary.id);
      referencedWorkersByMain.set(workerId, parents);
    }
  }

  const counts: WorkerTopologyCounts = {
    total: workerSessions.length,
    linked: 0,
    inferred: 0,
    orphan: 0,
    ambiguous: 0,
    needsReview: 0,
  };

  for (const worker of workerSessions) {
    const explicitParentIds = new Set(referencedWorkersByMain.get(worker.summary.id) ?? []);
    collectKnownSessionReferences(sessionReferenceSource(worker.full), mainIds, explicitParentIds);
    const explicitParents = Array.from(explicitParentIds)
      .map((id) => mainById.get(id))
      .filter((item): item is ProcessedSession => Boolean(item));
    const sameProjectParents = mainSessions.filter((main) => sameProject(worker, main));
    const candidates = explicitParents.length > 0 ? explicitParents : sameProjectParents;
    const candidateParentTraceKeys = candidates.map((item) => item.session.sessionKey);

    let linkStatus: SpaceWorkflowSession['topology']['linkStatus'];
    let linkMethod: SpaceWorkflowSession['topology']['linkMethod'];
    let parent: ProcessedSession | undefined;
    if (explicitParents.length === 1) {
      linkStatus = 'linked';
      linkMethod = 'session_reference';
      parent = explicitParents[0];
    } else if (explicitParents.length > 1) {
      linkStatus = 'ambiguous';
      linkMethod = 'session_reference';
    } else if (sameProjectParents.length === 1) {
      linkStatus = 'inferred';
      linkMethod = 'single_main_same_project';
      parent = sameProjectParents[0];
    } else if (sameProjectParents.length > 1) {
      linkStatus = 'ambiguous';
      linkMethod = 'none';
    } else {
      linkStatus = 'orphan';
      linkMethod = 'none';
    }

    const requiresReview = linkStatus !== 'linked';
    worker.session.topology = {
      role: 'worker',
      linkStatus,
      linkMethod,
      parentTraceKey: parent?.session.sessionKey,
      childTraceKeys: [],
      candidateParentTraceKeys,
      requiresReview,
    };
    counts[linkStatus] += 1;

    if (parent) {
      parent.session.topology.childTraceKeys.push(worker.session.sessionKey);
    }
    if (requiresReview) {
      counts.needsReview += 1;
    }
  }

  return counts;
}

function buildWorkflowReport(sessions: SpaceWorkflowSession[], workers: WorkerTopologyCounts): CollectorPackage['workflowReport'] {
  return {
    sessions: sessions.length,
    mainSessions: sessions.filter((item) => item.topology.role === 'main').length,
    workerSessions: workers.total,
    conversationEntries: sessions.reduce((sum, item) => sum + item.conversation.length, 0),
    transcriptEntries: sessions.reduce((sum, item) => sum + item.transcript.length, 0),
    toolCalls: sessions.reduce((sum, item) => sum + item.workflow.toolCallEventRefs.length, 0),
    toolResults: sessions.reduce((sum, item) => sum + item.workflow.toolResultEventRefs.length, 0),
    skillUsages: sessions.reduce((sum, item) => sum + item.workflow.skills.length, 0),
    sessionsWithMaskedData: sessions.filter((item) => item.privacy.sensitiveValuesMasked > 0).length,
    privateReasoningBlocksOmitted: sessions.reduce((sum, item) => sum + item.privacy.privateReasoningBlocksOmitted, 0),
    workers,
  };
}

function buildSessionIndex(sessions: SpaceWorkflowSession[]): CollectorPackage['sessionIndex'] {
  return sessions.map((session) => ({
    schema: TRACEOPS_SESSION_INDEX_SCHEMA,
    sessionKey: session.sessionKey,
    scope: session.topology.role,
    title: session.title,
    createdAt: session.createdAt,
    taskStatus: session.taskStatus,
    linkStatus: session.topology.linkStatus,
    parentSessionKey: session.topology.parentTraceKey,
    childSessionKeys: session.topology.childTraceKeys,
    conversationEntries: session.conversation.length,
    transcriptEntries: session.transcript.length,
    toolCalls: session.workflow.toolCallEventRefs.length,
    toolResults: session.workflow.toolResultEventRefs.length,
    skills: session.workflow.skills,
    tools: session.workflow.tools,
    hasErrors: session.workflow.errorEventRefs.length > 0 || session.taskStatus === 'failed',
    sensitiveValuesMasked: session.privacy.sensitiveValuesMasked,
  }));
}

export async function getCollectorStatus(sessionsDir = resolveKodaXSessionsDir()): Promise<CollectorStatus> {
  const exists = await sessionsDirExists(sessionsDir);
  const summaries = exists ? await listKodaXSessions(sessionsDir) : [];
  const eligible = summaries.filter(isEligible);
  const lastRun = latestRunId ? runs.get(latestRunId) : undefined;
  return {
    product: 'TraceOps Space Workflow Collector',
    version: TRACEOPS_COLLECTOR_VERSION,
    source: {
      name: 'KodaX Space',
      path: safeSourcePath(sessionsDir),
      exists,
      detectedSessions: summaries.length,
      eligibleSessions: Math.min(eligible.length, collectorLimit()),
      excludedSessions: summaries.length - eligible.length + Math.max(0, eligible.length - collectorLimit()),
    },
    privacy: {
      automaticUpload: false,
      rawFilesModified: false,
      output: 'workflow_json_gzip',
    },
    lastRun: lastRun ? withoutPayload(lastRun) : undefined,
  };
}

function withoutPayload(run: CollectorRun): CollectorRunSummary {
  const { payload: _payload, ...summary } = run;
  return summary;
}

export async function collectSpaceSessions(sessionsDir = resolveKodaXSessionsDir()): Promise<CollectorRunSummary> {
  if (!await sessionsDirExists(sessionsDir)) {
    throw new Error(`未检测到 Space Session 目录：${safeSourcePath(sessionsDir)}`);
  }

  const generatedAt = new Date().toISOString();
  const discovered = await listKodaXSessions(sessionsDir);
  const eligible = discovered.filter(isEligible);
  const selected = eligible.slice(0, collectorLimit());
  const exclusions: Record<string, number> = {
    overLimit: Math.max(0, eligible.length - selected.length),
    unreadable: 0,
  };
  const redactions = emptyEvaluationRedactionStats();
  const processedMainSessions: ProcessedSession[] = [];
  const processedWorkerSessions: ProcessedSession[] = [];
  let failedSessions = 0;
  let malformedRecords = 0;

  for (const summary of selected) {
    try {
      const full = await loadKodaXFullSession(summary, sessionsDir);
      if (!full) {
        failedSessions += 1;
        exclusions.unreadable += 1;
        continue;
      }
      const result = preprocessSpaceWorkflowSession(summary, full);
      malformedRecords += full.malformedCount;
      const processed: ProcessedSession = {
        summary,
        full,
        session: result.session,
      };
      if (summary.scope === 'managed-task-worker') {
        processedWorkerSessions.push(processed);
      } else {
        processedMainSessions.push(processed);
      }
      mergeEvaluationRedactionStats(redactions, result.redactions);
    } catch {
      failedSessions += 1;
      exclusions.unreadable += 1;
    }
  }

  const workers = applyWorkerTopology(processedMainSessions, processedWorkerSessions);
  const sessions = [
    ...processedMainSessions.map((item) => item.session),
    ...processedWorkerSessions.map((item) => item.session),
  ];
  const workflowReport = buildWorkflowReport(sessions, workers);
  const sessionIndex = buildSessionIndex(sessions);
  const packageId = `collector_${generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}_${hash({ generatedAt, sessions: sessions.map((item) => item.sessionKey) }, 8)}`;
  const contentChecksum = createHash('sha256')
    .update(JSON.stringify({ workflowReport, sessionIndex, sessions }))
    .digest('hex');
  const excludedSessions = Object.values(exclusions).reduce((sum, value) => sum + value, 0);
  const dataPackage: CollectorPackage = {
    manifest: {
      schema: TRACEOPS_COLLECTOR_SCHEMA,
      collectorVersion: TRACEOPS_COLLECTOR_VERSION,
      generatedAt,
      packageId,
      contentChecksum,
      compatibility: {
        intendedConsumers: ['TraceOps Workflow Analysis', 'TraceOps v0.2.0 Evaluation Review'],
        sessionSchema: SPACE_WORKFLOW_SESSION_SCHEMA,
        sessionIndexSchema: TRACEOPS_SESSION_INDEX_SCHEMA,
        redactionPolicy: SPACE_EVALUATION_POLICY_VERSION,
      },
      source: {
        product: 'KodaX Space',
        storage: 'shared_kodax_session_store',
        scope: 'user_and_managed_worker_sessions',
      },
      collectionPolicy: {
        preserveAllReadableSessions: true,
        preserveMainAndWorkerSessions: true,
        privacyHandling: 'field_level_masking',
        sessionsDroppedForPrivacy: false,
        evaluationDecisionsDeferred: true,
      },
      counts: {
        discovered: discovered.length,
        eligible: selected.length,
        processed: sessions.length,
        failed: failedSessions,
        excluded: excludedSessions,
        conversationEntries: workflowReport.conversationEntries,
        transcriptEntries: workflowReport.transcriptEntries,
        toolCalls: workflowReport.toolCalls,
        toolResults: workflowReport.toolResults,
        skillUsages: workflowReport.skillUsages,
        sessionsWithMaskedData: workflowReport.sessionsWithMaskedData,
        redactions: redactions.total,
        thinkingBlocksRemoved: redactions.thinkingBlocksRemoved,
        structuredFieldsRedacted: redactions.structuredFieldsRedacted,
        pseudonymizedIdentifiers: redactions.pseudonymizedIdentifiers,
        truncatedValues: redactions.truncatedValues,
        malformedRecords,
        mainSessions: processedMainSessions.length,
        workerSessions: workers.total,
        linkedWorkerSessions: workers.linked,
        inferredWorkerSessions: workers.inferred,
        orphanWorkerSessions: workers.orphan,
        ambiguousWorkerSessions: workers.ambiguous,
        workerSessionsNeedingReview: workers.needsReview,
      },
      exclusions,
      processing: [
        '只读加载所有可解析的 KodaX Space 用户 Session、临时 Session 和 managed worker Session',
        '保留完整 Transcript、有效与非有效分支、工具输入/结果、Evidence、错误和运行信息',
        '对敏感值执行字段级遮罩和稳定匿名化，不因隐私信号删除或降级整个 Session',
        '保留 Skill、计划、工具执行、验证和完成阶段的可观察 Workflow 索引',
        'Worker 关系作为描述性拓扑保存；无法确定父级时仍完整保留',
        '不在采集阶段生成 Grader、筛选 Benchmark 或决定 Validation 准入',
      ],
      notice: '该数据包只在本机生成且不会自动上传。所有可解析 Session 都会在字段级脱敏后保留；Worker 拓扑仅用于帮助还原工作流，不会阻断数据。评测 Case、Grader、Holdout 和 Benchmark 决策统一延后到分析与评测阶段。',
    },
    workflowReport,
    sessionIndex,
    sessions,
  };
  const payload = gzipSync(Buffer.from(JSON.stringify(dataPackage), 'utf8'), { level: 9 });
  const date = generatedAt.slice(0, 10).replace(/-/g, '');
  const time = generatedAt.slice(11, 19).replace(/:/g, '');
  const filename = `traceops-space-workflows-${date}-${time}-${sessions.length}.json.gz`;
  const run: CollectorRun = {
    id: packageId,
    status: 'completed',
    generatedAt,
    filename,
    downloadUrl: `/api/v0.1/collector/runs/${encodeURIComponent(packageId)}/download`,
    sourceSessions: discovered.length,
    processedSessions: sessions.length,
    mainSessions: processedMainSessions.length,
    workerSessions: workers.total,
    linkedWorkerSessions: workers.linked,
    workerSessionsNeedingReview: workers.needsReview,
    conversationEntries: workflowReport.conversationEntries,
    toolCalls: workflowReport.toolCalls,
    toolResults: workflowReport.toolResults,
    skillUsages: workflowReport.skillUsages,
    sessionsWithMaskedData: workflowReport.sessionsWithMaskedData,
    failedSessions,
    excludedSessions,
    redactions: redactions.total,
    thinkingBlocksRemoved: redactions.thinkingBlocksRemoved,
    structuredFieldsRedacted: redactions.structuredFieldsRedacted,
    compressedBytes: payload.byteLength,
    checksum: contentChecksum,
    payload,
  };
  runs.set(run.id, run);
  latestRunId = run.id;
  while (runs.size > 5) runs.delete(runs.keys().next().value as string);
  return withoutPayload(run);
}

function sendPackage(res: Response, run: CollectorRun) {
  res.setHeader('Content-Type', 'application/gzip');
  res.setHeader('Content-Disposition', `attachment; filename="${run.filename}"`);
  res.setHeader('Content-Length', String(run.payload.byteLength));
  res.setHeader('X-TraceOps-Checksum-SHA256', run.checksum);
  res.send(run.payload);
}

export function createSpaceCollectorV01Router(): Router {
  const router = Router();

  router.get('/status', async (_req, res) => {
    try {
      res.json(await getCollectorStatus());
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.get('/sessions', async (_req, res) => {
    try {
      res.json({ sessions: await listSpaceWorkflowSessions() });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.get('/sessions/:sessionKey', async (req, res) => {
    try {
      const session = await getSpaceWorkflowSession(req.params.sessionKey);
      if (!session) {
        res.status(404).json({ error: 'Session 不存在或已经从本地目录移除。' });
        return;
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  router.post('/collect', async (_req, res) => {
    if (collectionInFlight) {
      res.status(409).json({ error: '正在整理 Workflow，请等待当前任务完成。' });
      return;
    }
    collectionInFlight = true;
    try {
      res.json(await collectSpaceSessions());
    } catch (error) {
      res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      collectionInFlight = false;
    }
  });

  router.get('/runs/:id', (req, res) => {
    const run = runs.get(req.params.id);
    if (!run) {
      res.status(404).json({ error: '数据包不存在或本地服务已重启，请重新收集。' });
      return;
    }
    res.json(withoutPayload(run));
  });

  router.get('/runs/:id/download', (req, res) => {
    const run = runs.get(req.params.id);
    if (!run) {
      res.status(404).json({ error: '数据包不存在或本地服务已重启，请重新收集。' });
      return;
    }
    sendPackage(res, run);
  });

  return router;
}

export function resetCollectorRunsForTesting() {
  runs.clear();
  latestRunId = undefined;
  collectionInFlight = false;
}

export function getCollectorPayloadForTesting(id: string): Buffer | undefined {
  return runs.get(id)?.payload;
}

export type { SpaceWorkflowSession } from './spaceEvaluationPreprocessor';
