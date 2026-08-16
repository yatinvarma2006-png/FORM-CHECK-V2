/**
 * ResultsPanel — displays each metric with value, range, status,
 * target range slider, fault notes, fix tips, and PDF export.
 */
import type { MetricResult, AICoachingReport, Anthropometrics, AIVisionAnalysis } from "../types";
import AICoachingCard from "./AICoachingCard";

interface Props {
  metrics: MetricResult[];
  sport: string;
  aiReport?: AICoachingReport;
  anthropometrics?: Anthropometrics;
  aiVision?: AIVisionAnalysis;
}

export default function ResultsPanel({ metrics, sport, aiReport, anthropometrics, aiVision }: Props) {
  const flagged = metrics.filter((m) => m.flagged);
  const passed = metrics.filter((m) => !m.flagged);

  return (
    <div className="animate-slide-up space-y-6">
      {/* AI Coaching Card */}
      {aiReport && (
        <AICoachingCard
          report={aiReport}
          sport={sport}
          metrics={metrics}
          anthropometrics={anthropometrics}
          aiVision={aiVision}
        />
      )}

      {/* Analysis Results Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Analysis Results</h2>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <span>{sport === "bowling" ? "🏏 Cricket Bowling" : "🏋️ Deadlift"}</span>
            <span>•</span>
            {flagged.length === 0 ? (
              <span className="text-emerald-400 font-medium font-mono">All metrics within range!</span>
            ) : (
              <span className="text-red-400 font-medium font-mono">
                {flagged.length} of {metrics.length} metrics flagged
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="no-print flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 text-white border border-white/15 hover:bg-white/20 transition-all text-xs font-semibold uppercase tracking-wider cursor-pointer"
        >
          <span>🖨️</span> Export PDF Report
        </button>
      </div>

      {/* Summary Stat Boxes (3 | 2 | 1) */}
      <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
        <div className="glass-card p-5 text-center border-white/20 shadow-2xl">
          <p className="text-3xl font-extrabold text-white font-mono">{metrics.length}</p>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-mono">Total Metrics</p>
        </div>
        <div className="glass-card p-5 text-center border-emerald-500/30 bg-emerald-950/20 shadow-2xl">
          <p className="text-3xl font-extrabold text-emerald-400 font-mono">{passed.length}</p>
          <p className="text-xs text-emerald-300 mt-1 uppercase tracking-wider font-mono">Passed</p>
        </div>
        <div className="glass-card p-5 text-center border-red-500/30 bg-red-950/20 shadow-2xl">
          <p className="text-3xl font-extrabold text-red-400 font-mono">{flagged.length}</p>
          <p className="text-xs text-red-300 mt-1 uppercase tracking-wider font-mono">Flagged</p>
        </div>
      </div>

      {/* Metric details cards */}
      <div className="space-y-5">
        {metrics.map((m, i) => {
          const maxVal = Math.max(m.max * 1.3, m.value * 1.1, 1.0);
          const leftPercent = Math.min(100, Math.max(0, (m.value / maxVal) * 100));
          const rangeLeft = Math.max(0, (m.min / maxVal) * 100);
          const rangeWidth = Math.min(100 - rangeLeft, ((m.max - m.min) / maxVal) * 100);

          return (
            <div
              key={m.metric_name}
              className={`metric-card ${m.flagged ? "flagged" : "ok"}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      m.flagged ? "bg-red-500 shadow-lg shadow-red-500/50" : "bg-emerald-500 shadow-lg shadow-emerald-500/50"
                    }`}
                  />
                  <h3 className="font-bold text-white text-base">{m.display_name}</h3>
                </div>
                <span
                  className={`text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider font-mono ${
                    m.flagged
                      ? "bg-red-500/20 text-red-300 border border-red-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {m.flagged ? "FLAGGED" : "OK"}
                </span>
              </div>

              {/* Value and Target Range */}
              <div className="mb-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                    {m.value}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{m.unit}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>Target range:</span>
                  <span className="font-mono text-gray-300 font-semibold">
                    {m.min}–{m.max} {m.unit}
                  </span>
                </div>

                {/* Visual Target Range Slider */}
                <div className="mt-3 h-2.5 rounded-full bg-white/10 overflow-hidden relative border border-white/10">
                  {/* Target safe zone highlight */}
                  <div
                    className="absolute h-full bg-emerald-500/30 rounded-full"
                    style={{
                      left: `${rangeLeft}%`,
                      width: `${rangeWidth}%`,
                    }}
                  />
                  {/* Current value indicator dot */}
                  <div
                    className={`absolute h-full w-2 rounded-full -translate-x-1/2 shadow-lg ${
                      m.flagged ? "bg-red-500" : "bg-emerald-400"
                    }`}
                    style={{
                      left: `${leftPercent}%`,
                    }}
                  />
                </div>
              </div>

              {/* Fault details box when FLAGGED */}
              {m.flagged && m.fault_name && (
                <div className="mt-4 space-y-3 pt-4 border-t border-red-500/20">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">⚠️</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-300 uppercase tracking-wider">{m.fault_name}</p>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">{m.injury_note}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs">💡</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider font-mono">
                        HOW TO FIX
                      </p>
                      <p className="text-xs text-gray-200 mt-0.5 leading-relaxed">{m.fix_tip}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Positive Insight when PASSED */}
              {!m.flagged && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-400/90 font-medium">
                  <span>✓</span>
                  <span>Optimal posture alignment within biomechanical safety tolerances.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
