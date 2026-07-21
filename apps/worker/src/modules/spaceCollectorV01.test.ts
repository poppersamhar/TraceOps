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
  getSpaceWorkflowSession,
  listSpaceWorkflowSessions,
  resetCollectorRunsForTesting,
  type CollectorPackage,
} from './spaceCollectorV01';

async function writeSession(
  sessionsDir: string,
  name: string,
  meta: Record<string, unknown>,
  messages: Array<Record<string, unknown>> = [],
  extraRecords: Array<Record<string, unknown>> = [],
  projectName = 'fixture-project',
) {
  const dir = path.join(sessionsDir, projectName);
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
      title: 'Workflow fixture',
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
    content: [{
      type: 'tool_result',
      tool_use_id: 'tool-calc-1',
      content: { value: 4, status: 'ok', workerSessionId: 'worker-session' },
    }],
  },
  { role: 'assistant', content: 'The verified result is 4.' },
];

test('v0.1 credential risk distinguishes configuration mentions from high-confidence secrets', () => {
  const environmentMention = scanTextRisk('Update .env.example and document token=<placeholder>.');
  assert.equal(environmentMention.credentialRisk, 'mention');
  assert.equal(environmentMention.containsCredentialHint, false);

  const highConfidence = scanTextRisk('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.realistic-token-material-123456');
  assert.equal(highConfidence.credentialRisk, 'high_confidence');
  assert.equal(highConfidence.containsCredentialHint, true);

  const harmless = scanTextRisk('The token budget is 4096 and no credentials are configured.');
  assert.equal(harmless.credentialRisk, 'none');
});

test('v0.1 preserves inferred and orphan Workers without turning topology uncertainty into a data gate', async () => {
  resetCollectorRunsForTesting();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'traceops-worker-topology-'));
  const sessionsDir = path.join(root, 'sessions');

  try {
    await writeSession(sessionsDir, 'main-session', { tag: 'code', scope: 'user' }, [
      { role: 'user', content: 'Complete the main task.' },
      { role: 'assistant', content: 'The main task is complete.' },
    ], [], 'project-a');
    await writeSession(sessionsDir, 'inferred-worker', { tag: 'code', scope: 'managed-task-worker' }, [
      { role: 'user', content: 'Complete a delegated subtask.' },
      { role: 'assistant', content: 'The delegated subtask is complete.' },
    ], [], 'project-a');
    await writeSession(sessionsDir, 'orphan-worker', { tag: 'code', scope: 'managed-task-worker' }, [
      { role: 'user', content: 'Recover an unattached worker trace.' },
      { role: 'assistant', content: 'The unattached worker trace was preserved.' },
    ], [], 'project-b');

    const run = await collectSpaceSessions(sessionsDir);
    assert.equal(run.processedSessions, 3);
    assert.equal(run.mainSessions, 1);
    assert.equal(run.workerSessions, 2);
    assert.equal(run.workerSessionsNeedingReview, 2);

    const payload = getCollectorPayloadForTesting(run.id);
    assert.ok(payload);
    const data = JSON.parse(gunzipSync(payload).toString('utf8')) as CollectorPackage;
    assert.deepEqual(data.workflowReport.workers, {
      total: 2,
      linked: 0,
      inferred: 1,
      orphan: 1,
      ambiguous: 0,
      needsReview: 2,
    });
    const inferred = data.sessions.find((item) => item.topology.linkStatus === 'inferred');
    const orphan = data.sessions.find((item) => item.topology.linkStatus === 'orphan');
    const main = data.sessions.find((item) => item.topology.role === 'main');
    assert.ok(inferred);
    assert.ok(orphan);
    assert.ok(main);
    assert.equal(inferred.topology.parentTraceKey, main.sessionKey);
    assert.equal(inferred.topology.requiresReview, true);
    assert.equal(orphan.topology.parentTraceKey, undefined);
    assert.equal(orphan.topology.requiresReview, true);
    assert.deepEqual(main.topology.childTraceKeys, [inferred.sessionKey]);
    assert.equal(inferred.transcript.length, 2);
    assert.equal(orphan.transcript.length, 2);
  } finally {
    resetCollectorRunsForTesting();
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('v0.1 exports complete sanitized Workflow Sessions and never drops a Session for privacy', async () => {
  resetCollectorRunsForTesting();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'traceops-collector-'));
  const sessionsDir = path.join(root, 'sessions');

  try {
    await writeSession(sessionsDir, 'ready-session', { tag: 'code', scope: 'user', title: 'Work from /Users/alice' }, calculationMessages, [{
      _type: 'artifact_ledger_entry',
      entry: {
        id: 'check-calculation',
        kind: 'check_result',
        target: 'calculation-result',
        summary: 'Calculator result equals 4.',
        timestamp: '2026-07-17T10:04:00.000Z',
      },
    }]);
    await writeSession(sessionsDir, 'privacy-session', { tag: 'partner', scope: 'user', title: 'Sensitive /Users/alice/customer-project' }, [
      {
        role: 'user',
        content: 'Read /Users/alice/customer-project/report.md with api_key=sk-proj-abcdefghijklmnopqrstuvwxyz1234567890 and reply to owner@example.com',
      },
      {
        role: 'assistant',
        content: [
          { type: 'thinking', thinking: 'private chain of thought must never leave the machine' },
          {
            type: 'tool_use',
            id: 'secret-tool',
            name: 'exec_command',
            input: { api_key: 'nested-secret-value', command: 'open /opt/skills/workflow-review/SKILL.md' },
          },
          { type: 'text', text: 'Completed from /Users/alice/customer-project/report.md' },
        ],
      },
    ]);
    await writeSession(sessionsDir, 'credential-mention-session', { tag: 'code', scope: 'user' }, [
      { role: 'user', content: 'Document the .env.example schema and show token=<placeholder>.' },
      { role: 'assistant', content: 'Documented the configuration schema without adding a real secret.' },
    ]);
    await writeSession(sessionsDir, 'ephemeral-session', { tag: 'quick-ask', scope: 'user' }, [
      { role: 'user', content: 'temporary but still preserved' },
    ]);
    await writeSession(sessionsDir, 'empty-session', { tag: 'code', scope: 'user' });
    await writeSession(sessionsDir, 'worker-session', { tag: 'code', scope: 'managed-task-worker' }, [
      { role: 'user', content: 'Verify the delegated calculation.' },
      { role: 'assistant', content: 'The delegated calculation was verified.' },
    ]);

    const before = await getCollectorStatus(sessionsDir);
    assert.equal(before.source.detectedSessions, 6);
    assert.equal(before.source.eligibleSessions, 6);
    assert.equal(before.source.excludedSessions, 0);

    const browseList = await listSpaceWorkflowSessions(sessionsDir);
    assert.equal(browseList.length, 6);
    assert.ok(browseList.every((item) => item.sessionKey.startsWith('space_session_')));
    assert.doesNotMatch(JSON.stringify(browseList), /privacy-session|\/Users\/alice/);
    const privacyListItem = browseList.find((item) => item.title.startsWith('Sensitive'));
    assert.ok(privacyListItem);
    const browsedPrivacySession = await getSpaceWorkflowSession(privacyListItem.sessionKey, sessionsDir);
    assert.ok(browsedPrivacySession);
    assert.ok(browsedPrivacySession.transcript.length > 0);
    assert.ok(browsedPrivacySession.workflow.skills.includes('workflow-review'));
    assert.doesNotMatch(JSON.stringify(browsedPrivacySession), /nested-secret-value|owner@example\.com|\/Users\/alice/);

    const run = await collectSpaceSessions(sessionsDir);
    assert.equal(run.processedSessions, 6);
    assert.equal(run.mainSessions, 5);
    assert.equal(run.workerSessions, 1);
    assert.equal(run.linkedWorkerSessions, 1);
    assert.equal(run.failedSessions, 0);
    assert.ok(run.conversationEntries >= 11);
    assert.ok(run.toolCalls >= 2);
    assert.ok(run.toolResults >= 1);
    assert.ok(run.skillUsages >= 1);
    assert.ok(run.sessionsWithMaskedData >= 1);
    assert.ok(run.redactions >= 4);
    assert.ok(run.structuredFieldsRedacted >= 1);
    assert.ok(run.thinkingBlocksRemoved >= 1);
    assert.match(run.filename, /^traceops-space-workflows-\d{8}-\d{6}-6\.json\.gz$/);

    const payload = getCollectorPayloadForTesting(run.id);
    assert.ok(payload);
    const data = JSON.parse(gunzipSync(payload).toString('utf8')) as CollectorPackage;
    assert.equal(data.manifest.schema, 'traceops-space-workflow-package-v1');
    assert.equal(data.manifest.collectorVersion, '0.1.2');
    assert.equal(data.manifest.collectionPolicy.privacyHandling, 'field_level_masking');
    assert.equal(data.manifest.collectionPolicy.sessionsDroppedForPrivacy, false);
    assert.equal(data.manifest.collectionPolicy.evaluationDecisionsDeferred, true);
    assert.equal(data.sessionIndex.length, 6);
    assert.equal(data.sessions.length, 6);
    assert.equal(data.workflowReport.sessions, 6);
    assert.equal(data.manifest.counts.processed, 6);
    assert.equal(
      data.manifest.contentChecksum,
      createHash('sha256').update(JSON.stringify({
        workflowReport: data.workflowReport,
        sessionIndex: data.sessionIndex,
        sessions: data.sessions,
      })).digest('hex'),
    );

    const privacySession = data.sessions.find((item) => item.workflow.skills.includes('workflow-review'));
    assert.ok(privacySession);
    assert.equal(privacySession.privacy.handling, 'field_level_masking');
    assert.equal(privacySession.privacy.contentPreserved, true);
    assert.ok(privacySession.transcript.length > 0);
    assert.ok(privacySession.conversation.length > 0);
    assert.ok(privacySession.events.some((item) => item.payload !== undefined));
    assert.ok(privacySession.privacy.sensitiveValuesMasked > 0);

    const ephemeral = data.sessions.find((item) => item.tag === 'quick-ask');
    assert.ok(ephemeral);
    assert.equal(ephemeral.conversation.length, 1);
    const empty = data.sessions.find((item) => item.transcript.length === 0);
    assert.ok(empty);

    const worker = data.sessions.find((item) => item.topology.role === 'worker');
    assert.ok(worker);
    assert.equal(worker.topology.linkStatus, 'linked');
    const parent = data.sessions.find((item) => item.topology.childTraceKeys.includes(worker.sessionKey));
    assert.ok(parent);

    const serialized = JSON.stringify(data);
    assert.match(serialized, /\*\*\*/);
    assert.match(serialized, /api_key(?:=\*\*\*|":"\*\*\*")/);
    assert.match(serialized, /PRIVATE_REASONING_OMITTED/);
    assert.doesNotMatch(serialized, /sk-proj-abcdefghijklmnopqrstuvwxyz1234567890/);
    assert.doesNotMatch(serialized, /nested-secret-value/);
    assert.doesNotMatch(serialized, /owner@example\.com/);
    assert.doesNotMatch(serialized, /\/Users\/alice/);
    assert.doesNotMatch(serialized, /private chain of thought/);
    assert.doesNotMatch(serialized, /"worker-session"|"ready-session"|"privacy-session"/);

    const after = await getCollectorStatus(sessionsDir);
    assert.equal(after.lastRun?.id, run.id);
  } finally {
    resetCollectorRunsForTesting();
    await fs.rm(root, { recursive: true, force: true });
  }
});
