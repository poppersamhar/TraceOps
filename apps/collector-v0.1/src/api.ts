export interface CollectorRun {
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

export interface CollectorStatus {
  product: string;
  version: '0.1.2';
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
  lastRun?: CollectorRun;
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

export interface WorkflowSessionDetail {
  schema: 'traceops-space-workflow-session-v1';
  sessionKey: string;
  title: string;
  tag?: string;
  createdAt?: string;
  taskStatus: string;
  runtime: {
    surface: 'code' | 'partner';
    provider?: string;
    model?: string;
    reasoningMode?: string;
    permissionMode?: string;
    agentMode?: string;
    scope?: 'user' | 'managed-task-worker';
  };
  topology: {
    role: 'main' | 'worker';
    linkStatus: 'root' | 'linked' | 'inferred' | 'orphan' | 'ambiguous';
    parentTraceKey?: string;
    childTraceKeys: string[];
  };
  transcript: Array<{
    entryKey: string;
    parentEntryKey?: string;
    occurredAt: string;
    type: 'message' | 'compaction' | 'branch_summary';
    role?: 'user' | 'assistant' | 'system';
    active: boolean;
    content: unknown;
  }>;
  events: Array<{
    eventKey: string;
    sourceEntryKey?: string;
    parentEntryKey?: string;
    occurredAt: string;
    order: number;
    type: string;
    active: boolean;
    label: string;
    summary: string;
    payload?: unknown;
  }>;
  evidence: Array<{
    evidenceKey: string;
    sourceEntryKey?: string;
    kind: string;
    sourceTool?: string;
    action?: string;
    target: string;
    summary: string;
    occurredAt: string;
    metadata?: unknown;
  }>;
  workflow: {
    skills: string[];
    tools: string[];
    planningEventRefs: string[];
    toolCallEventRefs: string[];
    toolResultEventRefs: string[];
    errorEventRefs: string[];
    phases: string[];
  };
  overview: { task: string; outcome: string };
  privacy: {
    sensitiveValuesMasked: number;
    privateReasoningBlocksOmitted: number;
  };
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new Error('请确认 TraceOps v0.1.2 已在本机运行，然后点击“重新检测”。');
  }

  let payload: T & { error?: string };
  try {
    payload = await response.json() as T & { error?: string };
  } catch {
    if (!response.ok && response.status >= 500) {
      throw new Error('请确认 TraceOps v0.1.2 已在本机运行，然后点击“重新检测”。');
    }
    throw new Error('本地服务返回了无法识别的结果，请重新启动 TraceOps v0.1.2。');
  }
  if (!response.ok) throw new Error(payload.error ?? `请求失败（${response.status}）`);
  return payload;
}

export async function getCollectorStatus(): Promise<CollectorStatus> {
  return request('/api/v0.1/collector/status');
}

export async function collectSessions(): Promise<CollectorRun> {
  return request('/api/v0.1/collector/collect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
}

export async function listWorkflowSessions(): Promise<WorkflowSessionListItem[]> {
  const response = await request<{ sessions: WorkflowSessionListItem[] }>('/api/v0.1/collector/sessions');
  return response.sessions;
}

export async function getWorkflowSession(sessionKey: string): Promise<WorkflowSessionDetail> {
  return request(`/api/v0.1/collector/sessions/${encodeURIComponent(sessionKey)}`);
}
