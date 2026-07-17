import { CheckCircle2, Download, Info, RefreshCw, Send } from 'lucide-react';

import type { CollectorRun } from './api';

interface ResultCardProps {
  run: CollectorRun;
  onCollectAgain: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function ResultCard({ run, onCollectAgain }: ResultCardProps) {
  const gatedCases = run.needsReview + run.privacyBlocked + run.incomplete;
  return (
    <section className="result-card">
      <div className="result-heading">
        <div className="success-icon"><CheckCircle2 size={25} aria-hidden="true" /></div>
        <div>
          <span className="eyebrow success">整理完成</span>
          <h2>评测数据包已准备好</h2>
          <p>{formatTime(run.generatedAt)} · {run.filename}</p>
        </div>
      </div>

      <div className="result-metrics">
        <div><strong>{run.processedSessions}</strong><span>有效 Session</span></div>
        <div><strong>{run.evaluationCases}</strong><span>Evaluation Case</span></div>
        <div><strong>{run.evalReady}</strong><span>自动预处理就绪</span></div>
        <div><strong>{gatedCases}</strong><span>需后续处理</span></div>
      </div>

      <div className="gate-summary">
        <span><i className="gate-dot review" aria-hidden="true" />{run.needsReview} 待复核</span>
        <span><i className="gate-dot blocked" aria-hidden="true" />{run.privacyBlocked} 隐私阻断</span>
        <span><i className="gate-dot incomplete" aria-hidden="true" />{run.incomplete} 不完整</span>
        <span>{run.redactions} 项脱敏 · {formatBytes(run.compressedBytes)}</span>
      </div>

      <div className="readiness-note" role="note">
        <Info size={18} aria-hidden="true" />
        <div>
          <strong>{run.evalReady === 0 ? '数据包生成成功，不代表评测失败' : '数据包已经通过完整预处理'}</strong>
          <span>
            {run.evalReady === 0
              ? '这批 Case 会作为更新证据进入 v0.2.0 Review；不会自动混入 Benchmark。'
              : `${run.evalReady} 条 Case 可进入 v0.2.0 Review，正式 Benchmark 仍需冻结独立 Holdout。`}
          </span>
        </div>
      </div>

      <div className="result-actions">
        <a className="primary-button download-button" href={run.downloadUrl} download={run.filename} data-testid="download-package">
          <Download size={19} aria-hidden="true" />
          下载评测数据包
        </a>
        <button className="secondary-button" type="button" onClick={onCollectAgain} data-testid="collect-again">
          <RefreshCw size={17} aria-hidden="true" />
          重新收集最新数据
        </button>
      </div>
      <p className="send-hint"><Send size={14} aria-hidden="true" /> 下载后无需解压或修改，直接发送这个 .json.gz 文件。</p>
    </section>
  );
}
