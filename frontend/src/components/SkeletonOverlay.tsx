/**
 * SkeletonOverlay (v3.0 Stage Card Layout)
 * Displays wide stage card with centered video frame and 100% locked skeleton overlay.
 */
import type { CapturedFrame, MetricResult } from "../types";

interface Props {
  frame: CapturedFrame;
  metrics: MetricResult[];
  title: string;
}

// Complete anatomical body connections (indices 11-32)
const CONNECTIONS: [number, number][] = [
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 12],           // shoulder girdle
  [11, 23], [12, 24], // lateral torso
  [23, 24],           // pelvic girdle
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
  [27, 29], [29, 31], // left foot
  [28, 30], [30, 32], // right foot
  [27, 31], [28, 32], // foot base
];

const MIN_VISIBILITY = 0.4;

function computeAngleDeg(p1: { x: number; y: number }, p2: { x: number; y: number }, p3: { x: number; y: number }) {
  const ba = { x: p1.x - p2.x, y: p1.y - p2.y };
  const bc = { x: p3.x - p2.x, y: p3.y - p2.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const cross = ba.x * bc.y - ba.y * bc.x;
  const rad = Math.atan2(Math.abs(cross), dot);
  return Math.round((rad * 180) / Math.PI);
}

export default function SkeletonOverlay({ frame, metrics, title }: Props) {
  if (!frame.landmarks) return null;

  const jointStatus: Record<number, "ok" | "flagged"> = {};
  for (const m of metrics) {
    for (const j of m.joints) {
      if (m.flagged) {
        jointStatus[j] = "flagged";
      } else if (!jointStatus[j]) {
        jointStatus[j] = "ok";
      }
    }
  }

  const landmarks = frame.landmarks;

  const toX = (nx: number) => nx * 1000;
  const toY = (ny: number) => ny * 1000;

  const isVisible = (idx: number) =>
    landmarks[idx] && (landmarks[idx].visibility ?? 1) >= MIN_VISIBILITY;

  // Mid-spine line
  const shMidX = isVisible(11) && isVisible(12) ? (landmarks[11].x + landmarks[12].x) / 2 : null;
  const shMidY = isVisible(11) && isVisible(12) ? (landmarks[11].y + landmarks[12].y) / 2 : null;
  const hipMidX = isVisible(23) && isVisible(24) ? (landmarks[23].x + landmarks[24].x) / 2 : null;
  const hipMidY = isVisible(23) && isVisible(24) ? (landmarks[23].y + landmarks[24].y) / 2 : null;

  // Key joint angle badges
  const jointAngleBadges: { idx: number; text: string; status?: "ok" | "flagged" }[] = [];

  const pSh = isVisible(11) ? landmarks[11] : isVisible(12) ? landmarks[12] : null;
  const pHip = isVisible(23) ? landmarks[23] : isVisible(24) ? landmarks[24] : null;
  const pKnee = isVisible(25) ? landmarks[25] : isVisible(26) ? landmarks[26] : null;
  const pAnkle = isVisible(27) ? landmarks[27] : isVisible(28) ? landmarks[28] : null;

  if (pSh && pHip && pKnee) {
    const hipAngle = computeAngleDeg(pSh, pHip, pKnee);
    const hipMetric = metrics.find((m) => m.metric_name === "hip_lockout_angle");
    jointAngleBadges.push({
      idx: pHip === landmarks[23] ? 23 : 24,
      text: `${hipAngle}°`,
      status: hipMetric ? (hipMetric.flagged ? "flagged" : "ok") : undefined,
    });
  }

  if (pHip && pKnee && pAnkle) {
    const kneeAngle = computeAngleDeg(pHip, pKnee, pAnkle);
    const kneeMetric = metrics.find((m) => m.metric_name === "knee_lockout_angle");
    jointAngleBadges.push({
      idx: pKnee === landmarks[25] ? 25 : 26,
      text: `${kneeAngle}°`,
      status: kneeMetric ? (kneeMetric.flagged ? "flagged" : "ok") : undefined,
    });
  }

  return (
    <div className="nike-card overflow-hidden w-full shadow-2xl border-white/15 bg-neutral-950">
      {/* Header Bar */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-black">
        <h4 className="text-xs font-bold text-gray-200 font-mono tracking-wide">{title}</h4>
        <span className="badge-nike-success text-[10px] px-2.5 py-0.5">
          LOCKED
        </span>
      </div>

      {/* Outer Fixed Stage Container */}
      <div className="w-full h-72 sm:h-80 bg-black flex items-center justify-center overflow-hidden relative">
        {/* Inner Wrapper tightly fitting the image dimensions 1:1 */}
        <div className="relative h-full w-auto flex items-center justify-center">
          <img
            src={`data:image/jpeg;base64,${frame.frameBase64}`}
            alt={title}
            className="h-full w-auto block object-contain select-none"
          />

          {/* SVG Overlay locked 1:1 directly over the image */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            {/* Spine Line */}
            {shMidX !== null && shMidY !== null && hipMidX !== null && hipMidY !== null && (
              <line
                x1={toX(shMidX)}
                y1={toY(shMidY)}
                x2={toX(hipMidX)}
                y2={toY(hipMidY)}
                stroke="#38bdf8"
                strokeWidth="6"
                strokeDasharray="10 6"
              />
            )}

            {/* Bone Connections */}
            {CONNECTIONS.map(([i, j]) => {
              if (!isVisible(i) || !isVisible(j)) return null;
              const hasFlagged = jointStatus[i] === "flagged" || jointStatus[j] === "flagged";
              return (
                <line
                  key={`${i}-${j}`}
                  x1={toX(landmarks[i].x)}
                  y1={toY(landmarks[i].y)}
                  x2={toX(landmarks[j].x)}
                  y2={toY(landmarks[j].y)}
                  stroke={hasFlagged ? "#ef4444" : "#10b981"}
                  strokeWidth={hasFlagged ? "6" : "5"}
                  strokeOpacity={0.9}
                />
              );
            })}

            {/* Joint Angle Badges */}
            {jointAngleBadges.map(({ idx, text, status }) => {
              if (!isVisible(idx)) return null;
              const x = toX(landmarks[idx].x) + 25;
              const y = toY(landmarks[idx].y) - 12;
              const badgeBg = status === "flagged" ? "#ef4444" : status === "ok" ? "#10b981" : "#3b82f6";
              return (
                <g key={`badge-${idx}`}>
                  <rect
                    x={x - 8}
                    y={y - 25}
                    width={90}
                    height={38}
                    rx={8}
                    fill={badgeBg}
                    fillOpacity={0.95}
                  />
                  <text
                    x={x + 37}
                    y={y}
                    fill="#ffffff"
                    fontSize="22"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {text}
                  </text>
                </g>
              );
            })}

            {/* Anatomical Joint Dots */}
            {landmarks.map((lm, idx) => {
              if (idx < 11) return null;
              if (!isVisible(idx)) return null;
              const status = jointStatus[idx];
              const color =
                status === "flagged"
                  ? "#ef4444"
                  : status === "ok"
                  ? "#10b981"
                  : "#10b981";
              const r = status === "flagged" ? 14 : 11;

              return (
                <g key={idx}>
                  {status === "flagged" && (
                    <circle
                      cx={toX(lm.x)}
                      cy={toY(lm.y)}
                      r={22}
                      fill="#ef4444"
                      fillOpacity={0.3}
                    />
                  )}
                  <circle
                    cx={toX(lm.x)}
                    cy={toY(lm.y)}
                    r={r}
                    fill={color}
                    stroke="#000000"
                    strokeWidth="3"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
