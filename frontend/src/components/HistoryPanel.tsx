/**
 * HistoryPanel — displays past submissions for the current session.
 */
import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { SubmissionHistory } from "../types";

export default function HistoryPanel() {
  const [history, setHistory] = useState<SubmissionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      setHistory(data as any);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-6 text-center text-gray-400">
        <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-2" />
        Loading history…
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-gray-400">
        <p className="text-sm">No past submissions found for this session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">Submission History</h3>
        <button
          onClick={fetchHistory}
          className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {history.map((sub) => (
          <div key={sub.id} className="glass-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-white capitalize">
                {sub.sport === "bowling" ? "🏏 Cricket Bowling" : "🏋️ Deadlift"}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  sub.flags.length === 0
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400"
                }`}
              >
                {sub.flags.length === 0
                  ? "Clean Form"
                  : `${sub.flags.length} Flag${sub.flags.length > 1 ? "s" : ""}`}
              </span>
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              {sub.metrics.map((m) => (
                <div key={m.metric_name} className="flex justify-between">
                  <span>{m.display_name}:</span>
                  <span className={m.flagged ? "text-red-400 font-medium" : "text-gray-300"}>
                    {m.value} {m.unit} {m.flagged ? "⚠️" : "✓"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
