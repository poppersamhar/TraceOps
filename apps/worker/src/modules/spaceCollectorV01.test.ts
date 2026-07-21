import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { gunzipSync } from 'node:zlib';

import { scanTextRisk } from '../../../../packages/governance/src/risk';
import {
  collectSpaceSessions,
  getCollectorPayloadForTesting,
  getCollectorStatus,
  resetCollectorRunsForTesting,
  type CollectorPackage,
} from './spaceCollectorV01';

async function writeSession(
  sessionsDir: string,
  name: string,
  meta: Record<string, unknown>,
  messages: Array<Record<string, unknown>> = [],
  extraRecords: Array<Record<string, unknown>> = [],
) {
  const dir = path.join(sessionsDir, 'fixture-project');
  await fs.mkdir(dir, { recursive: true });
  const entries = messages.map((message, index) => ({
    _type: 'lineage_entry',
    entry: {
      id: `entry-${name}-${index + 1}`,
      parentId: index === 0 ? null : `entry-${name}-${index}`,
      timestamp: `2026-07-17T10:0${index}:00.000Z`,
      type: 'message',
      message,
    },
  }));
  const lines = [
    {
      _type: 'meta',
      id: name,
      title: 'Evaluation fixture',
      createdAt: '2026-07-17T10:00:00.000Z',
      gitRoot: '/Users/alice/customer-project',
      activeEntryId: entries.at(-1)?.entry.id ?? null,
      activeMessageCount: messages.length,
      ...meta,
    },
    ...entries,
    ...extraRecords,
  ];
  await fs.writeFile(path.join(dir, `${name}.jsonl`), `${lines.map((item) => JSON.stringify(item)).join('\n')}\n`, 'utf8');
}

const calculationMessages = [
  { role: 'user', content: 'Calculate 2 + 2 and verify the result.' },
  {
    role: 'assistant',
    content: [{ type: 'tool_use', id: 'tool-calc-1', name: 'calculator', input: { expression: '2 + 2' } }],
  },
  {
    role: 'user',
    content: [{ type: 'tool_result', tool_use_id: 'tool-calc-1', content: { value: 4, status: 'ok' } }],
  },
  { role: 'assistant', content: 'The verified result is 4.' },
];

const verificationEvidence = [{
  _type: 'artifact_ledger_entry',
  entry: {
    id: 'check-calculation',
    kind: 'check_result',
    target: 'calculation-result',
    summary: 'Calculator result equals 4.',
    timestamp: '2026-07-17T10:04:00.000Z',
  },
}];

test('v0.1 credential risk distinguishes configuration mentions from high-confidence secrets', () => {
  const environmentMention = scanTextRisk('Update .env.example and document token=<placeholder>.');
  assert.equal(environmentMention.credentialRisk, 'mention');
  assert.equal(environmentMention.containsCredentialHint, false);
  assert.equal(environmentMention.level, 'L2');

  const exampleAssignment = scanTextRisk('api_key = example');
  assert.equal(exampleAssignment.credentialRisk, 'mention');
  assert.equal(exampleAssignment.containsCredentialHint, false);

  const highConfidence = scanTextRisk('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.realistic-token-material-123456');
  assert.equal(highConfidence.credentialRisk, 'high_confidence');
  assert.equal(highConfidence.containsCredentialHint, true);
  assert.equal(highConfidence.level, 'L4');

  const harmless = scanTextRisk('The token budget is 4096 and no credentials are configured.');
  assert.equal(harmless.credentialRisk, 'none');
  assert.equal(harmless.containsCredentialHint, false);
});

test('v0.1 collector produces complete Space evaluation traces, cases, and quality gates', async () => {
  resetCollectorRunsForTesting();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'traceops-collector-'));
  const sessionsDir = path.join(root, 'sessions');

  try {
    await writeSession(sessionsDir, 'ready-session', { tag: 'code', scope: 'user', title: 'Work from /Users/alice' }, calculationMessages, verificationEvidence);
    await writeSession(sessionsDir, 'duplicate-session', { tag: 'code', scope: 'user', title: 'Work from /Users/alice' }, calculationMessages, verificationEvidence);
    await writeSession(sessionsDir, 'privacy-session', { tag: 'partner', scope: 'user' }, [
      {
        role: 'user',
        content: 'Read /Users/alice/customer-project/report.md with api_key=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890 and reply to owner@example.com',
      },
      {
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'private chain of thought must never leave the machine' },
          { type: 'tool_use', id: 'secret-tool', name: 'connector', input: { api_key: 'nested-secret-value' } },
          { type: 'text', text: 'Completed from /Users/alice/customer-project/report.md' },
        ],
      },
    ]);
    await writeSession(sessionsDir, 'credential-mention-session', { tag: 'code', scope: 'user' }, [
      { role: 'user', content: 'Document the .env.example schema and show token=<placeholder>.' },
      { role: 'assistant', content: 'Documented the configuration schema without adding a real secret.' },
    ]);
    await writeSession(sessionsDir, 'ephemeral-session', { tag: 'quick-ask', scope: 'user' }, [
      { role: 'user', content: 'temporary' },
    ]);
    await writeSession(sessionsDir, 'worker-session', { tag: 'code', scope: 'managed-task-worker' }, [
      { role: 'user', content: 'internal worker' },
    ]);

    const before = await getCollectorStatus(sessionsDir);
    assert.equal(before.source.detectedSessions, 6);
    assert.equal(before.source.eligibleSessions, 4);
    assert.equal(before.source.excludedSessions, 2);

    const run = await collectSpaceSessions(sessionsDir);
    assert.equal(run.processedSessions, 4);
    assert.equal(run.evaluationCases, 4);
    assert.equal(run.evalReady, 1);
    assert.equal(run.needsReview, 2);
    assert.equal(run.privacyBlocked, 1);
    assert.equal(run.incomplete, 0);
    assert.equal(run.duplicateCases, 1);
    assert.ok(run.redactions >= 4);
    assert.ok(run.structuredFieldsRedacted >= 1);
    assert.equal(run.thinkingBlocksRemoved, 1);
    assert.match(run.filename, /^traceops-space-evaluation-\d{8}-\d{6}-4\.json\.gz$/);

    const payload = getCollectorPayloadForTesting(run.id);
    assert.ok(payload);
    const data = JSON.parse(gunzipSync(payload).toString('utf8')) as CollectorPackage;
    assert.equal(data.manifest.schema, 'traceops-space-evaluation-package-v1');
    assert.equal(data.manifest.collectorVersion, '0.1.1');
    assert.equal(data.manifest.compatibility.intendedConsumer, 'TraceOps v0.2.0 Agent Evaluation');
    assert.equal(data.manifest.compatibility.caseIndexSchema, 'traceops-space-evaluation-case-index-v1');
    assert.equal(data.manifest.benchmarkPolicy.defaultUsage, 'update_evidence');
    assert.deepEqual(data.qualityReport.decisions, {
      eval_ready: 1,
      needs_review: 2,
      privacy_blocked: 1,
      incomplete: 0,
    });
    assert.equal(data.qualityReport.humanReviewRequired, 3);
    assert.equal(data.caseIndex.length, 4);
    assert.equal(data.evaluationTraces.length, 4);
    assert.equal(data.evaluationCases.length, 4);
    assert.equal(
      data.manifest.contentChecksum,
      createHash('sha256').update(JSON.stringify({
        qualityReport: data.qualityReport,
        caseIndex: data.caseIndex,
        evaluationTraces: data.evaluationTraces,
        evaluationCases: data.evaluationCases,
      })).digest('hex'),
    );

    const readyCase = data.evaluationCases.find((item) => item.qualityGate.decision === 'eval_ready');
    assert.ok(readyCase);
    assert.equal(readyCase.usage, 'update_evidence');
    assert.equal(readyCase.grader.kind, 'trace_signal');
    assert.equal(readyCase.benchmarkPromotion.validationEligible, true);
    assert.equal(readyCase.benchmarkPromotion.independentHoldoutRequired, true);
    assert.ok(readyCase.expected.assertions.some((item) => item.source === 'check_evidence'));

    const readyTrace = data.evaluationTraces.find((item) => item.traceKey === readyCase.sourceTraceKey);
    assert.ok(readyTrace);
    assert.equal(readyTrace.preprocessing.evidenceCoverage.status, 'complete');
    assert.ok(readyTrace.lineage.entries.length >= 4);
    assert.ok(readyTrace.events.some((item) => JSON.stringify(item.payload).includes('2 + 2')));
    assert.ok(readyTrace.events.some((item) => item.type === 'tool_result'));
    const readyIndex = data.caseIndex.find((item) => item.caseKey === readyCase.caseKey);
    assert.ok(readyIndex);
    assert.equal(readyIndex.sourceTraceKey, readyCase.sourceTraceKey);
    assert.equal(readyIndex.graderKind, 'trace_signal');
    assert.equal(readyIndex.validationEligible, true);
    assert.equal(readyIndex.exportPayload, 'full_sanitized_trace');

    const duplicateCase = data.evaluationCases.find((item) => item.qualityGate.checks.some((check) => check.id === 'package_deduplication' && check.status === 'warn'));
    assert.ok(duplicateCase);
    assert.equal(duplicateCase.qualityGate.decision, 'needs_review');
    assert.equal(duplicateCase.benchmarkPromotion.validationEligible, false);

    const blockedCase = data.evaluationCases.find((item) => item.qualityGate.decision === 'privacy_blocked');
    assert.ok(blockedCase);
    assert.equal(blockedCase.input.task, '<WITHHELD_FOR_PRIVACY_REVIEW>');
    const blockedTrace = data.evaluationTraces.find((item) => item.traceKey === blockedCase.sourceTraceKey);
    assert.ok(blockedTrace);
    assert.equal(blockedTrace.exportPayload, 'metadata_only');
    assert.equal(blockedTrace.conversation.length, 0);
    assert.ok(blockedTrace.events.every((item) => item.payload === undefined && item.payloadOmitted === 'privacy_blocked'));
    const blockedIndex = data.caseIndex.find((item) => item.caseKey === blockedCase.caseKey);
    assert.equal(blockedIndex?.exportPayload, 'metadata_only');
    assert.equal(blockedIndex?.humanReviewRequired, true);

    const mentionCase = data.evaluationCases.find((item) => item.qualityGate.checks.some((check) => check.id === 'credential_privacy' && check.status === 'warn'));
    assert.ok(mentionCase);
    assert.equal(mentionCase.qualityGate.decision, 'needs_review');
    const mentionTrace = data.evaluationTraces.find((item) => item.traceKey === mentionCase.sourceTraceKey);
    assert.ok(mentionTrace);
    assert.equal(mentionTrace.exportPayload, 'full_sanitized_trace');
    assert.ok(mentionTrace.conversation.length > 0);

    const serialized = JSON.stringify(data);
    assert.doesNotMatch(serialized, /sk-proj-abcdefghijklmnopqrstuvwxyz1234567890/);
    assert.doesNotMatch(serialized, /nested-secret-value/);
    assert.doesNotMatch(serialized, /owner@example\.com/);
    assert.doesNotMatch(serialized, /\/Users\/alice/);
    assert.doesNotMatch(serialized, /private chain of thought/);
    assert.doesNotMatch(serialized, /ready-session|duplicate-session|privacy-session/);

    const after = await getCollectorStatus(sessionsDir);
    assert.equal(after.lastRun?.id, run.id);
  } finally {
    resetCollectorRunsForTesting();
    await fs.rm(root, { recursive: true, force: true });
  }
});
