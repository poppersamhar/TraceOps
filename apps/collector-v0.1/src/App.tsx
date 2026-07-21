import {
  Check,
  Database,
  FileArchive,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
  collectSessions,
  getCollectorStatus,
  type CollectorRun,
  type CollectorStatus,
} from './api';
import { ResultCard } from './ResultCard';
import { SessionBrowser } from './SessionBrowser';
import { SourceState } from './SourceState';

export function App() {
  const [status, setStatus] = useState<CollectorStatus>();
  const [run, setRun] = useState<CollectorRun>();
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const next = await getCollectorStatus();
      setStatus(next);
      setRun(next.lastRun);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const collect = async () => {
    setCollecting(true);
    setError(undefined);
    try {
      const next = await collectSessions();
      setRun(next);
      const latestStatus = await getCollectorStatus();
      setStatus(latestStatus);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setCollecting(false);
    }
  };

  const collectDisabled = collecting || !status?.source.exists || status.source.eligibleSessions === 0;
  const sourceReady = Boolean(status?.source.exists && status.source.eligibleSessions > 0);
  const effectiveRun = error ? undefined : run;
  const stepOneClass = sourceReady ? 'step complete' : 'step active';
  const stepTwoClass = effectiveRun ? 'step complete' : collecting ? 'step active' : 'step';
  const stepThreeClass = effectiveRun ? 'step complete' : 'step';

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand"><Database size={18} strokeWidth={2.2} aria-hidden="true" /> TraceOps</div>
        <div className="version-badge"><span>v0.1.2</span> Space Workflow Collector</div>
      </header>

      <section className="hero">
        <div className="hero-kicker"><Sparkles size={14} aria-hidden="true" /> 保存真实、完整、可复盘的 Agent 工作流</div>
        <h1>一键收集 Space Workflow</h1>
        <p>完整保留对话、Skill、工具、任务拆解、Worker 和结果；敏感值在原位置遮罩，不会因此丢弃整个 Session。</p>
      </section>

      <section className="collector-panel">
        <div className="steps" role="list" aria-label="数据整理流程">
          <div className={stepOneClass} role="listitem" aria-current={!sourceReady ? 'step' : undefined}><span>{sourceReady ? <Check size={15} aria-hidden="true" /> : '1'}</span><div><strong>检测数据</strong><small>读取本机 Space Session</small></div></div>
          <div className="step-line" aria-hidden="true" />
          <div className={stepTwoClass} role="listitem" aria-current={collecting ? 'step' : undefined}><span>{effectiveRun ? <Check size={15} aria-hidden="true" /> : '2'}</span><div><strong>完整整理</strong><small>Transcript、Workflow 与字段脱敏</small></div></div>
          <div className="step-line" aria-hidden="true" />
          <div className={stepThreeClass} role="listitem" aria-current={effectiveRun ? 'step' : undefined}><span>{effectiveRun ? <Check size={15} aria-hidden="true" /> : '3'}</span><div><strong>下载发送</strong><small>生成单个压缩数据包</small></div></div>
        </div>

        <div className="collector-state" aria-live="polite" aria-busy={loading || collecting}>
          {loading && !status ? (
            <div className="loading-state" role="status"><LoaderCircle className="spin" size={24} aria-hidden="true" /><span>正在检测本机数据…</span></div>
          ) : status ? (
            <SourceState status={status} />
          ) : null}

          {error ? (
            <div className="error-card" role="alert">
              <strong>本地采集服务未连接</strong>
              <span>{error}</span>
              <button type="button" onClick={() => void refresh()}><RefreshCw size={15} aria-hidden="true" /> 重新检测</button>
            </div>
          ) : null}

          {!error && (collecting || !effectiveRun) ? (
            <div className="collect-action">
              <button
                className="primary-button"
                type="button"
                data-testid="collect-sessions"
                disabled={collectDisabled}
                onClick={() => void collect()}
              >
                {collecting ? <LoaderCircle className="spin" size={20} aria-hidden="true" /> : <FileArchive size={20} aria-hidden="true" />}
                {collecting ? '正在整理 Workflow…' : '收集完整 Workflow'}
              </button>
              <span>{collecting ? '正在本机还原完整 Session 并遮罩敏感值，请不要关闭页面' : '整个过程只在本机完成'}</span>
            </div>
          ) : !error && effectiveRun ? (
            <ResultCard run={effectiveRun} onCollectAgain={() => void collect()} />
          ) : null}
        </div>
      </section>

      <section className="privacy-row" aria-label="数据处理说明">
        <div><LockKeyhole size={18} aria-hidden="true" /><span><strong>不会自动上传</strong><small>数据留在你的电脑中</small></span></div>
        <div><ShieldCheck size={18} aria-hidden="true" /><span><strong>局部隐私遮罩</strong><small>隐藏敏感值，保留完整 Workflow</small></span></div>
        <div><Database size={18} aria-hidden="true" /><span><strong>不修改源文件</strong><small>只读 Space Session</small></span></div>
      </section>

      <SessionBrowser />

      <footer>
        <span>TraceOps v0.1.2 是独立的完整 Workflow Session 采集版本</span>
        <span>评测 Case、Grader 和 Benchmark 决策统一在后续阶段完成</span>
      </footer>
    </main>
  );
}
