import type { RawTraceRisk, RiskLevel } from '../../trace-core/src/types';

interface RiskResult {
  level: RiskLevel;
  reasons: string[];
  containsSourceCodeHint: boolean;
  containsLocalPathHint: boolean;
  containsCredentialHint: boolean;
  containsCustomerDataHint: boolean;
}

const levelWeight: Record<RiskLevel, number> = {
  L0: 0,
  L1: 1,
  L2: 2,
  L3: 3,
  L4: 4,
};

const sourceFilePattern = /\.(ts|tsx|js|jsx|py|go|rs|java|cpp|c|h|css|scss|json|yaml|yml|md)$/i;
const localPathPattern = /(^|\s)(\/Users\/|\/home\/|\/var\/|\/tmp\/|[A-Za-z]:\\)/;
const credentialPattern = /(\.env|(?:api[_-]?key|secret|token|password|credentials?)\s*['"]?\s*[:=]|sk-[A-Za-z0-9_-]{12,})/i;
const customerPattern = /(客户|合同|报价|发票|订单|customer|contract|invoice|quote|deal)/i;
const accountPattern = /(cookie|登录|账号|account|browser|connector|oauth|pat\b)/i;

function merge(a: RiskResult, b: RiskResult): RiskResult {
  const level = levelWeight[b.level] > levelWeight[a.level] ? b.level : a.level;
  return {
    level,
    reasons: Array.from(new Set([...a.reasons, ...b.reasons])),
    containsSourceCodeHint: a.containsSourceCodeHint || b.containsSourceCodeHint,
    containsLocalPathHint: a.containsLocalPathHint || b.containsLocalPathHint,
    containsCredentialHint: a.containsCredentialHint || b.containsCredentialHint,
    containsCustomerDataHint: a.containsCustomerDataHint || b.containsCustomerDataHint,
  };
}

export function emptyRisk(): RiskResult {
  return {
    level: 'L0',
    reasons: [],
    containsSourceCodeHint: false,
    containsLocalPathHint: false,
    containsCredentialHint: false,
    containsCustomerDataHint: false,
  };
}

export function scanTextRisk(value: unknown): RiskResult {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const risk = emptyRisk();
  if (!text) return risk;

  if (credentialPattern.test(text)) {
    risk.level = 'L4';
    risk.reasons.push('contains possible credential or secret');
    risk.containsCredentialHint = true;
  }

  if (customerPattern.test(text) || accountPattern.test(text)) {
    risk.level = levelWeight[risk.level] < 3 ? 'L3' : risk.level;
    risk.reasons.push('contains customer, account, browser, or connector hint');
    risk.containsCustomerDataHint = true;
  }

  if (localPathPattern.test(text)) {
    risk.level = levelWeight[risk.level] < 2 ? 'L2' : risk.level;
    risk.reasons.push('contains local absolute path');
    risk.containsLocalPathHint = true;
  }

  if (sourceFilePattern.test(text)) {
    risk.level = levelWeight[risk.level] < 2 ? 'L2' : risk.level;
    risk.reasons.push('contains source file reference');
    risk.containsSourceCodeHint = true;
  }

  return risk;
}

export function scanEvidenceRisk(kind: string, target: string, summary?: string, metadata?: unknown): RiskResult {
  let risk = scanTextRisk([target, summary, metadata].filter(Boolean).join(' '));

  if (kind === 'file_modified' || kind === 'file_created' || kind === 'file_deleted') {
    risk = merge(risk, {
      ...emptyRisk(),
      level: 'L2',
      reasons: ['contains source mutation evidence'],
      containsSourceCodeHint: sourceFilePattern.test(target),
    });
  }

  if (kind === 'image_input') {
    risk = merge(risk, {
      ...emptyRisk(),
      level: 'L2',
      reasons: ['contains image input'],
    });
  }

  return risk;
}

export function aggregateRisk(results: RiskResult[]): RawTraceRisk {
  const merged = results.reduce((acc, item) => merge(acc, item), emptyRisk());
  return {
    ...merged,
    trainableByDefault: false,
  };
}
