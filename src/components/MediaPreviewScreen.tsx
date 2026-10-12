import React, { useState } from 'react';
import { BRollClipItem, QueuedShortItem, VideoScriptRecipeJSON } from '../types/schemas';

interface MediaPreviewScreenProps {
  activeShort: QueuedShortItem;
  onPreviewShort: (item: QueuedShortItem) => void;
  onSelectAlternateClip?: (clipIndex: number, alternate: BRollClipItem) => void;
}

export const MediaPreviewScreen: React.FC<MediaPreviewScreenProps> = ({
  activeShort,
  onPreviewShort,
}) => {
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const recipe = activeShort.recipe;

  return (
    <div className="flex flex-col gap-5 pb-12">
      {/* Header Badge & Title matching MediaPreviewScreen.kt */}
      <div>
        <span className="text-xs font-semibold text-[#ffb59e] uppercase tracking-wider">
          PIPELINE MEDIA INSPECTOR
        </span>
        <h1 className="text-2xl font-bold text-[#e7e0e9] mt-0.5 tracking-tight">
          Script Recipe & B-Roll Preview
        </h1>
      </div>

      {/* 1. Parsed VideoScriptRecipeJSON Card */}
      <div className="rounded-[24px] bg-[#1d1b21] p-5 border border-white/[0.04] shadow-md flex flex-col gap-3.5">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#cdbdff] text-[20px]">
            code
          </span>
          <span className="text-base font-bold text-[#e7e0e9]">
            {recipe.targetTopic}
          </span>
        </div>

        {/* Script Text Card */}
        <div className="rounded-[16px] bg-[#211f25] p-4 text-sm text-[#e7e0e9] leading-relaxed border border-white/[0.03]">
          {recipe.voiceScript}
        </div>

        {/* 5 Targeted Pexels B-Roll Keywords */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="text-xs font-medium text-[#cac3d8]">
            5 Targeted Pexels B-Roll Keywords:
          </span>
          <div className="flex flex-wrap gap-2">
            {recipe.bRollKeywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full bg-[#2b292f] text-xs font-mono-code text-[#cdbdff] border border-white/[0.04]"
              >
                #{idx + 1} {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Downloaded Pexels Stock Video Thumbnails (9:16 Vertical Preview) */}
      <div className="rounded-[24px] bg-[#1d1b21] p-5 border border-white/[0.04] shadow-md flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ffb59e] text-[20px]">
              movie_filter
            </span>
            <span className="text-base font-semibold text-[#e7e0e9]">
              Downloaded 9:16 Stock Video Clips ({activeShort.clips.length}/3)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onPreviewShort(activeShort)}
            className="px-3 py-1 rounded-full text-xs font-semibold bg-[#7c4dff]/20 text-[#cdbdff] hover:bg-[#7c4dff]/30 transition-all flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">play_arrow</span>
            <span>Watch Render</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {activeShort.clips.map((clip: BRollClipItem, index: number) => (
            <div
              key={clip.id}
              className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-[#141218] border border-white/[0.06] group"
            >
              {clip.videoUrl ? (
                <video
                  src={clip.videoUrl}
                  poster={clip.thumbnailUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <img
                  src={clip.thumbnailUrl}
                  alt={clip.keyword}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-2.5 flex flex-col justify-between">
                <span className="text-[10px] font-mono-code font-semibold px-2 py-0.5 rounded-full bg-black/60 text-[#ffb954] w-fit">
                  Clip #{index + 1}
                </span>
                <div>
                  <span className="text-[11px] font-semibold text-white line-clamp-1">
                    {clip.keyword}
                  </span>
                  <span className="text-[9px] font-mono-code text-[#cac3d8] block">
                    cacheDir/broll_clips/clip_{index + 1}.mp4
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CaptionWordJSON Timeline Preview */}
      <div className="rounded-[24px] bg-[#1d1b21] p-5 border border-white/[0.04] shadow-md flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#ffb954] text-[20px]">
              subtitles
            </span>
            <span className="text-base font-semibold text-[#e7e0e9]">
              CaptionWordJSON Burn Timeline ({recipe.captionsTimeline.length} words)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowFullTimeline(!showFullTimeline)}
            className="text-xs text-[#cdbdff] hover:underline cursor-pointer"
          >
            {showFullTimeline ? 'Show Less' : 'Show All'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(showFullTimeline
            ? recipe.captionsTimeline
            : recipe.captionsTimeline.slice(0, 12)
          ).map((caption, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#211f25] border border-white/[0.03]"
            >
              <span className="font-mono-code font-bold text-xs text-[#e7e0e9] uppercase">
                {caption.word}
              </span>
              <span className="font-mono-code text-[11px] text-[#cdbdff]">
                {caption.startTimeMs}ms → {caption.endTimeMs}ms
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
