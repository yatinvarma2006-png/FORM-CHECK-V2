"""AI Biomechanical Coach & Kinematic Analysis module.

Generates personalized biomechanical insights, injury-prevention coaching,
movement efficiency ratings, and custom drill recommendations based on joint angle metrics.
"""

from __future__ import annotations

from typing import Any, Dict, List


def generate_ai_coaching_report(
    sport: str,
    metrics: List[Dict[str, Any]],
    total_flags: int,
) -> Dict[str, Any]:
    """Generate intelligent biomechanical coaching insights and efficiency scores.

    Parameters
    ----------
    sport : "bowling" or "deadlift".
    metrics : List of computed metric dictionaries.
    total_flags : Count of flagged biomechanical faults.

    Returns
    -------
    Dict containing AI efficiency score, summary, risk rating, cues, and drills.
    """
    total_metrics = len(metrics)
    passed_metrics = total_metrics - total_flags

    # Calculate AI Form Efficiency Score (0-100)
    if total_metrics > 0:
        base_score = (passed_metrics / total_metrics) * 100
        deviation_penalty = 0.0
        for m in metrics:
            if m.get("flagged"):
                val = m.get("value", 0)
                lo = m.get("min", 0)
                hi = m.get("max", 0)
                if val < lo:
                    dev = (lo - val) / max(1.0, lo)
                else:
                    dev = (val - hi) / max(1.0, hi)
                deviation_penalty += min(15.0, dev * 20.0)

        ai_score = max(10, min(100, int(base_score - deviation_penalty)))
    else:
        ai_score = 100

    # Risk level classification
    if total_flags == 0:
        risk_level = "Low Risk"
        risk_color = "emerald"
    elif total_flags == 1:
        risk_level = "Moderate Risk"
        risk_color = "amber"
    else:
        risk_level = "High Injury Risk"
        risk_color = "red"

    insights = []
    recommended_drills = []
    cues = []

    if sport.lower() == "bowling":
        if total_flags == 0:
            summary = (
                "Excellent fast-bowling kinematics! Your front leg bracing and arm trajectory "
                "effectively dissipate ground reaction forces while maximizing energy transfer into release."
            )
            cues.append("Maintain front-leg firmness through the delivery stride.")
            cues.append("Focus on smooth momentum buildup during the run-up.")
        else:
            summary = (
                f"FormCheck AI detected {total_flags} kinetic chain breakdown(s) during your bowling action. "
                "Uncompensated joint angles at release increase torsional spinal stress and lower-back strain."
            )

        for m in metrics:
            name = m.get("metric_name")
            flagged = m.get("flagged", False)
            val = m.get("value")

            if name == "elbow_extension":
                if flagged:
                    insights.append({
                        "category": "Action Legality & Back Load",
                        "title": f"Elbow Flexion Deviation ({val}° extension)",
                        "detail": (
                            "AI Analysis indicates your bowling arm flexes or extends between the horizontal position "
                            "and release. In addition to potential action legality concerns, elbow flexing alters the "
                            "lever length, transferring counter-rotational torque into the lumbar spine."
                        ),
                    })
                    cues.append("Keep bowling arm locked at constant extension from horizontal shoulder height to ball release.")
                    recommended_drills.append({
                        "name": "Wall-Guided Arm Path Drill",
                        "description": "Stand parallel to a soft mat/wall and practice delivery stride ensuring your arm stays in a fixed arc without bending.",
                    })
                else:
                    insights.append({
                        "category": "Arm Trajectory",
                        "title": "Clean Arm Path",
                        "detail": f"Elbow extension ({val}°) is stable within biomechanical tolerance limits (0°–15°).",
                    })

            elif name == "front_knee_angle":
                if flagged:
                    insights.append({
                        "category": "Ground Force Transfer",
                        "title": f"Collapsing Front Knee ({val}°)",
                        "detail": (
                            "AI Kinematic Scan detected knee flexion upon impact. A collapsing front leg absorbs braking force "
                            "that should be catapulted into ball speed, channeling shock loads directly into your knee joint and lower back."
                        ),
                    })
                    cues.append("Drive the front heel down and brace the knee like a wooden pillar upon plant.")
                    recommended_drills.append({
                        "name": "Weighted Step-Down Bracing Drills",
                        "description": "Step off a 6-inch box onto your landing foot and lock the quad/knee immediately without bending.",
                    })
                else:
                    insights.append({
                        "category": "Front Leg Brace",
                        "title": "Solid Landing Brace",
                        "detail": f"Front knee angle ({val}°) provides optimal rigid lever support during release.",
                    })

            elif name == "shoulder_hip_separation":
                if flagged:
                    insights.append({
                        "category": "Rotational Spinal Torque",
                        "title": f"Sub-Optimal Separation ({val}°)",
                        "detail": (
                            "AI Torque Assessment shows premature shoulder rotation before hip drive. "
                            "This front-on misalignment multiplies lumbar rotational stress during final release."
                        ),
                    })
                    cues.append("Lead with the non-bowling hip; let shoulders delay until hips open toward target.")
                    recommended_drills.append({
                        "name": "Hip-Drive Cable / Band Rotations",
                        "description": "Anchor a resistance band behind you, initiate pelvic turn first, then follow through with upper torso.",
                    })
                else:
                    insights.append({
                        "category": "Torque & Rotation",
                        "title": "Optimal Trunk Separation",
                        "detail": f"Shoulder-hip separation ({val}°) aligns hip drive efficiently prior to ball release.",
                    })

    else:  # Deadlift
        if total_flags == 0:
            summary = (
                "Outstanding deadlift mechanics! Hips and chest rise in unison, loading the posterior chain "
                "(glutes & hamstrings) while preserving spinal neutral alignment."
            )
            cues.append("Maintain tension in lats throughout the entire ascent.")
            cues.append("Squeeze glutes hard at lockout without leaning back.")
        else:
            summary = (
                f"FormCheck AI flagged {total_flags} mechanical defect(s) in your hinge movement pattern. "
                "Failure to extension-lock or sync hip/shoulder rise shifts shear force onto L4-L5 lumbar vertebrae."
            )

        for m in metrics:
            name = m.get("metric_name")
            flagged = m.get("flagged", False)
            val = m.get("value")

            if name == "hip_shoulder_rise_ratio":
                if flagged:
                    insights.append({
                        "category": "Leverage & Lumbar Load",
                        "title": f"Asynchronous Rise Ratio ({val})",
                        "detail": (
                            f"AI Trajectory Tracker detected a rise ratio of {val} (target range: 0.5–1.4). "
                            "Your hips are shooting up faster than your shoulders early in the pull. "
                            "This turns the deadlift into a stiff-legged pull, dramatically multiplying lower-back shear."
                        ),
                    })
                    cues.append("Push the floor away with your feet; chest and hips must rise at the exact same rate.")
                    recommended_drills.append({
                        "name": "Paused Deadlifts (1 inch off floor)",
                        "description": "Lift the bar 1-2 inches off the ground, hold for 2 seconds to verify hips/chest rise together, then complete the pull.",
                    })
                else:
                    insights.append({
                        "category": "Leverage & Lumbar Load",
                        "title": "Synchronized Torso & Hip Rise",
                        "detail": f"Rise ratio ({val}) confirms hips and chest rise in sync without premature hip shoot-up.",
                    })

            elif name == "hip_lockout_angle":
                if flagged:
                    insights.append({
                        "category": "Glute Activation & Rep Finish",
                        "title": f"Incomplete Hip Extension ({val}°)",
                        "detail": (
                            f"AI Extension Analyzer detected incomplete hip lockout at top ({val}°, target: 160°–180°). "
                            "Stopping short leaves the load suspended on the lumbar erectors instead of transferring weight onto strong gluteal muscles."
                        ),
                    })
                    cues.append("Stand tall at top and squeeze glutes forward into the bar; do not soft-hip the lockout.")
                    recommended_drills.append({
                        "name": "Kneeling Hip Thrusts with Band",
                        "description": "Reinforce terminal hip extension by thrusting hips forward against band resistance while kneeling.",
                    })
                else:
                    insights.append({
                        "category": "Glute Activation & Rep Finish",
                        "title": "Complete Terminal Hip Lockout",
                        "detail": f"Hip extension angle ({val}°) confirms full hip lockout over your mid-foot base of support.",
                    })

            elif name == "knee_lockout_angle":
                if flagged:
                    insights.append({
                        "category": "Terminal Quad Lockout",
                        "title": f"Flexed Knees at Lockout ({val}°)",
                        "detail": (
                            f"AI Joint Position Detector found knee flexion at top of rep ({val}°, target: 165°–180°). "
                            "Soft knees prevent full posterior chain lockout and may cause lift disqualification."
                        ),
                    })
                    cues.append("Flex quads hard at the top to complete knee extension simultaneously with hip extension.")
                    recommended_drills.append({
                        "name": "Terminal Knee Extension (TKE) Drills",
                        "description": "Loop a heavy resistance band behind knee joint and flex quads to lock out against tension.",
                    })
                else:
                    insights.append({
                        "category": "Terminal Quad Lockout",
                        "title": "Full Knee Lockout",
                        "detail": f"Knee lockout angle ({val}°) confirms fully extended quad drive at the top of the rep.",
                    })

    return {
        "ai_score": ai_score,
        "risk_level": risk_level,
        "risk_color": risk_color,
        "summary": summary,
        "insights": insights,
        "cues": cues,
        "recommended_drills": recommended_drills,
    }
