/**
 * VideoScrubber — HTML5 video player with custom scrubber and frame capture buttons.
 */
import { useRef, useState, useCallback, useEffect } from "react";
import { api } from "../api/client";
import type { CapturedFrame, FrameRole, Sport, VideoMeta, FrameRoleConfig } from "../types";
import { FRAME_ROLES } from "../types";

interface Props {
  sport: Sport;
  video: VideoMeta;
  capturedFrames: Record<string, CapturedFrame>;
  onFrameCaptured: (frame: CapturedFrame) => void;
}

export default function VideoScrubber({
  sport,
  video,
  capturedFrames,
  onFrameCaptured,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.duration_seconds);
  const [capturing, setCapturing] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const roles = FRAME_ROLES[sport];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => setDuration(v.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onDur);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onDur);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, []);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = parseFloat(e.target.value);
      setCurrentTime(t);
      if (videoRef.current) videoRef.current.currentTime = t;
    },
    []
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }, []);

  const captureFrame = useCallback(
    async (role: FrameRole) => {
      const v = videoRef.current;
      if (!v) return;
      v.pause();
      setCapturing(role);
      try {
        const res = await api.extractFrame(video.video_id, v.currentTime);
        onFrameCaptured({
          role,
          timestampSeconds: v.currentTime,
          frameBase64: res.frame_base64,
          annotatedBase64: res.annotated_base64,
          landmarks: res.landmarks,
        });
      } catch (err) {
        console.error("Frame capture error:", err);
      } finally {
        setCapturing(null);
      }
    },
    [video.video_id, onFrameCaptured]
  );

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 100);
    return `${m}:${sec.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Capture Key Frames
        </h2>
        <p className="text-gray-400 text-sm">
          Scrub to each position and click the corresponding capture button below.
        </p>
      </div>

      {/* Video player */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="relative bg-black">
          <video
            ref={videoRef}
            src={`http://localhost:8000/api/video/stream/${video.filename}`}
            className="w-full max-h-[450px] object-contain"
            preload="auto"
            playsInline
          >
            {/* Fallback: load via object URL if stream endpoint isn't available */}
          </video>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-3">
          {/* Scrubber */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="btn-secondary !py-2 !px-3"
              id="play-pause-btn"
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            <input
              type="range"
              min={0}
              max={duration || 1}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-brand-500 h-2 rounded-full cursor-pointer"
              id="video-scrubber"
            />

            <span className="text-xs font-mono text-gray-400 w-24 text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Frame capture buttons */}
          <div className="flex flex-wrap gap-3">
            {roles.map(({ role, label }: FrameRoleConfig) => {
              const captured = role in capturedFrames;
              const isCapturing = capturing === role;
              return (
                <button
                  key={role}
                  id={`capture-${role}`}
                  onClick={() => captureFrame(role)}
                  disabled={isCapturing}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${
                      captured
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                        : "bg-brand-500/10 border border-brand-500/30 text-brand-300 hover:bg-brand-500/20"
                    }
                    ${isCapturing ? "opacity-60 cursor-wait" : "cursor-pointer"}
                  `}
                >
                  {isCapturing ? (
                    <div className="w-4 h-4 border-2 border-brand-400/30 border-t-brand-400 rounded-full animate-spin" />
                  ) : captured ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {label}
                  {captured && (
                    <span className="text-xs text-emerald-500/60 ml-1">
                      ({formatTime(capturedFrames[role].timestampSeconds)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Captured frame thumbnails */}
      {Object.keys(capturedFrames).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {roles.map(({ role, label }: FrameRoleConfig) => {
            const frame = capturedFrames[role];
            if (!frame) return null;
            return (
              <div key={role} className="glass-card overflow-hidden">
                <img
                  src={`data:image/jpeg;base64,${frame.annotatedBase64 || frame.frameBase64}`}
                  alt={label}
                  className="w-full aspect-video object-contain bg-black"
                />
                <div className="p-3">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-gray-500">
                    {frame.landmarks ? "✓ Pose detected" : "✗ No pose detected"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
