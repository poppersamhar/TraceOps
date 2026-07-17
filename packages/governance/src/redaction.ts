import type { TrainingTextDistillation, TrainingTextRedaction, TrainingTextRedactionType } from '../../trace-core/src/types';

interface Rule {
  type: TrainingTextRedactionType;
  pattern: RegExp;
  replacement: string;
}

export interface DistilledText {
  clean: string;
  distillation: TrainingTextDistillation;
}

export interface RedactedEvaluationText {
  clean: string;
  distillation: TrainingTextDistillation;
}

const rules: Rule[] = [
  {
    type: 'thinking_marker',
    pattern: /\[thinking\]\s*/gi,
    replacement: '',
  },
  {
    type: 'credential',
    pattern: /\b(?:sk|ghp|github_pat|xoxb|xoxp|AIza)[A-Za-z0-9_\-]{12,}\b/g,
    replacement: '<SECRET>',
  },
  {
    type: 'credential',
    pattern: /\b(?:api[_-]?key|token|password|secret)\s*['"]?\s*[:=]\s*['"]?[^'"\s,，;；)]+/gi,
    replacement: '<SECRET_FIELD>',
  },
  {
    type: 'local_path',
    pattern: /(?:~(?:\/[^\s`'"，。；;,)]*)?|\/Users\/[^/\s`'"，。；;,)]*(?:\/[^\s`'"，。；;,)]*)?|\/home\/[^/\s`'"，。；;,)]*(?:\/[^\s`'"，。；;,)]*)?|\/(?:var\/folders|private\/var|tmp|Volumes)(?:\/[^\s`'"，。；;,)]*)?)/g,
    replacement: '<LOCAL_PATH>',
  },
  {
    type: 'local_path',
    pattern: /[A-Za-z]:\\(?:Users\\[^\\\s`'"，。；;,)]+\\)?[^\s`'"，。；;,)]*/g,
    replacement: '<LOCAL_PATH>',
  },
  {
    type: 'email',
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '<EMAIL>',
  },
  {
    type: 'localhost_url',
    pattern: /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?[^\s`'"，。；;,)]*/gi,
    replacement: '<LOCAL_URL>',
  },
];

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function recordRedaction(redactions: Map<TrainingTextRedactionType, TrainingTextRedaction>, rule: Rule, count: number) {
  const existing = redactions.get(rule.type);
  if (existing) {
    existing.count += count;
    return;
  }
  redactions.set(rule.type, {
    type: rule.type,
    count,
    replacement: rule.replacement,
  });
}

function applyRedactionRules(value: string | undefined, compactWhitespace: boolean): DistilledText {
  let clean = value ?? '';
  const redactions = new Map<TrainingTextRedactionType, TrainingTextRedaction>();

  for (const rule of rules) {
    let count = 0;
    clean = clean.replace(rule.pattern, () => {
      count += 1;
      return rule.replacement;
    });
    if (count > 0) recordRedaction(redactions, rule, count);
  }

  clean = compactWhitespace ? compact(clean) : clean.trim();
  const items = Array.from(redactions.values());
  return {
    clean,
    distillation: {
      version: 'kodax-clean-text-v1',
      redactions: items,
      redactionCount: items.reduce((sum, item) => sum + item.count, 0),
      removedThinking: items.some((item) => item.type === 'thinking_marker'),
      cleanLength: clean.length,
    },
  };
}

export function distillTrainingText(value: string | undefined): DistilledText {
  return applyRedactionRules(value, true);
}

/**
 * Redacts the same sensitive values as training distillation while preserving
 * line breaks and indentation required to replay tool inputs and results.
 */
export function redactEvaluationText(value: string | undefined): RedactedEvaluationText {
  return applyRedactionRules(value, false);
}
