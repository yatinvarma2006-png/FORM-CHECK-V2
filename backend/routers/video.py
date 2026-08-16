"""Video upload and frame extraction endpoints."""

from __future__ import annotations

import base64
import uuid

import cv2
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from config import UPLOAD_DIR, MAX_VIDEO_SIZE_MB
from pose.landmarker import detect_pose, draw_skeleton

router = APIRouter(prefix="/api/video", tags=["video"])


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    """Accept a video file upload and return a video_id."""
    if not file.content_type or not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video.")

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > MAX_VIDEO_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"Video too large ({size_mb:.1f} MB). Max is {MAX_VIDEO_SIZE_MB} MB.",
        )

    video_id = str(uuid.uuid4())
    # Preserve the original extension for codec compatibility
    ext = file.filename.rsplit(".", 1)[-1] if file.filename and "." in file.filename else "mp4"
    filename = f"{video_id}.{ext}"
    filepath = UPLOAD_DIR / filename

    with open(filepath, "wb") as f:
        f.write(contents)

    # Get video metadata
    cap = cv2.VideoCapture(str(filepath))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = frame_count / fps if fps > 0 else 0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    cap.release()

    return {
        "video_id": video_id,
        "filename": filename,
        "duration_seconds": round(duration, 2),
        "fps": round(fps, 2),
        "width": width,
        "height": height,
    }


class ExtractFrameRequest(BaseModel):
    video_id: str
    timestamp_seconds: float


@router.post("/extract-frame")
async def extract_frame(req: ExtractFrameRequest):
    """Extract a single frame at the given timestamp and run pose detection."""
    # Find the video file (any extension)
    matching = list(UPLOAD_DIR.glob(f"{req.video_id}.*"))
    if not matching:
        raise HTTPException(status_code=404, detail="Video not found.")

    filepath = matching[0]
    cap = cv2.VideoCapture(str(filepath))

    # Seek to the requested timestamp
    cap.set(cv2.CAP_PROP_POS_MSEC, req.timestamp_seconds * 1000)
    ret, frame = cap.read()
    cap.release()

    if not ret or frame is None:
        raise HTTPException(
            status_code=400,
            detail=f"Could not extract frame at {req.timestamp_seconds}s.",
        )

    # Run pose detection
    landmarks = detect_pose(frame)

    # Encode frame as base64 JPEG
    _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 98])
    frame_b64 = base64.b64encode(buffer).decode("utf-8")

    # If landmarks found, also return an annotated frame
    annotated_b64 = None
    if landmarks:
        annotated = draw_skeleton(frame, landmarks)
        _, ann_buffer = cv2.imencode(
            ".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 98]
        )
        annotated_b64 = base64.b64encode(ann_buffer).decode("utf-8")

    return {
        "frame_base64": frame_b64,
        "annotated_base64": annotated_b64,
        "landmarks": landmarks,
        "timestamp_seconds": req.timestamp_seconds,
        "pose_detected": landmarks is not None,
    }


from fastapi.responses import FileResponse


@router.get("/stream/{filename}")
async def stream_video(filename: str):
    """Stream an uploaded video file."""
    filepath = UPLOAD_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Video file not found.")
    return FileResponse(path=filepath, media_type="video/mp4")

