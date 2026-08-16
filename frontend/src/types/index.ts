/* FormCheck shared TypeScript types. */

export type Sport = "bowling" | "deadlift";

export type BowlingFrameRole = "arm_horizontal" | "release";
export type DeadliftFrameRole = "setup" | "early_pull" | "lockout";
export type FrameRole = BowlingFrameRole | DeadliftFrameRole;

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface CapturedFrame {
  role: FrameRole;
  timestampSeconds: number;
  frameBase64: string;
  annotatedBase64: string | null;
  landmarks: Landmark[] | null;
}

export interface MetricResult {
  metric_name: string;
  display_name: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  flagged: boolean;
  joints: number[];
  fault_name?: string;
  injury_note?: string;
  fix_tip?: string;
}

export interface AICoachingReport {
  ai_score: number;
  risk_level: string;
  risk_color: string;
  summary: string;
  insights: Array<{
    category: string;
    title: string;
    detail: string;
  }>;
  cues: string[];
  recommended_drills: Array<{
    name: string;
    description: string;
  }>;
}

export interface Anthropometrics {
  torso_length?: number;
  femur_length?: number;
  tibia_length?: number;
  arm_length?: number;
  torso_femur_ratio?: number;
  arm_torso_ratio?: number;
  lever_type?: string;
  note?: string;
  somatotype?: string;
  somatotype_label?: string;
  body_type_note?: string;
  description?: string;
  stance_recommendation?: string;
}

export interface AIVisionAnalysis {
  ai_vision_active?: boolean;
  is_form_correct?: boolean;
  form_verdict?: string;
  primary_fault?: string | null;
  spine_alignment?: string;
  posture_assessment?: string;
  bar_path_quality?: string;
  bar_path_assessment?: string;
  vision_observations?: string[];
  summary?: string;
  ai_reasoning?: string;
}

export interface AnalysisResult {
  submission_id: number;
  sport: Sport;
  metrics: MetricResult[];
  total_metrics: number;
  total_flags: number;
  ai_report?: AICoachingReport;
  anthropometrics?: Anthropometrics;
  ai_vision?: AIVisionAnalysis;
}

export interface SubmissionHistory {
  id: number;
  sport: Sport;
  metrics: MetricResult[];
  flags: string[];
  created_at: string;
}

export interface VideoMeta {
  video_id: string;
  filename: string;
  duration_seconds: number;
  fps: number;
  width: number;
  height: number;
}

export interface FrameRoleConfig {
  role: FrameRole;
  label: string;
  description: string;
  optional?: boolean;
}

export const FRAME_ROLES: Record<Sport, FrameRoleConfig[]> = {
  bowling: [
    { role: "arm_horizontal", label: "Arm Horizontal", description: "Bowling arm reaches horizontal level during run-up" },
    { role: "release", label: "Ball Release", description: "Point of ball release at delivery stride" },
  ],
  deadlift: [
    { role: "setup", label: "Setup (bar on floor)", description: "Barbell resting on floor before lift initiation" },
    { role: "early_pull", label: "Early Pull (optional)", description: "Barbell 1-2 inches off floor", optional: true },
    { role: "lockout", label: "Lockout (standing)", description: "Full vertical standing lockout position" },
  ],
};
