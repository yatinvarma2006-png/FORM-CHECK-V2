import { useState } from "react";
import DisclaimerBanner from "./components/DisclaimerBanner";
import SportSelector from "./components/SportSelector";
import VideoUploader from "./components/VideoUploader";
import VideoScrubber from "./components/VideoScrubber";
import SideConfig from "./components/SideConfig";
import SkeletonOverlay from "./components/SkeletonOverlay";
import ResultsPanel from "./components/ResultsPanel";
import HistoryPanel from "./components/HistoryPanel";

import { api } from "./api/client";
import type { Sport, VideoMeta, CapturedFrame, MetricResult, FrameRole, AICoachingReport, Anthropometrics, AIVisionAnalysis, Landmark } from "./types";
import { FRAME_ROLES } from "./types";

export default function App() {
  const [sport, setSport] = useState<Sport | null>(null);
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [capturedFrames, setCapturedFrames] = useState<Record<string, CapturedFrame>>({});

  // Bowling config
  const [armSide, setArmSide] = useState("right");
  const [legSide, setLegSide] = useState("left");

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [metricsResult, setMetricsResult] = useState<MetricResult[] | null>(null);
  const [aiReport, setAiReport] = useState<AICoachingReport | null>(null);
  const [anthropometrics, setAnthropometrics] = useState<Anthropometrics | null>(null);
  const [aiVision, setAiVision] = useState<AIVisionAnalysis | null>(null);

  // Active view tab
  const [activeTab, setActiveTab] = useState<"analyzer" | "history">("analyzer");

  const resetAll = () => {
    setSport(null);
    setVideo(null);
    setCapturedFrames({});
    setMetricsResult(null);
    setAiReport(null);
    setAnthropometrics(null);
    setAiVision(null);
    setAnalysisError(null);
  };

  const handleFrameCaptured = (frame: CapturedFrame) => {
    setCapturedFrames((prev) => ({
      ...prev,
      [frame.role]: frame,
    }));
  };

  const requiredRoles = sport ? FRAME_ROLES[sport].filter((r) => !r.optional).map((r) => r.role) : [];
  const allRolesCaptured = requiredRoles.length > 0 && requiredRoles.every((r) => r in capturedFrames);

  const runAnalysis = async () => {
    if (!sport || !allRolesCaptured) return;
    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const framesPayload = Object.values(capturedFrames)
        .filter((f): f is CapturedFrame & { landmarks: Landmark[] } => f.landmarks !== null)
        .map((f) => ({
          role: f.role,
          timestamp: f.timestampSeconds,
          frame_base64: f.frameBase64,
          landmarks: f.landmarks,
        }));

      const res = await api.analyzeFrames({
        sport,
        arm_side: armSide,
        leg_side: legSide,
        frames: framesPayload,
      });

      setMetricsResult(res.metrics);
      const r = res.ai_report || res.ai_coaching_report;
      const v = res.ai_vision || res.ai_vision_analysis;
      if (r) setAiReport(r);
      if (res.anthropometrics) setAnthropometrics(res.anthropometrics);
      if (v) setAiVision(v);
    } catch (err: any) {
      setAnalysisError(err.message || "Analysis failed. Ensure posture is visible.");
    } finally {
      setAnalyzing(false);
    }
  };

  const runAutoScan = async () => {
    if (!sport || !video) return;
    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await api.autoScanVideo({
        video_id: video.video_id,
        sport,
        arm_side: armSide,
        leg_side: legSide,
      });

      const newFrames: Record<string, CapturedFrame> = {};
      for (const df of res.detected_frames) {
        newFrames[df.role] = {
          role: df.role as FrameRole,
          timestampSeconds: df.timestamp,
          frameBase64: df.frame_base64,
          annotatedBase64: df.annotated_base64,
          landmarks: df.landmarks,
        };
      }

      setCapturedFrames(newFrames);
      setMetricsResult(res.metrics);

      const r = res.ai_report || res.ai_coaching_report;
      const v = res.ai_vision || res.ai_vision_analysis;
      if (r) setAiReport(r);
      if (res.anthropometrics) setAnthropometrics(res.anthropometrics);
      if (v) setAiVision(v);
    } catch (err: any) {
      setAnalysisError(err.message || "Auto-scan failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      <DisclaimerBanner />

      {/* Nike Primary Nav Header */}
      <header className="no-print border-b border-white/10 bg-black/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={resetAll}>
            <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-black text-sm tracking-tighter shadow-lg">
              FC
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-wider uppercase text-white leading-none">
                FORMCHECK
              </h1>
              <p className="text-[9px] font-mono tracking-widest text-gray-400 uppercase mt-0.5">
                ATHLETIC BIOMECHANICS ENGINE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("analyzer")}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all ${
                activeTab === "analyzer"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white bg-white/5"
              }`}
            >
              ANALYZER
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full transition-all ${
                activeTab === "history"
                  ? "bg-white text-black"
                  : "text-gray-400 hover:text-white bg-white/5"
              }`}
            >
              HISTORY
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Campaign Hero Banner (When no video uploaded yet) */}
        {!video && activeTab === "analyzer" && (
          <div className="nike-card p-10 bg-gradient-to-r from-neutral-900 via-zinc-900 to-black text-center space-y-4 border-white/15">
            <span className="text-xs font-mono font-bold tracking-widest text-gray-400 uppercase">
              BIOMECHANICAL REVOLUTION
            </span>
            <h2 className="nike-display-title text-white tracking-tight">
              FEEL THE PRECISION. MASTER YOUR FORM.
            </h2>
            <p className="text-xs text-gray-300 max-w-xl mx-auto leading-relaxed">
              Real-time 33-point sub-pixel body tracking, universal somatotype calibration,
              and multimodal Gemini 3.6 Flash vision analysis.
            </p>
          </div>
        )}

        {activeTab === "history" ? (
          <div className="max-w-2xl mx-auto">
            <HistoryPanel />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Step Wizard Bar */}
            <div className="no-print flex items-center justify-center gap-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <span className={`flex items-center gap-2 ${sport ? "text-emerald-400" : "text-white"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${sport ? "bg-emerald-500 text-black font-bold" : "bg-white text-black font-bold"}`}>1</span>
                SPORT
              </span>
              <div className="w-8 h-px bg-white/15" />
              <span className={`flex items-center gap-2 ${video ? "text-emerald-400" : sport ? "text-white" : "text-gray-600"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${video ? "bg-emerald-500 text-black font-bold" : sport ? "bg-white text-black font-bold" : "bg-gray-800 text-gray-500"}`}>2</span>
                FILM UPLOAD
              </span>
              <div className="w-8 h-px bg-white/15" />
              <span className={`flex items-center gap-2 ${allRolesCaptured ? "text-emerald-400" : video ? "text-white" : "text-gray-600"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${allRolesCaptured ? "bg-emerald-500 text-black font-bold" : video ? "bg-white text-black font-bold" : "bg-gray-800 text-gray-500"}`}>3</span>
                ANALYSIS
              </span>
              <div className="w-8 h-px bg-white/15" />
              <span className={`flex items-center gap-2 ${metricsResult ? "text-emerald-400" : allRolesCaptured ? "text-white" : "text-gray-600"}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${metricsResult ? "bg-emerald-500 text-black font-bold" : allRolesCaptured ? "bg-white text-black font-bold" : "bg-gray-800 text-gray-500"}`}>4</span>
                RESULTS
              </span>
            </div>

            {/* Step 1: Sport Selection */}
            {!sport && <SportSelector onSelect={(s) => setSport(s)} />}

            {/* Step 2: Video Upload */}
            {sport && !video && <VideoUploader onUploaded={(v) => setVideo(v)} />}

            {/* Step 3: Video Scrubber & Auto-Scan */}
            {sport && video && !metricsResult && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setVideo(null)}
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1 font-semibold uppercase tracking-wider"
                  >
                    ← CHOOSE DIFFERENT FILM
                  </button>
                  <span className="text-xs text-gray-300 font-mono font-bold">
                    DISCIPLINE: {sport === "bowling" ? "CRICKET BOWLING" : "CONVENTIONAL DEADLIFT"}
                  </span>
                </div>

                {/* Auto-Scan Campaign Card */}
                <div className="nike-card p-8 border-white/20 bg-gradient-to-r from-neutral-900 via-zinc-900 to-black flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center text-xl font-bold flex-shrink-0">
                      ⚡
                    </div>
                    <div className="space-y-1">
                      <h3 className="nike-display-title text-2xl text-white">
                        AUTOMATIC FULL VIDEO SCAN
                      </h3>
                      <p className="text-xs text-gray-300 leading-relaxed max-w-lg">
                        Scan the complete video to auto-detect key rep phases (setup, early pull, lockout) and evaluate biomechanical risk.
                      </p>
                    </div>
                  </div>
                  <button
                    id="auto-scan-btn"
                    onClick={runAutoScan}
                    disabled={analyzing}
                    className="btn-nike-primary flex-shrink-0"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        SCANNING ENTIRE FILM…
                      </>
                    ) : (
                      <>
                        ⚡ AUTO-SCAN WHOLE VIDEO
                      </>
                    )}
                  </button>
                </div>

                {sport === "bowling" && (
                  <SideConfig
                    armSide={armSide}
                    legSide={legSide}
                    onArmSideChange={setArmSide}
                    onLegSideChange={setLegSide}
                  />
                )}

                <VideoScrubber
                  sport={sport}
                  video={video}
                  capturedFrames={capturedFrames}
                  onFrameCaptured={handleFrameCaptured}
                />

                {/* Manual Analysis Trigger */}
                <div className="text-center pt-4">
                  <button
                    id="run-analysis-btn"
                    onClick={runAnalysis}
                    disabled={!allRolesCaptured || analyzing}
                    className="btn-nike-primary text-base px-10 py-4 shadow-2xl"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ANALYZING BIOMECHANICS…
                      </>
                    ) : (
                      <>
                        ANALYZE CAPTURED FRAMES →
                      </>
                    )}
                  </button>
                  {analysisError && (
                    <p className="text-xs text-red-400 font-bold mt-3">{analysisError}</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Results Display */}
            {sport && video && metricsResult && (
              <div className="space-y-8 animate-fade-in">
                <div className="no-print flex justify-between items-center">
                  <button
                    onClick={resetAll}
                    className="btn-nike-secondary text-xs no-print"
                  >
                    ← ANALYZE ANOTHER VIDEO
                  </button>
                </div>

                {/* Render captured frames with Skeleton Overlay */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.keys(capturedFrames).map((role) => {
                    const frame = capturedFrames[role];
                    const label = FRAME_ROLES[sport].find((r) => r.role === role)?.label || role;
                    if (!frame) return null;
                    return (
                      <SkeletonOverlay
                        key={role}
                        frame={frame}
                        metrics={metricsResult}
                        title={label}
                      />
                    );
                  })}
                </div>

                {/* Results Panel */}
                <ResultsPanel
                  metrics={metricsResult}
                  sport={sport}
                  aiReport={aiReport || undefined}
                  anthropometrics={anthropometrics || undefined}
                  aiVision={aiVision || undefined}
                  repDuration={(() => {
                    if (sport === "deadlift" && capturedFrames.setup && capturedFrames.lockout) {
                      const diff = capturedFrames.lockout.timestampSeconds - capturedFrames.setup.timestampSeconds;
                      return Math.max(0.5, Math.round(diff * 100) / 100);
                    }
                    if (sport === "bowling" && capturedFrames.arm_horizontal && capturedFrames.release) {
                      const diff = capturedFrames.release.timestampSeconds - capturedFrames.arm_horizontal.timestampSeconds;
                      return Math.max(0.2, Math.round(diff * 100) / 100);
                    }
                    return null;
                  })()}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-white/10 py-8 bg-black">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 font-mono">
          <p>© 2026 FormCheck. Athletic Movement Engine. All rights reserved.</p>
          <p className="uppercase tracking-widest text-[10px]">NIKE KINETIC DESIGN SPEC COMPLIANT</p>
        </div>
      </footer>
    </div>
  );
}
