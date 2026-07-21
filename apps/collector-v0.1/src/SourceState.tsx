import { FolderSearch } from 'lucide-react';

import type { CollectorStatus } from './api';

interface SourceStateProps {
  status: CollectorStatus;
}

export function SourceState({ status }: SourceStateProps) {
  const ready = status.source.exists && status.source.eligibleSessions > 0;
  return (
    <section className="source-card" aria-label="Space Session 数据源">
      <div className="source-icon"><FolderSearch size={22} strokeWidth={1.9} /></div>
      <div className="source-copy">
        <div className="source-title-row">
          <strong>Space Session 数据源</strong>
          <span className={`status-chip ${ready ? 'ready' : 'missing'}`}>
            <span className="status-dot" />
            {ready ? '已检测' : status.source.exists ? '暂无数据' : '未检测到'}
          </span>
        </div>
        <code>{status.source.path}</code>
        <p>
          {ready
            ? `发现 ${status.source.detectedSessions} 个 Session，本次将完整整理 ${status.source.eligibleSessions} 个 Workflow。`
            : status.source.exists
              ? '目录存在，但暂时没有可读取的 Session。'
              : '请先在 KodaX Space 中完成至少一次真实任务。'}
        </p>
      </div>
    </section>
  );
}
