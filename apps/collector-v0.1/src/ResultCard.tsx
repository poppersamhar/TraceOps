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
  return (
    <section className="result-card">
      <div className="result-heading">
        <div className="success-icon"><CheckCircle2 size={25} aria-hidden="true" /></div>
        <div>
          <span className="eyebrow success">整理完成</span>
          <h2>Workflow 数据包已准备好</h2>
          <p>{formatTime(run.generatedAt)} · {run.filename}</p>
        </div>
      </div>

      <div className="result-metrics">
        <div><strong>{run.processedSessions}</strong><span>完整 Session</span></div>
        <div><strong>{run.conversationEntries}</strong><span>对话记录</span></div>
        <div><strong>{run.toolCalls}</strong><span>工具调用</span></div>
        <div><strong>{run.skillUsages}</strong><span>识别到的 Skill</span></div>
      </div>

      <div className="gate-summary">
        <span>{run.mainSessions} 个主 Session · {run.workerSessions} 个 Worker</span>
        <span>{run.toolResults} 条工具结果</span>
        <span>{run.sessionsWithMaskedData} 个 Session 含局部遮罩</span>
        <span>{run.redactions} 处隐私处理 · {formatBytes(run.compressedBytes)}</span>
      </div>

      <div className="readiness-note" role="note">
        <Info size={18} aria-hidden="true" />
        <div>
          <strong>敏感内容只做局部遮罩，Session 不会因此被丢弃</strong>
          <span>数据包保留 Transcript、分支、Skill、工具、Evidence、错误和 Worker 关系；评测筛选将在后续阶段单独完成。</span>
        </div>
      </div>

      <div className="result-actions">
        <a className="primary-button download-button" href={run.downloadUrl} download={run.filename} data-testid="download-package">
          <Download size={19} aria-hidden="true" />
          下载 Workflow 数据包
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
