# KodaX Runtime Adapter

TraceOps now supports two KodaX ingestion paths:

1. File sync from `~/.kodax/sessions`.
2. Runtime push from a live KodaX process.

The runtime path is for events that exist before a session file is finalized: messages, tool calls, tool results, artifacts, workflow phases, handoffs, child-agent activity, and tracing spans.

## Endpoint

```text
POST http://localhost:4177/api/runtime/kodax/events
```

Payload:

```json
{
  "events": [
    {
      "eventId": "evt_001",
      "sessionId": "kodax-session-id",
      "projectKey": "agent-os",
      "kind": "message",
      "role": "assistant",
      "label": "assistant",
      "preview": "Implemented the requested change.",
      "occurredAt": "2026-07-07T12:00:00.000Z",
      "payload": {
        "content": "Implemented the requested change."
      }
    }
  ],
  "spans": [
    {
      "spanId": "span_001",
      "sessionId": "kodax-session-id",
      "projectKey": "agent-os",
      "kind": "tool",
      "name": "shell.exec",
      "startedAt": "2026-07-07T12:00:01.000Z",
      "endedAt": "2026-07-07T12:00:03.000Z",
      "status": "ok",
      "attributes": {
        "command": "npm run build"
      }
    }
  ]
}
```

Response:

```json
{
  "acceptedEvents": 1,
  "acceptedSpans": 1,
  "traces": []
}
```

## KodaX Connector Usage

```ts
import { createTraceOpsRuntimeAdapter } from './packages/kodax-connector/src';

const traceops = createTraceOpsRuntimeAdapter({
  endpoint: 'http://localhost:4177',
  flushSize: 20,
  flushIntervalMs: 2000,
});

await traceops.event({
  sessionId: session.id,
  projectKey: session.projectKey,
  kind: 'session_started',
  title: session.title,
  runtime: {
    surface: 'kodax-cli',
    provider: session.provider,
    model: session.model,
  },
});

await traceops.span({
  sessionId: session.id,
  projectKey: session.projectKey,
  kind: 'tool',
  name: 'shell.exec',
  status: 'ok',
  attributes: {
    command: 'npm run build',
  },
});

await traceops.flush();
```

## Storage Behavior

- Runtime events are stored as `RawTraceEvent.source = kodax_runtime_event`.
- Tracing spans are stored as `RawTraceEvent.source = kodax_tracing_span`.
- Events are attached to the existing KodaX trace when `sessionId` and `projectKey` match.
- If the file-based session does not exist yet, TraceOps creates a runtime-only Raw Trace first.
- Later session-file imports do not delete runtime events; TraceOps merges both sources in timeline order.
