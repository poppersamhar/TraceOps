import type {
  KodaXRuntimeEventInput,
  KodaXRuntimeIngestInput,
  KodaXRuntimeIngestResult,
  KodaXTraceSpanInput,
} from '../../trace-core/src/types';

export interface TraceOpsRuntimeAdapterOptions {
  endpoint?: string;
  apiToken?: string;
  flushSize?: number;
  flushIntervalMs?: number;
  fetchImpl?: typeof fetch;
}

export interface TraceOpsTracingProcessorSpan {
  id?: string;
  traceId?: string;
  sessionId?: string;
  parentId?: string;
  parentSpanId?: string;
  name?: string;
  type?: string;
  kind?: string;
  startedAt?: string;
  startTime?: string | number;
  endedAt?: string;
  endTime?: string | number;
  status?: string;
  input?: unknown;
  output?: unknown;
  error?: unknown;
  attributes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

function normalizeEndpoint(endpoint?: string) {
  return (endpoint ?? process.env.TRACEOPS_RUNTIME_ENDPOINT ?? 'http://localhost:4177')
    .replace(/\/$/, '');
}

function isoTime(value: string | number | undefined) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return new Date(value).toISOString();
  return undefined;
}

function runtimeHeaders(apiToken?: string): HeadersInit {
  return {
    'content-type': 'application/json',
    ...(apiToken ? { authorization: `Bearer ${apiToken}` } : {}),
  };
}

export function createTraceOpsRuntimeAdapter(options: TraceOpsRuntimeAdapterOptions = {}) {
  const endpoint = normalizeEndpoint(options.endpoint);
  const fetchImpl = options.fetchImpl ?? fetch;
  const flushSize = Math.max(1, options.flushSize ?? 20);
  const flushIntervalMs = Math.max(250, options.flushIntervalMs ?? 2_000);
  let queue: KodaXRuntimeIngestInput = { events: [], spans: [] };
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function post(input: KodaXRuntimeIngestInput): Promise<KodaXRuntimeIngestResult> {
    const response = await fetchImpl(`${endpoint}/api/runtime/kodax/events`, {
      method: 'POST',
      headers: runtimeHeaders(options.apiToken),
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      throw new Error(`TraceOps runtime ingest failed: ${response.status} ${await response.text()}`);
    }
    return await response.json() as KodaXRuntimeIngestResult;
  }

  function enqueue(input: KodaXRuntimeIngestInput) {
    queue = {
      events: [...(queue.events ?? []), ...(input.events ?? [])],
      spans: [...(queue.spans ?? []), ...(input.spans ?? [])],
    };
    const size = (queue.events?.length ?? 0) + (queue.spans?.length ?? 0);
    if (size >= flushSize) return flush();
    if (!timer) {
      timer = setTimeout(() => {
        void flush();
      }, flushIntervalMs);
    }
    return Promise.resolve(undefined);
  }

  async function flush() {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const next = queue;
    queue = { events: [], spans: [] };
    if ((next.events?.length ?? 0) === 0 && (next.spans?.length ?? 0) === 0) return undefined;
    return await post(next);
  }

  function event(input: KodaXRuntimeEventInput, mode: 'buffered' | 'immediate' = 'buffered') {
    return mode === 'immediate' ? post({ events: [input] }) : enqueue({ events: [input] });
  }

  function span(input: KodaXTraceSpanInput, mode: 'buffered' | 'immediate' = 'buffered') {
    return mode === 'immediate' ? post({ spans: [input] }) : enqueue({ spans: [input] });
  }

  function processor(defaults: Partial<KodaXTraceSpanInput> = {}) {
    return {
      async onSpanEnd(raw: TraceOpsTracingProcessorSpan) {
        const attributes = raw.attributes ?? raw.metadata ?? {};
        const sessionId = raw.sessionId
          ?? (typeof attributes.sessionId === 'string' ? attributes.sessionId : undefined)
          ?? defaults.sessionId;
        if (!sessionId) return;
        await span({
          ...defaults,
          sessionId,
          spanId: raw.id,
          traceId: raw.traceId,
          parentSpanId: raw.parentSpanId ?? raw.parentId,
          kind: raw.kind === 'agent'
            || raw.kind === 'model'
            || raw.kind === 'tool'
            || raw.kind === 'workflow'
            || raw.kind === 'handoff'
            || raw.kind === 'eval'
            ? raw.kind
            : raw.type === 'handoff' ? 'handoff' : 'custom',
          name: raw.name ?? raw.type ?? 'KodaX span',
          startedAt: raw.startedAt ?? isoTime(raw.startTime),
          endedAt: raw.endedAt ?? isoTime(raw.endTime),
          status: raw.status === 'error' || raw.status === 'cancelled' ? raw.status : 'ok',
          input: raw.input,
          output: raw.output,
          error: raw.error,
          attributes,
        });
      },
      async shutdown() {
        await flush();
      },
      async forceFlush() {
        await flush();
      },
    };
  }

  return {
    event,
    span,
    enqueue,
    flush,
    processor,
  };
}
