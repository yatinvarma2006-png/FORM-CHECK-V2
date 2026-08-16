"""Automatic phase detection and full-video scanning engine.

Improvements over v1:
  • Filters poses by mean visibility (> 0.6) to reject garbage detections
  • Deadlift: uses hip-knee-ankle angle (lower = deeper squat) for setup,
    and shoulder-hip-knee angle (higher = more upright) for lockout
  • Bowling: uses wrist-to-hip relative position for release detection
  • Ensures temporal ordering: setup < early_pull < lockout
"""

from __future__ import annotations

import base64
import math
from pathlib import Path
from typing import Any

import cv2
import numpy as np

from config import UPLOAD_DIR
from pose.landmarker import detect_pose, draw_skeleton
from sports.bowling import analyze_bowling
from sports.deadlift import analyze_deadlift
from sports.common import LM, compute_angle, lm_to_point, side_indices


MIN_POSE_VISIBILITY = 0.55  # Reject frames where avg visibility is below this


def _mean_body_visibility(lms: list[dict]) -> float:
    """Average visibility of key body landmarks (shoulders, hips, knees, ankles)."""
    body_indices = [
        LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER,
        LM.LEFT_HIP, LM.RIGHT_HIP,
        LM.LEFT_KNEE, LM.RIGHT_KNEE,
        LM.LEFT_ANKLE, LM.RIGHT_ANKLE,
    ]
    return sum(lms[i].get("visibility", 0) for i in body_indices) / len(body_indices)


def _encode_frame(frame_bgr: np.ndarray, landmarks: list[dict] | None = None) -> tuple[str, str | None]:
    """Encode a frame as base64 JPEG, plus an annotated base64 frame if landmarks present."""
    _, buf = cv2.imencode(".jpg", frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 98])
    b64 = base64.b64encode(buf).decode("utf-8")

    ann_b64 = None
    if landmarks:
        ann = draw_skeleton(frame_bgr, landmarks)
        _, ann_buf = cv2.imencode(".jpg", ann, [cv2.IMWRITE_JPEG_QUALITY, 98])
        ann_b64 = base64.b64encode(ann_buf).decode("utf-8")

    return b64, ann_b64


def _pick_side(lms: list[dict]) -> str:
    """Pick the body side with higher average visibility."""
    left_vis = sum(lms[i].get("visibility", 0) for i in [23, 25, 27]) / 3
    right_vis = sum(lms[i].get("visibility", 0) for i in [24, 26, 28]) / 3
    return "left" if left_vis >= right_vis else "right"


def auto_analyze_video(
    video_id: str,
    sport: str,
    arm_side: str = "right",
    leg_side: str = "left",
    thresholds: dict[str, tuple[float, float]] | None = None,
    rules: dict[str, dict] | None = None,
    sample_fps: int = 8,
) -> dict[str, Any]:
    """Scan an entire video file, auto-detect key movement phases, and analyze form faults."""
    matching = list(UPLOAD_DIR.glob(f"{video_id}.*"))
    if not matching:
        raise ValueError(f"Video {video_id} not found.")

    filepath = matching[0]
    cap = cv2.VideoCapture(str(filepath))

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(1, int(fps / sample_fps))

    frame_data: list[dict[str, Any]] = []

    frame_idx = 0
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % step == 0:
            ts = frame_idx / fps
            lms = detect_pose(frame)
            if lms is not None:
                vis = _mean_body_visibility(lms)
                if vis >= MIN_POSE_VISIBILITY:
                    frame_data.append({
                        "frame_idx": frame_idx,
                        "timestamp": ts,
                        "frame_bgr": frame,
                        "landmarks": lms,
                        "visibility": vis,
                    })
        frame_idx += 1

    cap.release()

    if not frame_data:
        raise ValueError("No reliable human pose detected in the video. Ensure the subject is clearly visible and well-lit.")

    thresholds = thresholds or {}
    rules = rules or {}

    if sport.lower() == "bowling":
        return _auto_analyze_bowling(frame_data, arm_side, leg_side, thresholds, rules)
    else:
        return _auto_analyze_deadlift(frame_data, thresholds, rules)


def _auto_analyze_bowling(
    frame_data: list[dict],
    arm_side: str,
    leg_side: str,
    thresholds: dict,
    rules: dict,
) -> dict[str, Any]:
    arm = side_indices(arm_side)

    # Release: wrist at highest point (min y) relative to shoulder
    best_release_idx = 0
    min_wrist_y = 1.0

    # Arm horizontal: shoulder-to-wrist vector closest to horizontal
    best_horiz_idx = 0
    min_horiz_diff = 180.0

    for i, item in enumerate(frame_data):
        lms = item["landmarks"]
        sh = lms[arm["shoulder"]]
        wr = lms[arm["wrist"]]

        # Skip if wrist or shoulder have low visibility
        if sh.get("visibility", 0) < 0.5 or wr.get("visibility", 0) < 0.5:
            continue

        if wr["y"] < min_wrist_y:
            min_wrist_y = wr["y"]
            best_release_idx = i

        dx = wr["x"] - sh["x"]
        dy = wr["y"] - sh["y"]
        angle_deg = abs(math.degrees(math.atan2(dy, dx)))
        diff_from_horiz = min(abs(angle_deg - 0), abs(angle_deg - 180))

        if diff_from_horiz < min_horiz_diff:
            min_horiz_diff = diff_from_horiz
            best_horiz_idx = i

    # Ensure arm_horizontal precedes release
    if best_horiz_idx >= best_release_idx and best_release_idx > 0:
        sub_horiz_idx = 0
        sub_min_diff = 180.0
        for i in range(best_release_idx):
            lms = frame_data[i]["landmarks"]
            sh = lms[arm["shoulder"]]
            wr = lms[arm["wrist"]]
            if sh.get("visibility", 0) < 0.5 or wr.get("visibility", 0) < 0.5:
                continue
            dx = wr["x"] - sh["x"]
            dy = wr["y"] - sh["y"]
            angle_deg = abs(math.degrees(math.atan2(dy, dx)))
            diff = min(abs(angle_deg - 0), abs(angle_deg - 180))
            if diff < sub_min_diff:
                sub_min_diff = diff
                sub_horiz_idx = i
        best_horiz_idx = sub_horiz_idx

    item_horiz = frame_data[best_horiz_idx]
    item_release = frame_data[best_release_idx]

    b64_h, ann_h = _encode_frame(item_horiz["frame_bgr"], item_horiz["landmarks"])
    b64_r, ann_r = _encode_frame(item_release["frame_bgr"], item_release["landmarks"])

    metrics = analyze_bowling(
        landmarks_arm_horizontal=item_horiz["landmarks"],
        landmarks_release=item_release["landmarks"],
        arm_side=arm_side,
        leg_side=leg_side,
        thresholds=thresholds,
        rules=rules,
    )

    flags = [m for m in metrics if m["flagged"]]

    return {
        "auto_detected": True,
        "sport": "bowling",
        "detected_frames": [
            {
                "role": "arm_horizontal",
                "label": "Arm Horizontal (Auto-Detected)",
                "timestamp": round(item_horiz["timestamp"], 2),
                "frame_base64": b64_h,
                "annotated_base64": ann_h,
                "landmarks": item_horiz["landmarks"],
            },
            {
                "role": "release",
                "label": "Release (Auto-Detected)",
                "timestamp": round(item_release["timestamp"], 2),
                "frame_base64": b64_r,
                "annotated_base64": ann_r,
                "landmarks": item_release["landmarks"],
            },
        ],
        "metrics": metrics,
        "total_metrics": len(metrics),
        "total_flags": len(flags),
    }


def _auto_analyze_deadlift(
    frame_data: list[dict],
    thresholds: dict,
    rules: dict,
) -> dict[str, Any]:
    """Detect setup, early_pull, lockout using joint angles instead of raw Y coords.

    Setup   = frame with lowest hip-knee-ankle angle (deepest squat position)
    Lockout = frame with highest shoulder-hip-knee angle (most upright)
    Early pull = ~30% of hip travel from setup toward lockout
    """
    side = _pick_side(frame_data[0]["landmarks"])
    idx = side_indices(side)

    # Compute hip angle (shoulder-hip-knee) for every frame — higher = more upright
    angles: list[float] = []
    for item in frame_data:
        lms = item["landmarks"]
        hip_angle = compute_angle(
            lm_to_point(lms[idx["shoulder"]]),
            lm_to_point(lms[idx["hip"]]),
            lm_to_point(lms[idx["knee"]]),
        )
        angles.append(hip_angle)

    # Setup: smallest hip angle (most bent over / deepest position)
    # But only search the first 70% of the video (setup should happen early)
    search_end_setup = max(1, int(len(frame_data) * 0.7))
    setup_idx = 0
    min_angle = 360.0
    for i in range(search_end_setup):
        if angles[i] < min_angle:
            min_angle = angles[i]
            setup_idx = i

    # Lockout: largest hip angle AFTER setup (most upright)
    lockout_idx = setup_idx
    max_angle = 0.0
    for i in range(setup_idx, len(frame_data)):
        if angles[i] > max_angle:
            max_angle = angles[i]
            lockout_idx = i

    # If setup and lockout ended up the same, spread them
    if lockout_idx <= setup_idx:
        lockout_idx = len(frame_data) - 1

    # Early pull: frame ~30% of the angle range from setup toward lockout
    target_angle = min_angle + 0.30 * (max_angle - min_angle)
    early_pull_idx = setup_idx
    best_diff = 999.0
    for i in range(setup_idx, lockout_idx + 1):
        diff = abs(angles[i] - target_angle)
        if diff < best_diff:
            best_diff = diff
            early_pull_idx = i

    # Ensure they are all distinct and ordered
    if early_pull_idx <= setup_idx:
        early_pull_idx = min(setup_idx + 1, lockout_idx)
    if early_pull_idx >= lockout_idx:
        early_pull_idx = max(setup_idx + 1, lockout_idx - 1)
    early_pull_idx = max(0, min(early_pull_idx, len(frame_data) - 1))

    item_setup = frame_data[setup_idx]
    item_early = frame_data[early_pull_idx]
    item_lockout = frame_data[lockout_idx]

    b64_s, ann_s = _encode_frame(item_setup["frame_bgr"], item_setup["landmarks"])
    b64_e, ann_e = _encode_frame(item_early["frame_bgr"], item_early["landmarks"])
    b64_l, ann_l = _encode_frame(item_lockout["frame_bgr"], item_lockout["landmarks"])

    metrics = analyze_deadlift(
        landmarks_setup=item_setup["landmarks"],
        landmarks_early_pull=item_early["landmarks"],
        landmarks_lockout=item_lockout["landmarks"],
        thresholds=thresholds,
        rules=rules,
    )

    flags = [m for m in metrics if m["flagged"]]

    return {
        "auto_detected": True,
        "sport": "deadlift",
        "detected_frames": [
            {
                "role": "setup",
                "label": "Setup (Bar at Floor - Auto-Detected)",
                "timestamp": round(item_setup["timestamp"], 2),
                "frame_base64": b64_s,
                "annotated_base64": ann_s,
                "landmarks": item_setup["landmarks"],
            },
            {
                "role": "early_pull",
                "label": "Early Pull (~30% up - Auto-Detected)",
                "timestamp": round(item_early["timestamp"], 2),
                "frame_base64": b64_e,
                "annotated_base64": ann_e,
                "landmarks": item_early["landmarks"],
            },
            {
                "role": "lockout",
                "label": "Lockout (Standing Tall - Auto-Detected)",
                "timestamp": round(item_lockout["timestamp"], 2),
                "frame_base64": b64_l,
                "annotated_base64": ann_l,
                "landmarks": item_lockout["landmarks"],
            },
        ],
        "metrics": metrics,
        "total_metrics": len(metrics),
        "total_flags": len(flags),
    }
