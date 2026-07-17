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
        <div className="version-badge"><span>v0.1.0</span> Space Evaluation Collector</div>
      </header>

      <section className="hero">
        <div className="hero-kicker"><Sparkles size={14} aria-hidden="true" /> 为 Agent 评测准备真实任务经验</div>
        <h1>一键生成 Space 评测数据</h1>
        <p>读取本机 Session，完成结构化脱敏、Trace 还原和质量门禁，生成可供下一阶段评测消费的数据包。</p>
      </section>

      <section className="collector-panel">
        <div className="steps" role="list" aria-label="数据整理流程">
          <div className={stepOneClass} role="listitem" aria-current={!sourceReady ? 'step' : undefined}><span>{sourceReady ? <Check size={15} aria-hidden="true" /> : '1'}</span><div><strong>检测数据</strong><small>读取本机 Space Session</small></div></div>
          <div className="step-line" aria-hidden="true" />
          <div className={stepTwoClass} role="listitem" aria-current={collecting ? 'step' : undefined}><span>{effectiveRun ? <Check size={15} aria-hidden="true" /> : '2'}</span><div><strong>评测预处理</strong><small>Trace、Case 与质量门禁</small></div></div>
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
                {collecting ? '正在生成评测数据…' : '收集并生成评测数据'}
              </button>
              <span>{collecting ? '正在本机完成脱敏、Trace 还原和质量门禁，请不要关闭页面' : '整个过程只在本机完成'}</span>
            </div>
          ) : !error && effectiveRun ? (
            <ResultCard run={effectiveRun} onCollectAgain={() => void collect()} />
          ) : null}
        </div>
      </section>

      <section className="privacy-row" aria-label="数据处理说明">
        <div><LockKeyhole size={18} aria-hidden="true" /><span><strong>不会自动上传</strong><small>数据留在你的电脑中</small></span></div>
        <div><ShieldCheck size={18} aria-hidden="true" /><span><strong>完整预处理</strong><small>脱敏、Trace、Case 与门禁</small></span></div>
        <div><Database size={18} aria-hidden="true" /><span><strong>不修改源文件</strong><small>只读 Space Session</small></span></div>
      </section>

      <footer>
        <span>TraceOps v0.1.0 是独立、可保留的采集版本</span>
        <span>v0.2.0 将作为新的评测产品单独建设，不覆盖本版本</span>
      </footer>
    </main>
  );
}
