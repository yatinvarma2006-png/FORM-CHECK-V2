/* API client for FormCheck backend. */
import type { Landmark, MetricResult, AICoachingReport, Anthropometrics, AIVisionAnalysis } from "../types";

const BASE_URL = "http://localhost:8000/api";

function getSessionId(): string {
  let id = localStorage.getItem("formcheck_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("formcheck_session_id", id);
  }
  return id;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "x-session-id": getSessionId(),
    ...(options.headers as Record<string, string> || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(detail.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface AnalyzeResponse {
  submission_id: number;
  sport: string;
  metrics: MetricResult[];
  total_metrics: number;
  total_flags: number;
  ai_report?: AICoachingReport;
  ai_coaching_report?: AICoachingReport;
  anthropometrics?: Anthropometrics;
  ai_vision?: AIVisionAnalysis;
  ai_vision_analysis?: AIVisionAnalysis;
}

export interface AutoScanResponse {
  submission_id: number;
  sport: string;
  auto_detected: boolean;
  detected_frames: Array<{
    role: string;
    label: string;
    timestamp: number;
    frame_base64: string;
    annotated_base64: string | null;
    landmarks: Landmark[];
  }>;
  metrics: MetricResult[];
  total_metrics: number;
  total_flags: number;
  ai_report?: AICoachingReport;
  ai_coaching_report?: AICoachingReport;
  anthropometrics?: Anthropometrics;
  ai_vision?: AIVisionAnalysis;
  ai_vision_analysis?: AIVisionAnalysis;
}

export const api = {
  uploadVideo: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{
      video_id: string;
      filename: string;
      duration_seconds: number;
      fps: number;
      width: number;
      height: number;
    }>("/video/upload", { method: "POST", body: fd });
  },

  extractFrame: (videoId: string, timestampSeconds: number) =>
    request<{
      frame_base64: string;
      annotated_base64: string | null;
      landmarks: Landmark[] | null;
      timestamp_seconds: number;
      pose_detected: boolean;
    }>("/video/extract-frame", {
      method: "POST",
      body: JSON.stringify({
        video_id: videoId,
        timestamp_seconds: timestampSeconds,
      }),
    }),

  analyze: (body: {
    sport: string;
    frames: Array<{ role: string; landmarks: Landmark[] }>;
    arm_side?: string;
    leg_side?: string;
  }) =>
    request<AnalyzeResponse>("/analysis/analyze", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  analyzeFrames: (body: {
    sport: string;
    frames: Array<{ role: string; landmarks: Landmark[] }>;
    arm_side?: string;
    leg_side?: string;
  }) =>
    request<AnalyzeResponse>("/analysis/analyze", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  autoScan: (body: {
    video_id: string;
    sport: string;
    arm_side?: string;
    leg_side?: string;
  }) =>
    request<AutoScanResponse>("/analysis/auto-scan", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  autoScanVideo: (body: {
    video_id: string;
    sport: string;
    arm_side?: string;
    leg_side?: string;
  }) =>
    request<AutoScanResponse>("/analysis/auto-scan", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getHistory: () =>
    request<
      Array<{
        id: number;
        sport: string;
        metrics: MetricResult[];
        flags: string[];
        created_at: string;
      }>
    >("/analysis/history"),

  aiChat: (body: {
    message: string;
    history: Array<{ role: string; text: string }>;
    sport?: string | null;
    metrics_context?: MetricResult[] | null;
    ai_report_context?: AICoachingReport | null;
  }) =>
    request<{ reply: string }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
