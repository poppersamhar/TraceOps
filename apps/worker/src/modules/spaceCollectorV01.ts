import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import os from 'node:os';
import path from 'node:path';

import { Router, type Response } from 'express';

import {
  listKodaXSessions,
  loadKodaXFullSession,
  resolveKodaXSessionsDir,
  sessionsDirExists,
  type KodaXSessionSummary,
} from '../../../../packages/kodax-connector/src/kodaxScanner';
import {
  applyPackageDeduplication,
  emptyEvaluationRedactionStats,
  mergeEvaluationRedactionStats,
  preprocessSpaceSession,
  SPACE_EVALUATION_CASE_SCHEMA,
  SPACE_EVALUATION_POLICY_VERSION,
  SPACE_EVALUATION_TRACE_SCHEMA,
  type EvaluationReadiness,
  type SpaceEvaluationCase,
  type SpaceEvaluationTrace,
} from './spaceEvaluationPreprocessor';

export const TRACEOPS_COLLECTOR_VERSION = '0.1.1';
export const TRACEOPS_COLLECTOR_SCHEMA = 'traceops-space-evaluation-package-v1';
export const TRACEOPS_CASE_INDEX_SCHEMA = 'traceops-space-evaluation-case-index-v1';

const DEFAULT_SESSION_LIMIT = 2_000;
const EPHEMERAL_TAGS = new Set(['space-ephemeral', 'quick-ask']);

export interface CollectorStatus {
  product: 'TraceOps Space Evaluation Collector';
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
    output: 'evaluation_json_gzip';
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
  evaluationCases: number;
  evaluationCandidates: number;
  evalReady: number;
  needsReview: number;
  privacyBlocked: number;
  incomplete: number;
  duplicateCases: number;
  failedSessions: number;
  excludedSessions: number;
  redactions: number;
  thinkingBlocksRemoved: number;
  structuredFieldsRedacted: number;
  compressedBytes: number;
  checksum: string;
}

export interface CollectorPackage {
  manifest: {
    schema: typeof TRACEOPS_COLLECTOR_SCHEMA;
    collectorVersion: typeof TRACEOPS_COLLECTOR_VERSION;
    generatedAt: string;
    packageId: string;
    contentChecksum: string;
    compatibility: {
      intendedConsumer: 'TraceOps v0.2.0 Agent Evaluation';
      traceSchema: typeof SPACE_EVALUATION_TRACE_SCHEMA;
      caseSchema: typeof SPACE_EVALUATION_CASE_SCHEMA;
      caseIndexSchema: typeof TRACEOPS_CASE_INDEX_SCHEMA;
      preprocessingPolicy: typeof SPACE_EVALUATION_POLICY_VERSION;
    };
    source: {
      product: 'KodaX Space';
      storage: 'shared_kodax_session_store';
      scope: 'user_sessions_only';
    };
    benchmarkPolicy: {
      defaultUsage: 'update_evidence';
      validationRequiresIndependentHoldout: true;
      freezeValidationBeforeHarnessChange: true;
      failedTasksRemainEligibleForIssueDiscovery: true;
    };
    counts: {
      discovered: number;
      eligible: number;
      processed: number;
      failed: number;
      excluded: number;
      evaluationCases: number;
      evalReady: number;
      needsReview: number;
      privacyBlocked: number;
      incomplete: number;
      duplicateCases: number;
      redactions: number;
      thinkingBlocksRemoved: number;
      structuredFieldsRedacted: number;
      pseudonymizedIdentifiers: number;
      truncatedValues: number;
      malformedRecords: number;
    };
    exclusions: Record<string, number>;
    processing: string[];
    notice: string;
  };
  qualityReport: {
    decisions: Record<EvaluationReadiness, number>;
    humanReviewRequired: number;
    automaticGraders: number;
    replayModes: Record<SpaceEvaluationCase['replay']['mode'], number>;
    failedChecks: Record<string, number>;
    warningChecks: Record<string, number>;
  };
  caseIndex: Array<{
    schema: typeof TRACEOPS_CASE_INDEX_SCHEMA;
    caseKey: string;
    sourceTraceKey: string;
    taskType: SpaceEvaluationCase['taskType'];
    difficulty: SpaceEvaluationCase['difficulty'];
    capabilityTags: string[];
    decision: EvaluationReadiness;
    qualityScore: number;
    humanReviewRequired: boolean;
    failedCheckIds: string[];
    warningCheckIds: string[];
    graderKind: SpaceEvaluationCase['grader']['kind'];
    replayMode: SpaceEvaluationCase['replay']['mode'];
    validationEligible: boolean;
    exportPayload: SpaceEvaluationTrace['exportPayload'];
  }>;
  evaluationTraces: SpaceEvaluationTrace[];
  evaluationCases: SpaceEvaluationCase[];
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
  return summary.scope !== 'managed-task-worker' && !EPHEMERAL_TAGS.has(summary.tag ?? '');
}

function decisionCounts(cases: SpaceEvaluationCase[]): Record<EvaluationReadiness, number> {
  return cases.reduce<Record<EvaluationReadiness, number>>((counts, item) => {
    counts[item.qualityGate.decision] += 1;
    return counts;
  }, { eval_ready: 0, needs_review: 0, privacy_blocked: 0, incomplete: 0 });
}

function increment(counts: Record<string, number>, key: string) {
  counts[key] = (counts[key] ?? 0) + 1;
}

function buildQualityReport(cases: SpaceEvaluationCase[]): CollectorPackage['qualityReport'] {
  const replayModes: CollectorPackage['qualityReport']['replayModes'] = { automatic: 0, assisted: 0, manual: 0 };
  const failedChecks: Record<string, number> = {};
  const warningChecks: Record<string, number> = {};
  for (const evaluationCase of cases) {
    replayModes[evaluationCase.replay.mode] += 1;
    for (const check of evaluationCase.qualityGate.checks) {
      if (check.status === 'fail') increment(failedChecks, check.id);
      if (check.status === 'warn') increment(warningChecks, check.id);
    }
  }
  return {
    decisions: decisionCounts(cases),
    humanReviewRequired: cases.filter((item) => item.qualityGate.humanReviewRequired).length,
    automaticGraders: cases.filter((item) => item.grader.kind === 'trace_signal').length,
    replayModes,
    failedChecks,
    warningChecks,
  };
}

function buildCaseIndex(
  traces: SpaceEvaluationTrace[],
  cases: SpaceEvaluationCase[],
): CollectorPackage['caseIndex'] {
  const payloadByTraceKey = new Map(traces.map((trace) => [trace.traceKey, trace.exportPayload]));
  return cases.map((evaluationCase) => ({
    schema: TRACEOPS_CASE_INDEX_SCHEMA,
    caseKey: evaluationCase.caseKey,
    sourceTraceKey: evaluationCase.sourceTraceKey,
    taskType: evaluationCase.taskType,
    difficulty: evaluationCase.difficulty,
    capabilityTags: evaluationCase.capabilityTags,
    decision: evaluationCase.qualityGate.decision,
    qualityScore: evaluationCase.qualityGate.score,
    humanReviewRequired: evaluationCase.qualityGate.humanReviewRequired,
    failedCheckIds: evaluationCase.qualityGate.checks.filter((check) => check.status === 'fail').map((check) => check.id),
    warningCheckIds: evaluationCase.qualityGate.checks.filter((check) => check.status === 'warn').map((check) => check.id),
    graderKind: evaluationCase.grader.kind,
    replayMode: evaluationCase.replay.mode,
    validationEligible: evaluationCase.benchmarkPromotion.validationEligible,
    exportPayload: payloadByTraceKey.get(evaluationCase.sourceTraceKey) ?? 'metadata_only',
  }));
}

export async function getCollectorStatus(sessionsDir = resolveKodaXSessionsDir()): Promise<CollectorStatus> {
  const exists = await sessionsDirExists(sessionsDir);
  const summaries = exists ? await listKodaXSessions(sessionsDir) : [];
  const eligible = summaries.filter(isEligible);
  const lastRun = latestRunId ? runs.get(latestRunId) : undefined;
  return {
    product: 'TraceOps Space Evaluation Collector',
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
      output: 'evaluation_json_gzip',
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
    managedWorker: discovered.filter((item) => item.scope === 'managed-task-worker').length,
    ephemeral: discovered.filter((item) => EPHEMERAL_TAGS.has(item.tag ?? '')).length,
    overLimit: Math.max(0, eligible.length - selected.length),
    unreadable: 0,
    emptyConversation: 0,
  };
  const redactions = emptyEvaluationRedactionStats();
  const evaluationTraces: SpaceEvaluationTrace[] = [];
  const evaluationCases: SpaceEvaluationCase[] = [];
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
      const result = preprocessSpaceSession(summary, full);
      malformedRecords += full.malformedCount;
      if (result.trace.counts.messages === 0) {
        exclusions.emptyConversation += 1;
        continue;
      }
      evaluationTraces.push(result.trace);
      evaluationCases.push(result.evaluationCase);
      mergeEvaluationRedactionStats(redactions, result.redactions);
    } catch {
      failedSessions += 1;
      exclusions.unreadable += 1;
    }
  }

  const duplicateCases = applyPackageDeduplication(evaluationTraces, evaluationCases);
  const decisions = decisionCounts(evaluationCases);
  const qualityReport = buildQualityReport(evaluationCases);
  const caseIndex = buildCaseIndex(evaluationTraces, evaluationCases);
  const packageId = `collector_${generatedAt.replace(/[-:.TZ]/g, '').slice(0, 14)}_${hash({ generatedAt, traces: evaluationTraces.map((item) => item.traceKey) }, 8)}`;
  const contentChecksum = createHash('sha256')
    .update(JSON.stringify({ qualityReport, caseIndex, evaluationTraces, evaluationCases }))
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
        intendedConsumer: 'TraceOps v0.2.0 Agent Evaluation',
        traceSchema: SPACE_EVALUATION_TRACE_SCHEMA,
        caseSchema: SPACE_EVALUATION_CASE_SCHEMA,
        caseIndexSchema: TRACEOPS_CASE_INDEX_SCHEMA,
        preprocessingPolicy: SPACE_EVALUATION_POLICY_VERSION,
      },
      source: {
        product: 'KodaX Space',
        storage: 'shared_kodax_session_store',
        scope: 'user_sessions_only',
      },
      benchmarkPolicy: {
        defaultUsage: 'update_evidence',
        validationRequiresIndependentHoldout: true,
        freezeValidationBeforeHarnessChange: true,
        failedTasksRemainEligibleForIssueDiscovery: true,
      },
      counts: {
        discovered: discovered.length,
        eligible: selected.length,
        processed: evaluationTraces.length,
        failed: failedSessions,
        excluded: excludedSessions,
        evaluationCases: evaluationCases.length,
        evalReady: decisions.eval_ready,
        needsReview: decisions.needs_review,
        privacyBlocked: decisions.privacy_blocked,
        incomplete: decisions.incomplete,
        duplicateCases,
        redactions: redactions.total,
        thinkingBlocksRemoved: redactions.thinkingBlocksRemoved,
        structuredFieldsRedacted: redactions.structuredFieldsRedacted,
        pseudonymizedIdentifiers: redactions.pseudonymizedIdentifiers,
        truncatedValues: redactions.truncatedValues,
        malformedRecords,
      },
      exclusions,
      processing: [
        '只接入 KodaX Space 用户主 Session，排除 managed worker 与临时 quick-ask Session',
        '保留完整事件图、有效与非有效分支、工具输入/结果和 Evidence 关系',
        '对结构化字段逐项脱敏，移除 thinking，匿名化 ID，并保留工具数据的换行与结构',
        '复用 Clean Trace 生成 Evidence Coverage、压缩指标、风险与治理摘要',
        '为每个 Trace 生成一个 Evaluation Case、成功判据、Grader 配置和 Replay 需求',
        '执行完整性、隐私、证据、回放、归因、污染与去重质量门禁',
        '默认标记为 update_evidence；Validation 必须在 Harness 修改前冻结独立 Holdout',
      ],
      notice: '该数据包由本机生成且不会自动上传。eval_ready 仅代表通过自动预处理门禁；正式 Benchmark 仍需在 v0.2.0 完成数据划分、冻结和治理审批。v0.2.0 应优先读取 caseIndex 建立 Review 队列，再按 sourceTraceKey 关联完整 Trace。',
    },
    qualityReport,
    caseIndex,
    evaluationTraces,
    evaluationCases,
  };
  const payload = gzipSync(Buffer.from(JSON.stringify(dataPackage), 'utf8'), { level: 9 });
  const date = generatedAt.slice(0, 10).replace(/-/g, '');
  const time = generatedAt.slice(11, 19).replace(/:/g, '');
  const filename = `traceops-space-evaluation-${date}-${time}-${evaluationCases.length}.json.gz`;
  const run: CollectorRun = {
    id: packageId,
    status: 'completed',
    generatedAt,
    filename,
    downloadUrl: `/api/v0.1/collector/runs/${encodeURIComponent(packageId)}/download`,
    sourceSessions: discovered.length,
    processedSessions: evaluationTraces.length,
    evaluationCases: evaluationCases.length,
    evaluationCandidates: evaluationCases.length,
    evalReady: decisions.eval_ready,
    needsReview: decisions.needs_review,
    privacyBlocked: decisions.privacy_blocked,
    incomplete: decisions.incomplete,
    duplicateCases,
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

  router.post('/collect', async (_req, res) => {
    if (collectionInFlight) {
      res.status(409).json({ error: '正在生成评测数据，请等待当前任务完成。' });
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

export type { SpaceEvaluationCase, SpaceEvaluationTrace } from './spaceEvaluationPreprocessor';
