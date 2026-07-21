export interface CollectorRun {
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

export interface CollectorStatus {
  product: string;
  version: '0.1.1';
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
  lastRun?: CollectorRun;
}

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    throw new Error('请确认 TraceOps v0.1.1 已在本机运行，然后点击“重新检测”。');
  }

  let payload: T & { error?: string };
  try {
    payload = await response.json() as T & { error?: string };
  } catch {
    if (!response.ok && response.status >= 500) {
      throw new Error('请确认 TraceOps v0.1.1 已在本机运行，然后点击“重新检测”。');
    }
    throw new Error('本地服务返回了无法识别的结果，请重新启动 TraceOps v0.1.1。');
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
