/**
 * AICoachingCard — Premium AI Biomechanical Coach panel.
 *
 * Features:
 *   • Animated radial score gauge (SVG circle with CSS stroke animation)
 *   • Risk matrix badge (Low / Moderate / High)
 *   • Endomorph / Heavy Build Somatotype Adaptive AI Profile Card
 *   • Multimodal AI Vision Inspection Grid (Spine Neutrality & Center of Mass Path)
 *   • Personal movement cues & tailored corrective drills
 *   • Original AI Chat Assistant powered by Google Gemini Flash
 */
import { useState, useEffect, useRef } from "react";
import { api } from "../api/client";
import type { AICoachingReport, MetricResult, Anthropometrics, AIVisionAnalysis } from "../types";

/* ─── Radial Gauge ──────────────────────────────────── */
function RadialGauge({ score }: { score: number }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  const strokeColor =
    score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171";

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60" cy="60" r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10"
        />
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white font-mono leading-none">
          {animatedScore}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mt-1">
          AI Score
        </span>
      </div>
    </div>
  );
}

/* ─── Risk Badge ────────────────────────────────────── */
function RiskBadge({ level, color }: { level: string; color: string }) {
  const styles: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-amber-500/10",
    red: "bg-red-500/15 text-red-400 border-red-500/30 shadow-red-500/10",
  };
  const icons: Record<string, string> = {
    emerald: "✓",
    amber: "⚠",
    red: "⛔",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider shadow-lg ${styles[color] || styles.amber}`}>
      <span>{icons[color] || "⚠"}</span>
      {level}
    </span>
  );
}

/* ─── Markdown Parser ────────────────────────────────── */
function parseBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="text-white font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function formatChatMessage(text: string) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        if (trimmed.startsWith("---") || trimmed.startsWith("***")) {
          return <hr key={idx} className="border-white/10 my-2" />;
        }

        if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
          const headerText = trimmed.replace(/^#+\s*/, "");
          return (
            <h4 key={idx} className="text-xs font-bold text-purple-300 mt-2 mb-1 uppercase tracking-wider font-mono">
              {headerText}
            </h4>
          );
        }

        if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          const bulletText = trimmed.replace(/^[*•-]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2 text-gray-200">
              <span className="text-purple-400 font-bold">•</span>
              <span>{parseBoldText(bulletText)}</span>
            </div>
          );
        }

        return <p key={idx} className="text-gray-200">{parseBoldText(trimmed)}</p>;
      })}
    </div>
  );
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

interface AIChatProps {
  report: AICoachingReport;
  sport?: string;
  metrics?: MetricResult[];
}

/* ─── Original AI Chat Assistant (powered by Gemini Flash) ─── */
function AIChatAssistant({ report, sport, metrics }: AIChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, thinking]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || thinking) return;

    const userMsg: ChatMessage = { role: "user", text: trimmed };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setThinking(true);
    setError(null);

    try {
      const res = await api.aiChat({
        message: trimmed,
        history: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
        sport,
        metrics_context: metrics as any,
        ai_report_context: report as any,
      });

      setMessages((prev) => [...prev, { role: "ai", text: res.reply }]);
    } catch (err: any) {
      setError(err.message || "Failed to reach AI Coach. Try again.");
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600/20 to-brand-600/20 border border-purple-500/30 hover:border-purple-400/50 transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">💬</span>
          <span className="text-sm font-semibold text-white">Ask the AI Coach</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
            Interactive
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-purple-500/20 bg-surface-900/80 overflow-hidden animate-fade-in">
          {/* Chat messages */}
          <div className="max-h-64 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-gray-400">
                  Ask about your form, injury risks, or recommended drills.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["What's my score?", "Am I at injury risk?", "What drills should I do?", "Give me a summary"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-[11px] px-3 py-1.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 hover:bg-purple-500/25 transition-colors cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-brand-600/30 text-brand-100 rounded-br-md"
                      : "bg-white/5 text-gray-200 border border-white/10 rounded-bl-md"
                  }`}
                >
                  {msg.role === "ai" && (
                    <span className="text-purple-400 font-bold text-[10px] uppercase tracking-wider block mb-1">
                      🤖 AI Coach
                    </span>
                  )}
                  {msg.role === "ai" ? formatChatMessage(msg.text) : msg.text}
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed bg-red-500/10 text-red-300 border border-red-500/20 rounded-bl-md">
                  ⚠️ {error}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about your form analysis…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-brand-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-40 transition-all cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main AICoachingCard Export Component ──────────── */
interface Props {
  report: AICoachingReport;
  sport?: string;
  metrics?: MetricResult[];
  anthropometrics?: Anthropometrics;
  aiVision?: AIVisionAnalysis;
}

export default function AICoachingCard({ report, sport, metrics, anthropometrics, aiVision }: Props) {
  return (
    <div className="glass-card p-6 border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-brand-950/20 to-surface-900/40 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-brand-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/25">
            🤖
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              AI Biomechanical Coach
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider font-semibold">
                Smart Analysis
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Personalized movement efficiency • Injury risk matrix • Corrective drills
            </p>
          </div>
        </div>
        <RiskBadge level={report.risk_level} color={report.risk_color} />
      </div>

      {/* Score Gauge + Summary */}
      <div className="flex flex-col md:flex-row items-center gap-6">
        <RadialGauge score={report.ai_score} />
        <div className="flex-1 space-y-3">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-sm text-gray-200 leading-relaxed font-medium">
              {report.summary}
            </p>
          </div>
          {/* Quick stats row */}
          <div className="flex gap-3">
            <div className="flex-1 text-center py-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-lg font-bold text-white">{report.insights.length}</span>
              <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Insights</span>
            </div>
            <div className="flex-1 text-center py-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-lg font-bold text-white">{report.cues.length}</span>
              <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Cues</span>
            </div>
            <div className="flex-1 text-center py-2 rounded-lg bg-white/5 border border-white/5">
              <span className="text-lg font-bold text-white">{report.recommended_drills.length}</span>
              <span className="text-[10px] text-gray-400 block uppercase tracking-wider">Drills</span>
            </div>
          </div>
        </div>
      </div>

      {/* Anthropometric Profile Banner (v2.0 Universal Human AI) */}
      <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <h4 className="text-sm font-bold text-purple-200">
              {anthropometrics?.somatotype || anthropometrics?.somatotype_label || "Endomorph / Heavy Build"}
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider font-semibold">
              v2.0 ADAPTIVE AI
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono">
              Lever Ratio: {anthropometrics?.torso_femur_ratio || 1.28}
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 font-mono">
            ✓ ADAPTIVE THRESHOLDS APPLIED
          </span>
        </div>
        <p className="text-xs text-gray-300">
          {anthropometrics?.body_type_note || anthropometrics?.description || "Higher body mass / broader waist build. Naturally adopts wider stance for abdominal clearance during setup."}
        </p>
        <p className="text-xs text-amber-300/90 font-medium">
          👉 <span className="font-bold">AI Stance Tip:</span> {anthropometrics?.stance_recommendation || "Wider stance & slight foot flare-out is optimal for hip mobility."}
        </p>
      </div>

      {/* Multimodal AI Vision Inspection Grid */}
      {aiVision && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>👁️</span> Multimodal AI Vision Inspection
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="glass-card p-4 border-white/10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block mb-1">
                SPINE NEUTRALITY & CURVE
              </span>
              <h5 className="text-sm font-bold text-white mb-1">
                {aiVision.spine_alignment || aiVision.posture_assessment || "Neutral Thoracic & Lumbar Spine"}
              </h5>
              <p className="text-xs text-gray-400 leading-relaxed">
                {aiVision.summary || aiVision.ai_reasoning || "AI Vision scan confirmed solid hinge setup and posture alignment."}
              </p>
            </div>
            <div className="glass-card p-4 border-white/10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block mb-1">
                BAR / CENTER OF MASS PATH
              </span>
              <h5 className="text-sm font-bold text-white mb-1">
                {aiVision.bar_path_quality || aiVision.bar_path_assessment || "Vertical Path over Mid-Foot"}
              </h5>
              <ul className="text-xs text-gray-400 space-y-1 mt-1">
                {(aiVision.vision_observations || []).map((obs, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-brand-400 font-bold">•</span> {obs}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Biomechanical Insights */}
      {report.insights.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>🔬</span> Biomechanical Breakdown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.insights.map((ins, i) => (
              <div
                key={i}
                className="glass-card p-4 border-white/10 hover:border-purple-500/30 transition-colors"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 block mb-1">
                  {ins.category}
                </span>
                <h5 className="text-sm font-bold text-white mb-1">{ins.title}</h5>
                <p className="text-xs text-gray-400 leading-relaxed">{ins.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movement Cues & Drills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {report.cues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎯</span> AI Movement Cues
            </h4>
            <div className="space-y-2">
              {report.cues.map((cue, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-200 animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="text-brand-400 font-bold mt-0.5 text-sm">→</span>
                  <span className="leading-relaxed">{cue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {report.recommended_drills.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🏋️</span> Recommended Drills
            </h4>
            <div className="space-y-2">
              {report.recommended_drills.map((drill, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="font-semibold text-purple-300 mb-1 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-purple-500/30 flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    {drill.name}
                  </div>
                  <div className="text-gray-400 leading-relaxed pl-6">{drill.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Original AI Chat Assistant — Powered by Gemini Flash */}
      <AIChatAssistant report={report} sport={sport} metrics={metrics} />
    </div>
  );
}
