import type { CredentialRiskLevel, RawTraceRisk, RiskLevel } from '../../trace-core/src/types';

interface RiskResult {
  level: RiskLevel;
  reasons: string[];
  containsSourceCodeHint: boolean;
  containsLocalPathHint: boolean;
  containsCredentialHint: boolean;
  credentialRisk: CredentialRiskLevel;
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
const credentialLabel = '(?:api[_-]?key|access[_-]?token|refresh[_-]?token|auth[_-]?token|token|password|passwd|secret|authorization|cookie|credentials?|private[_-]?key)';
const credentialMentionPattern = new RegExp(`(?:\\.env(?:\\.[A-Za-z0-9_.-]+)?|${credentialLabel}\\s*['"]?\\s*[:=])`, 'i');
const assignedCredentialPattern = new RegExp(`${credentialLabel}\\s*['"]?\\s*[:=]\\s*['"]?([^\\s'",;\\}\\]\\)]+)`, 'ig');
const strongCredentialPattern = /(?:\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b|\bghp_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b|\bxox[baprs]?-[A-Za-z0-9-]{20,}\b|\bAIza[A-Za-z0-9_-]{24,}\b|\bAKIA[0-9A-Z]{16}\b|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/i;
const bearerCredentialPattern = /\bBearer\s+[A-Za-z0-9._~-]{20,}\b/i;
const placeholderCredentialPattern = /^(?:<[^>]+>|\$\{[^}]+\}|\*+|x+|redacted|masked|placeholder|example|sample|dummy|test|your[_-].*|change[_-]?me|none|null|undefined)$/i;
const customerPattern = /(客户|合同|报价|发票|订单|customer|contract|invoice|quote|deal)/i;
const accountPattern = /(cookie|登录|账号|account|browser|connector|oauth|pat\b)/i;

const credentialRiskWeight: Record<CredentialRiskLevel, number> = {
  none: 0,
  mention: 1,
  high_confidence: 2,
};

function assignedCredentialLooksReal(text: string): boolean {
  for (const match of text.matchAll(assignedCredentialPattern)) {
    if (!match[1]) continue;
    const value = match[1].replace(/^['"]|['"]$/g, '');
    if (placeholderCredentialPattern.test(value)) continue;
    const characterClasses = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((pattern) => pattern.test(value)).length;
    if (value.length >= 24 || (value.length >= 16 && characterClasses >= 3)) return true;
  }
  return false;
}

function classifyCredentialRisk(text: string): CredentialRiskLevel {
  if (strongCredentialPattern.test(text) || bearerCredentialPattern.test(text) || assignedCredentialLooksReal(text)) return 'high_confidence';
  if (credentialMentionPattern.test(text)) return 'mention';
  return 'none';
}

function merge(a: RiskResult, b: RiskResult): RiskResult {
  const level = levelWeight[b.level] > levelWeight[a.level] ? b.level : a.level;
  return {
    level,
    reasons: Array.from(new Set([...a.reasons, ...b.reasons])),
    containsSourceCodeHint: a.containsSourceCodeHint || b.containsSourceCodeHint,
    containsLocalPathHint: a.containsLocalPathHint || b.containsLocalPathHint,
    containsCredentialHint: a.containsCredentialHint || b.containsCredentialHint,
    credentialRisk: credentialRiskWeight[b.credentialRisk] > credentialRiskWeight[a.credentialRisk] ? b.credentialRisk : a.credentialRisk,
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
    credentialRisk: 'none',
    containsCustomerDataHint: false,
  };
}

export function scanTextRisk(value: unknown): RiskResult {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  const risk = emptyRisk();
  if (!text) return risk;

  const credentialRisk = classifyCredentialRisk(text);
  risk.credentialRisk = credentialRisk;
  if (credentialRisk === 'high_confidence') {
    risk.level = 'L4';
    risk.reasons.push('contains high-confidence credential or secret pattern');
    risk.containsCredentialHint = true;
  } else if (credentialRisk === 'mention') {
    risk.level = 'L2';
    risk.reasons.push('mentions a credential field or environment file');
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
