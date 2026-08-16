/**
 * VideoUploader (Nike Retail Stage Dropzone)
 * High-contrast video upload stage with Nike primary pill buttons and drag-drop feedback.
 */
import { useCallback, useState } from "react";
import { api } from "../api/client";
import type { VideoMeta } from "../types";

interface Props {
  onUploaded: (meta: VideoMeta) => void;
}

export default function VideoUploader({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        setError("Please upload a video file (.mp4, .mov, .webm).");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const meta = await api.uploadVideo(file);
        onUploaded(meta as VideoMeta);
      } catch (e: any) {
        setError(e.message || "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [onUploaded]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="animate-slide-up max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <span className="text-xs font-mono font-bold tracking-widest text-gray-400 uppercase">
          STAGE 02 / VIDEO INPUT
        </span>
        <h2 className="nike-display-title text-white tracking-tight text-4xl sm:text-5xl">
          UPLOAD MOVEMENT FILM
        </h2>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Record at 30+ FPS from a side-profile view for 33-point sub-pixel kinematic tracking.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`nike-card p-10 text-center transition-all duration-300 ${
          dragging ? "border-white bg-white/10 scale-[1.01]" : "border-white/15 bg-white/[0.03]"
        }`}
      >
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-full bg-white/10 mx-auto flex items-center justify-center text-2xl border border-white/15">
            📹
          </div>
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider">
              {dragging ? "DROP FILM TO UPLOAD" : "DRAG & DROP VIDEO FILM HERE"}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Supports MP4, MOV, WEBM up to 100MB</p>
          </div>

          <label className="inline-block cursor-pointer">
            <input
              type="file"
              accept="video/*"
              onChange={onFileSelect}
              className="hidden"
            />
            <span className="btn-nike-primary">
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  UPLOADING FILM…
                </>
              ) : (
                <>CHOOSE VIDEO FILE →</>
              )}
            </span>
          </label>

          {error && (
            <p className="text-xs text-red-400 font-semibold mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
