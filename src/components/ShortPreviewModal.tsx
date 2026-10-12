import React, { useEffect, useState } from 'react';
import { QueuedShortItem } from '../types/schemas';

interface ShortPreviewModalProps {
  shortItem: QueuedShortItem | null;
  onClose: () => void;
}

export const ShortPreviewModal: React.FC<ShortPreviewModalProps> = ({ shortItem, onClose }) => {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const totalDurationMs =
    shortItem && shortItem.recipe.captionsTimeline.length > 0
      ? Math.max(
          shortItem.recipe.captionsTimeline[shortItem.recipe.captionsTimeline.length - 1].endTimeMs,
          12000
        )
      : 48000;

  useEffect(() => {
    if (!shortItem) return;
    setElapsedMs(0);
    setIsPlaying(true);
  }, [shortItem]);

  useEffect(() => {
    if (!shortItem || !isPlaying) return;
    const interval = setInterval(() => {
      setElapsedMs((prev) => {
        if (prev + 100 >= totalDurationMs) {
          return 0;
        }
        return prev + 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [shortItem, isPlaying, totalDurationMs]);

  useEffect(() => {
    if (!shortItem) return;
    if (isPlaying && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(shortItem.recipe.voiceScript);
      utterance.rate = 1.05;
      utterance.pitch = 0.92;
      window.speechSynthesis.speak(utterance);
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [shortItem, isPlaying]);

  if (!shortItem) return null;

  // Determine active clip index (0, 1, or 2) based on elapsed progress
  const progressRatio = elapsedMs / totalDurationMs;
  const clipIndex = progressRatio < 0.33 ? 0 : progressRatio < 0.66 ? 1 : 2;
  const activeClip = shortItem.clips[clipIndex] || shortItem.clips[0];

  // Determine current burned word from CaptionWordJSON timeline
  const currentCaptionWord =
    shortItem.recipe.captionsTimeline.find(
      (c) => elapsedMs >= c.startTimeMs && elapsedMs <= c.endTimeMs + 80
    ) ||
    shortItem.recipe.captionsTimeline[
      Math.min(
        Math.floor(progressRatio * shortItem.recipe.captionsTimeline.length),
        shortItem.recipe.captionsTimeline.length - 1
      )
    ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[380px] rounded-3xl bg-[#1d1b21] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#141218]/90 border-b border-white/5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-md bg-[#7c4dff]/20 text-[#cdbdff] text-[11px] font-semibold font-mono-code">
              9:16 RENDER PREVIEW
            </span>
            <span className="text-xs text-[#cac3d8] truncate">{shortItem.title}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2b292f] text-[#cac3d8] hover:text-white flex items-center justify-center"
            aria-label="Close preview"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* 9:16 Vertical Video Frame */}
        <div className="relative aspect-[9/16] w-full bg-[#0f0d13] overflow-hidden select-none">
          {activeClip?.videoUrl ? (
            <video
              key={activeClip.videoUrl}
              src={activeClip.videoUrl}
              poster={activeClip.thumbnailUrl}
              autoPlay
              loop
              muted
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
              }}
              className="w-full h-full object-cover scale-105 transition-all duration-700"
            />
          ) : (
            <img
              src={activeClip?.thumbnailUrl || shortItem.thumbnailUrl}
              alt={activeClip?.title || shortItem.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover scale-105 transition-all duration-700"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d13]/90 via-black/30 to-[#0f0d13]/60" />

          {/* Top Overlay Telemetry */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono-code text-white border border-white/10">
              CLIP #{clipIndex + 1}/3 • {activeClip?.title}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#7c4dff]/80 text-white text-[10px] font-semibold uppercase tracking-wider">
              FFmpeg drawtext
            </span>
          </div>

          {/* Center-Screen Burned Word-by-Word Subtitle (CaptionWordJSON) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center pointer-events-none">
            <div className="px-5 py-2.5 rounded-2xl bg-black/55 backdrop-blur-sm border border-[#cdbdff]/30 shadow-[0_8px_32px_rgba(124,77,255,0.45)] transform transition-transform duration-100">
              <span className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
                {currentCaptionWord?.word || 'READY'}
              </span>
            </div>
            <span className="mt-2 text-[11px] font-mono-code text-[#cdbdff]/90 bg-black/50 px-2.5 py-0.5 rounded-full">
              {currentCaptionWord
                ? `${currentCaptionWord.startTimeMs}ms → ${currentCaptionWord.endTimeMs}ms`
                : '0ms'}
            </span>
          </div>

          {/* Bottom YouTube Shorts Overlay Simulation */}
          <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#7c4dff] flex items-center justify-center text-xs font-bold text-white">
                FS
              </div>
              <span className="text-xs font-semibold text-white">@MindsetDailyShorts</span>
              <span className="px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-bold">
                Subscribe
              </span>
            </div>
            <p className="text-xs text-white/90 font-medium line-clamp-2">
              {shortItem.recipe.targetTopic} #Shorts #Stoicism #Focus
            </p>

            {/* Playback Controls & Scrub Bar */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-full bg-[#cdbdff] text-[#370096] flex items-center justify-center shadow-md active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[20px] icon-filled">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <div className="flex-1 flex flex-col gap-1">
                <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#7c4dff] via-[#cdbdff] to-[#ffb59e] transition-all duration-100"
                    style={{ width: `${Math.min(100, progressRatio * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono-code text-[#cac3d8]">
                  <span>{(elapsedMs / 1000).toFixed(1)}s</span>
                  <span>{(totalDurationMs / 1000).toFixed(1)}s • 1080x1920</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
