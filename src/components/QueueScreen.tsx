import React, { useEffect, useRef, useState } from 'react';
import {
  ALTERNATE_BROLL_POOL,
  AppSettingsJSON,
  BRollClipItem,
  QueuedShortItem,
  buildCaptionsFromText,
} from '../types/schemas';

interface QueueScreenProps {
  settings: AppSettingsJSON;
  queueItems: QueuedShortItem[];
  selectedShortId: string;
  onSelectShort: (id: string) => void;
  onUpdateShortItem: (updated: QueuedShortItem) => void;
  onPreviewShort: (item: QueuedShortItem) => void;
  onApproveAndRenderShort: (item: QueuedShortItem) => void;
  onGenerateNewAiShort: () => Promise<void>;
  isGeneratingAi: boolean;
}

export const QueueScreen: React.FC<QueueScreenProps> = ({
  settings,
  queueItems,
  selectedShortId,
  onSelectShort,
  onUpdateShortItem,
  onPreviewShort,
  onApproveAndRenderShort,
  onGenerateNewAiShort,
  isGeneratingAi,
}) => {
  const [filter, setFilter] = useState<'all' | 'review' | 'scheduled'>('all');
  const [isRegeneratingHook, setIsRegeneratingHook] = useState(false);
  const [isPlayingTts, setIsPlayingTts] = useState(false);
  const [ttsProgressSec, setTtsProgressSec] = useState(14);
  const [showRawRecipeJson, setShowRawRecipeJson] = useState(false);
  const [swapPoolIndex, setSwapPoolIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeShort =
    queueItems.find((item) => item.id === selectedShortId) || queueItems[0];

  const filteredItems = queueItems.filter((item) => {
    if (filter === 'review') return item.status === 'Ready for Review';
    if (filter === 'scheduled')
      return item.status === 'Scheduled' || item.status === 'Ready to Upload';
    return true;
  });

  useEffect(() => {
    if (!isPlayingTts) return;
    const timer = setInterval(() => {
      setTtsProgressSec((prev) => (prev >= 48 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlayingTts]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleScriptChange = (newText: string) => {
    if (!activeShort) return;
    const updatedCaptions = buildCaptionsFromText(newText);
    onUpdateShortItem({
      ...activeShort,
      recipe: {
        ...activeShort.recipe,
        voiceScript: newText,
        captionsTimeline: updatedCaptions,
      },
    });
  };

  const handleRegenerateHookWithGemini = async () => {
    if (!activeShort || isRegeneratingHook) return;
    setIsRegeneratingHook(true);
    try {
      const res = await fetch('/api/pipeline/regenerate-hook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentScript: activeShort.recipe.voiceScript,
          niche: settings.niche,
          toneOfVoice: settings.toneOfVoice,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.voiceScript) {
          onUpdateShortItem({
            ...activeShort,
            recipe: {
              ...activeShort.recipe,
              voiceScript: data.voiceScript,
              captionsTimeline:
                data.captionsTimeline || buildCaptionsFromText(data.voiceScript),
            },
          });
        }
      }
    } catch (e) {
      console.error('Hook regeneration failed:', e);
    } finally {
      setIsRegeneratingHook(false);
    }
  };

  const handleSwapClip = async (clipIndex: number) => {
    if (!activeShort) return;
    const currentClips = [...activeShort.clips];
    const targetClip = currentClips[clipIndex];
    if (!targetClip) return;

    // If user entered a custom Pexels API key, try live portrait video search first
    if (settings.pexelsApiKey && settings.pexelsApiKey.trim().length > 8) {
      try {
        const kw =
          activeShort.recipe.bRollKeywords[clipIndex] ||
          targetClip.keyword ||
          'cinematic dark portrait';
        const resp = await fetch(
          `https://api.pexels.com/videos/search?query=${encodeURIComponent(
            kw
          )}&orientation=portrait&per_page=5`,
          {
            headers: { Authorization: settings.pexelsApiKey.trim() },
          }
        );
        if (resp.ok) {
          const data = await resp.json();
          const videos = data.videos || [];
          if (videos.length > 0) {
            const pick = videos[(swapPoolIndex + clipIndex) % videos.length];
            const updatedClip: BRollClipItem = {
              ...targetClip,
              title: kw
                .split(' ')
                .slice(0, 2)
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' '),
              keyword: kw,
              thumbnailUrl: pick.image || targetClip.thumbnailUrl,
            };
            currentClips[clipIndex] = updatedClip;
            setSwapPoolIndex((p) => p + 1);
            onUpdateShortItem({
              ...activeShort,
              clips: currentClips,
              thumbnailUrl: clipIndex === 0 ? updatedClip.thumbnailUrl : activeShort.thumbnailUrl,
            });
            return;
          }
        }
      } catch {
        // Fallback to curated portrait stock pool
      }
    }

    const nextCandidate =
      ALTERNATE_BROLL_POOL[(swapPoolIndex + clipIndex) % ALTERNATE_BROLL_POOL.length];
    const updatedClip: BRollClipItem = {
      ...targetClip,
      title: nextCandidate.title,
      keyword: nextCandidate.keyword,
      thumbnailUrl: nextCandidate.thumbnailUrl,
    };
    currentClips[clipIndex] = updatedClip;
    setSwapPoolIndex((p) => p + 1);
    onUpdateShortItem({
      ...activeShort,
      clips: currentClips,
      thumbnailUrl: clipIndex === 0 ? updatedClip.thumbnailUrl : activeShort.thumbnailUrl,
    });
  };

  const handleTogglePlayTts = async () => {
    if (!activeShort) return;
    if (isPlayingTts) {
      setIsPlayingTts(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    setIsPlayingTts(true);

    // If we already have synthesized WAV base64 cached on the item, play it
    if (activeShort.audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${activeShort.audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setIsPlayingTts(false);
      audio.play().catch(() => setIsPlayingTts(false));
      return;
    }

    // Try Gemini TTS endpoint first, with instant browser SpeechSynthesis fallback
    try {
      const res = await fetch('/api/pipeline/synthesize-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeShort.recipe.voiceScript,
          voiceName: 'Charon',
          style: settings.toneOfVoice,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          onUpdateShortItem({ ...activeShort, audioBase64: data.audioBase64 });
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          audio.onended = () => setIsPlayingTts(false);
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback to native SpeechSynthesis below
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeShort.recipe.voiceScript);
      utterance.rate = 1.05;
      utterance.pitch = 0.92;
      utterance.onend = () => setIsPlayingTts(false);
      utterance.onerror = () => setIsPlayingTts(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingTts(false), 6000);
    }
  };

  const wordCount = activeShort
    ? activeShort.recipe.voiceScript.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const estSeconds = Math.max(15, Math.round(wordCount * 0.36));

  return (
    <div className="flex flex-col w-full pb-4">
      {/* Interactive Header Banner / Pipeline Pulse */}
      <div className="flex items-center justify-between py-2 mb-3">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[#ffb59e]">
            Automation Feed • Media Preview
          </span>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#e7e0e9]">
            Content Queue
          </h1>
        </div>
        <div className="flex items-center gap-2 bg-[#2b292f] px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#cdbdff]" />
          <span className="text-xs font-medium text-[#e7e0e9]">
            Pexels &amp; Local TTS Sync
          </span>
        </div>
      </div>

      {/* Filter & Segment Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 mb-4">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium shadow-sm transition-all whitespace-nowrap cursor-pointer ${
            filter === 'all'
              ? 'bg-[#cdbdff] text-[#370096] font-semibold'
              : 'bg-[#211f25] text-[#cac3d8] hover:bg-[#36343a]'
          }`}
        >
          <span>All</span>
          <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-bold tabular-nums">
            {queueItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('review')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium shadow-sm transition-all whitespace-nowrap cursor-pointer ${
            filter === 'review'
              ? 'bg-[#cdbdff] text-[#370096] font-semibold'
              : 'bg-[#211f25] text-[#cac3d8] hover:bg-[#36343a]'
          }`}
        >
          <span>Ready for Review</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#9d6700]/40 text-[#ffb954] text-[10px] font-bold tabular-nums">
            {queueItems.filter((i) => i.status === 'Ready for Review').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('scheduled')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium shadow-sm transition-all whitespace-nowrap cursor-pointer ${
            filter === 'scheduled'
              ? 'bg-[#cdbdff] text-[#370096] font-semibold'
              : 'bg-[#211f25] text-[#cac3d8] hover:bg-[#36343a]'
          }`}
        >
          <span>Scheduled</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#2b292f] text-[#cac3d8] text-[10px] font-bold tabular-nums">
            {
              queueItems.filter(
                (i) => i.status === 'Scheduled' || i.status === 'Ready to Upload'
              ).length
            }
          </span>
        </button>
      </div>

      {/* Horizontal Micro Date Stepper */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar mb-5 py-0.5">
        {queueItems.map((item) => {
          const isSelected = activeShort?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectShort(item.id)}
              className={`flex flex-col items-center justify-center min-w-[72px] py-2.5 px-2 rounded-2xl transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[#7c4dff] text-white shadow-md'
                  : 'bg-[#1d1b21] text-[#cac3d8] hover:bg-[#211f25]'
              }`}
            >
              <span
                className={`text-[11px] font-medium uppercase tracking-wider ${
                  isSelected ? 'text-[#e8deff]' : 'text-[#948ea1]'
                }`}
              >
                {item.dayName}
              </span>
              <span className="text-xl font-bold tabular-nums">{item.dayNumber}</span>
              <span
                className={`text-[10px] mt-0.5 font-medium ${
                  isSelected
                    ? 'text-[#e8deff]'
                    : item.status === 'Ready for Review'
                    ? 'text-[#ffb954]'
                    : 'text-[#948ea1]'
                }`}
              >
                {isSelected ? 'Active' : item.status === 'Ready for Review' ? 'Draft' : 'Queued'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pipeline Timeline Mini Cards */}
      <div className="flex flex-col gap-2.5 mb-6">
        <div className="flex items-center justify-between px-1">
          <span className="text-base text-[#e7e0e9] font-semibold">Scheduled Pipeline</span>
          <span className="text-xs text-[#cdbdff] font-medium tabular-nums">
            {filteredItems.length} in Queue
          </span>
        </div>

        {filteredItems.map((item) => {
          const isSelected = activeShort?.id === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectShort(item.id)}
              className={`flex items-center justify-between p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#2b292f] shadow-md ring-1 ring-[#cdbdff]/30'
                  : 'bg-[#1d1b21] hover:bg-[#211f25]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? 'bg-[#7c4dff]/30 text-[#cdbdff]'
                      : 'bg-[#9d6700]/25 text-[#ffb954]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      isSelected ? 'icon-filled' : ''
                    }`}
                  >
                    {isSelected ? 'auto_fix_high' : 'description'}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-medium ${
                        isSelected ? 'text-[#ffb59e]' : 'text-[#948ea1]'
                      }`}
                    >
                      {item.dateLabel}
                    </span>
                  </div>
                  <span className="text-sm sm:text-base text-[#e7e0e9] font-semibold truncate">
                    {item.title}
                  </span>
                  <span className="text-xs text-[#cac3d8] mt-0.5">
                    {item.recipe.bRollKeywords.length} B-Roll Keywords •{' '}
                    {item.recipe.captionsTimeline.length} Timed Words
                  </span>
                </div>
              </div>
              <div className="flex items-center pl-2 shrink-0">
                {isSelected ? (
                  <span className="px-2.5 py-1 rounded-full bg-[#cdbdff]/15 text-[#cdbdff] text-[10px] uppercase tracking-wider font-semibold">
                    Inspecting
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[#948ea1]">
                    chevron_right
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE INSPECTION DRAWER & VIDEO CANVAS */}
      {activeShort && (
        <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-3xl bg-[#1d1b21] shadow-xl border border-white/[0.04]">
          {/* Canvas Top Bar */}
          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#7f2a0d] text-[#ff9b7c] text-[11px] font-semibold tracking-wide">
                Shorts Canvas
              </span>
              <span className="text-xs text-[#948ea1]">9:16 Auto-Framed</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowRawRecipeJson(!showRawRecipeJson)}
                className="flex items-center gap-1 text-xs font-medium text-[#ffb954] hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">code</span>
                <span>{showRawRecipeJson ? 'Hide Recipe JSON' : 'VideoScriptRecipeJSON'}</span>
              </button>
              <button
                type="button"
                onClick={() => onPreviewShort(activeShort)}
                className="flex items-center gap-1 text-xs font-semibold text-[#cdbdff] hover:text-[#e8deff] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                <span>Live 9:16 Preview</span>
              </button>
            </div>
          </div>

          {/* Parsed VideoScriptRecipeJSON Inspector Drawer */}
          {showRawRecipeJson && (
            <div className="rounded-2xl bg-[#0f0d13] p-3.5 border border-[#cdbdff]/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono-code font-semibold text-[#cdbdff]">
                  Parsed VideoScriptRecipeJSON (Step 1 Output)
                </span>
                <span className="text-[11px] font-mono-code text-[#ffb59e]">
                  {activeShort.recipe.bRollKeywords.length} B-Roll Keywords •{' '}
                  {activeShort.recipe.captionsTimeline.length} CaptionWordJSON items
                </span>
              </div>
              <pre className="text-[11px] font-mono-code text-[#cac3d8] max-h-56 overflow-y-auto leading-relaxed">
                {JSON.stringify(
                  {
                    targetTopic: activeShort.recipe.targetTopic,
                    voiceScript: activeShort.recipe.voiceScript,
                    bRollKeywords: activeShort.recipe.bRollKeywords,
                    captionsTimeline: activeShort.recipe.captionsTimeline.slice(0, 8),
                    _note: `... +${Math.max(
                      0,
                      activeShort.recipe.captionsTimeline.length - 8
                    )} more CaptionWordJSON timed entries`,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          {/* Section A: AI-Generated Script Editor */}
          <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#211f25] shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#cdbdff] text-[20px]">
                  smart_toy
                </span>
                <span className="text-sm sm:text-base text-[#e7e0e9] font-semibold">
                  Gemini Script Synthesis
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#36343a] text-[11px] text-[#cac3d8] font-medium tabular-nums">
                {wordCount} words (~{estSeconds} sec)
              </span>
            </div>

            <textarea
              rows={4}
              value={activeShort.recipe.voiceScript}
              onChange={(e) => handleScriptChange(e.target.value)}
              placeholder="AI script content..."
              className="w-full p-3 rounded-xl bg-[#2b292f] text-[#e7e0e9] text-sm leading-relaxed focus:outline-none focus:bg-[#36343a] transition-all resize-none shadow-sm"
            />

            {/* 5 Targeted B-Roll Search Keywords Row */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[#948ea1] font-mono-code mr-1">
                bRollKeywords[5]:
              </span>
              {activeShort.recipe.bRollKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className="text-[11px] text-[#cdbdff] bg-[#2b292f] px-2 py-0.5 rounded-md font-mono-code"
                >
                  #{idx + 1} {kw}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-[#948ea1]">
                <span className="material-symbols-outlined text-[16px] text-[#ffb954]">
                  bolt
                </span>
                <span className="text-xs">High Viral Retention Hook</span>
              </div>
              <button
                type="button"
                onClick={handleRegenerateHookWithGemini}
                disabled={isRegeneratingHook}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#36343a] text-[#cdbdff] hover:bg-[#7c4dff]/25 transition-all text-xs font-medium cursor-pointer disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    isRegeneratingHook ? 'animate-spin' : ''
                  }`}
                >
                  autorenew
                </span>
                <span>
                  {isRegeneratingHook ? 'Synthesizing Hook...' : 'Regenerate Hook with AI'}
                </span>
              </button>
            </div>
          </div>

          {/* Section B: Stock Video Carousel (Pexels Media) */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#ffb59e] text-[20px]">
                  movie_filter
                </span>
                <span className="text-sm sm:text-base text-[#e7e0e9] font-semibold">
                  Visual Sequencing (Top 3 Portrait MP4s)
                </span>
              </div>
              <span className="text-xs text-[#ffb59e] font-medium">Pexels Free Library</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {activeShort.clips.map((clip, idx) => (
                <div
                  key={clip.id}
                  className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-[#36343a] shadow-md group"
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d13]/95 via-transparent to-[#0f0d13]/40 flex flex-col justify-between p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.5 rounded-md bg-[#0f0d13]/80 text-[10px] font-mono-code text-[#e7e0e9] font-bold">
                        #0{idx + 1}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          idx === 0
                            ? 'bg-[#cdbdff]'
                            : idx === 1
                            ? 'bg-[#ffb954]'
                            : 'bg-[#ffb59e]'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-[#e7e0e9] font-semibold block leading-tight truncate">
                        {clip.title}
                      </span>
                      <span className="text-[10px] text-[#cdbdff] block font-mono-code">
                        {clip.timeRange}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSwapClip(idx)}
                        className="mt-1.5 w-full py-1.5 rounded-lg bg-[#2b292f]/90 hover:bg-[#cdbdff] hover:text-[#370096] transition-colors text-[10px] font-semibold text-[#e7e0e9] flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          swap_horiz
                        </span>
                        <span>Swap</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section C: Text-to-Speech Audio Waveform Bar */}
          <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#211f25] shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#cdbdff] text-[20px]">
                  mic
                </span>
                <span className="text-sm sm:text-base text-[#e7e0e9] font-semibold">
                  Local Voiceover TTS (voice.wav)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#7c4dff]/30 text-[#cdbdff] text-[11px] font-semibold tabular-nums">
                  1.05x
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#36343a] text-[#cac3d8] text-[11px]">
                  Android TTS / Gemini WAV
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#2b292f] p-3 rounded-xl">
              <button
                type="button"
                onClick={handleTogglePlayTts}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all flex-shrink-0 cursor-pointer ${
                  isPlayingTts
                    ? 'bg-[#ffb954] text-[#452b00]'
                    : 'bg-[#cdbdff] text-[#370096]'
                }`}
              >
                <span className="material-symbols-outlined text-[24px] icon-filled">
                  {isPlayingTts ? 'pause' : 'play_arrow'}
                </span>
              </button>

              <div className="flex-1 flex flex-col gap-1.5">
                <div className="h-8 flex items-center gap-1">
                  {[
                    3, 5, 7, 4, 6, 8, 5, 3, 6, 7, 8, 5, 3, 6, 7, 4, 2, 5, 7, 3, 6, 4,
                  ].map((h, i) => {
                    const activeBar = i <= Math.floor((ttsProgressSec / 48) * 22);
                    return (
                      <span
                        key={i}
                        style={{ height: `${h * 3.5}px` }}
                        className={`w-1 rounded-full transition-colors ${
                          activeBar ? 'bg-[#cdbdff]' : 'bg-[#494455]'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[#cac3d8] text-[11px] font-mono-code">
                  <span>0:{ttsProgressSec.toString().padStart(2, '0')}</span>
                  <span className="text-[#948ea1]">24kHz WAV • {settings.toneOfVoice}</span>
                  <span>0:{estSeconds.toString().padStart(2, '0')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Sticky / Floating Dock Bar */}
      <div className="mt-5 p-2.5 rounded-3xl bg-[#2b292f]/95 backdrop-blur-xl shadow-2xl flex items-center gap-2.5 border border-white/[0.06]">
        <button
          type="button"
          onClick={onGenerateNewAiShort}
          disabled={isGeneratingAi}
          className="flex-1 h-12 rounded-full bg-[#36343a] hover:bg-[#3b383f] text-[#e7e0e9] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
        >
          <span
            className={`material-symbols-outlined text-[20px] text-[#cdbdff] ${
              isGeneratingAi ? 'animate-spin' : ''
            }`}
          >
            {isGeneratingAi ? 'refresh' : 'auto_awesome'}
          </span>
          <span>{isGeneratingAi ? 'Generating via Gemini...' : 'Generate New AI Draft'}</span>
        </button>

        {activeShort && (
          <button
            type="button"
            onClick={() => onApproveAndRenderShort(activeShort)}
            className="flex-[1.4] h-12 rounded-full bg-[#7c4dff] hover:bg-[#7c4dff]/90 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] icon-filled">
              check_circle
            </span>
            <span className="truncate">Approve &amp; Render Short</span>
          </button>
        )}
      </div>
    </div>
  );
};
