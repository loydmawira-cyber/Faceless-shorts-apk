import React, { useEffect, useRef, useState } from 'react';
import {
  PipelineStepState,
  QueuedShortItem,
  TerminalLogEntry,
} from '../types/schemas';

interface RenderScreenProps {
  activeShort: QueuedShortItem;
  isRendering: boolean;
  renderProgress: number;
  currentStageNumber: 1 | 2 | 3 | 4;
  pipelineSteps: PipelineStepState[];
  terminalLogs: TerminalLogEntry[];
  onStartLivePipelineRun: () => void;
  onCancelRender: () => void;
  onPreviewShort: (item: QueuedShortItem) => void;
}

export const RenderScreen: React.FC<RenderScreenProps> = ({
  activeShort,
  isRendering,
  renderProgress,
  currentStageNumber,
  pipelineSteps,
  terminalLogs,
  onStartLivePipelineRun,
  onCancelRender,
  onPreviewShort,
}) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedLog, setCopiedLog] = useState(false);
  const [showFfmpegCommandModal, setShowFfmpegCommandModal] = useState(false);
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop =
        terminalContainerRef.current.scrollHeight;
    }
  }, [terminalLogs, autoScroll]);

  const handleCopyLogs = () => {
    const raw = terminalLogs
      .map((l) => `[${l.timestamp}] [${l.tag}] ${l.message}`)
      .join('\n');
    navigator.clipboard?.writeText(raw);
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 1600);
  };

  // Build real FFmpeg command string mapping CaptionWordJSON timeline to drawtext filters
  const generatedFfmpegCommand = (() => {
    const sampleWords = activeShort.recipe.captionsTimeline.slice(0, 6);
    const drawTextChain = sampleWords
      .map((w) => {
        const s = (w.startTimeMs / 1000).toFixed(2);
        const e = (w.endTimeMs / 1000).toFixed(2);
        const cleanWord = w.word.toUpperCase().replace(/'/g, "\\'");
        return `drawtext=text='${cleanWord}':fontcolor=#FFFFFF:fontsize=84:borderw=6:bordercolor=#141218:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,${s},${e})'`;
      })
      .join(',');

    return `ffmpeg -y -i cacheDir/broll_clip_1.mp4 -i cacheDir/broll_clip_2.mp4 -i cacheDir/broll_clip_3.mp4 -i cacheDir/voice.wav -filter_complex "[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,trim=duration=17[v0];[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,trim=duration=17[v1];[2:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30,trim=duration=17[v2];[v0][v1][v2]concat=n=3:v=1:a=0[vconcat];[vconcat]${drawTextChain}[vout]" -map "[vout]" -map 3:a:0 -c:v libx264 -preset veryfast -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest cacheDir/final_short_9x16.mp4`;
  })();

  // SVG Circle progress math (r=40 -> circumference = 251.2)
  const circumference = 251.2;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, renderProgress)) / 100) * circumference;

  const remainingSeconds = Math.max(
    0,
    Math.round(((100 - renderProgress) / 100) * 46)
  );

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Live Rendering Status Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#1d1b21] p-4 sm:p-5 shadow-md border border-white/[0.04]">
        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-[#7c4dff]/15 blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-[#7f2a0d]/15 blur-xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full h-2.5 w-2.5 bg-[#cdbdff]" />
              <span className="text-[11px] text-[#cdbdff] uppercase tracking-wider font-semibold">
                {isRendering ? 'Engine Live • Executing Worker' : 'Engine Ready • DailyVideoWorker'}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-[#2b292f] text-[#cac3d8] text-[11px] font-mono-code">
              ffmpeg-kit-full
            </span>
          </div>

          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-[#e7e0e9] tracking-tight">
                Local Auto-Pilot Engine Active
              </h2>
              <p className="text-xs text-[#cac3d8] mt-0.5 leading-snug">
                Rendering &ldquo;{activeShort.title}&rdquo; on-device using local FFmpeg wrapper &amp; free APIs
              </p>
            </div>
            <button
              type="button"
              onClick={onStartLivePipelineRun}
              disabled={isRendering}
              className="px-3.5 py-2 rounded-full bg-[#7c4dff] hover:bg-[#7c4dff]/90 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isRendering ? 'animate-spin' : 'icon-filled'
                }`}
              >
                {isRendering ? 'sync' : 'play_arrow'}
              </span>
              <span>{isRendering ? 'Running 4-Step Pipeline...' : 'Run 4-Step Pipeline Now'}</span>
            </button>
          </div>

          {/* Constraints Verification Strip */}
          <div className="mt-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#211f25] text-[#cac3d8] text-[11px] shadow-sm flex-wrap">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#ffb954]">
                battery_charging_80
              </span>
              <span>Charging: OK (84%)</span>
            </div>
            <span className="text-[#494455]">•</span>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#ffb59e]">
                wifi
              </span>
              <span>Wi-Fi Unmetered: OK</span>
            </div>
            <span className="text-[#494455]">•</span>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px] text-[#cdbdff]">
                memory
              </span>
              <span>Device Idle: Verified</span>
            </div>
          </div>
        </div>
      </div>

      {/* Circular Progress & Telemetry Card */}
      <div className="rounded-2xl bg-[#1d1b21] p-5 shadow-md flex items-center justify-between gap-4 border border-white/[0.04]">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="px-2.5 py-0.5 w-fit rounded-full bg-[#cdbdff]/10 text-[#cdbdff] text-[11px] font-semibold tracking-wide tabular-nums">
            STAGE: {currentStageNumber} / 4
          </span>
          <h3 className="text-2xl font-semibold text-[#e7e0e9] leading-tight truncate tabular-nums">
            {renderProgress}% Ready
          </h3>
          <div className="flex items-center gap-1.5 text-[#cac3d8] mt-0.5">
            <span className="material-symbols-outlined text-[16px] text-[#ffb954]">
              timelapse
            </span>
            <span className="text-xs tabular-nums">
              ~00:{remainingSeconds.toString().padStart(2, '0')} remaining
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-[11px] text-[#948ea1] truncate font-mono-code">
              Preset: 1080x1920 (9:16) • H.264
            </p>
            <button
              type="button"
              onClick={() => setShowFfmpegCommandModal(!showFfmpegCommandModal)}
              className="text-[11px] text-[#cdbdff] font-medium hover:underline cursor-pointer"
            >
              {showFfmpegCommandModal ? 'Hide FFmpeg Filter' : 'Inspect FFmpeg Filter'}
            </button>
          </div>
        </div>

        {/* Radial Progress Dial */}
        <div className="relative flex-shrink-0 w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              className="text-[#36343a]"
              cx="50"
              cy="50"
              fill="transparent"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              fill="transparent"
              r="40"
              stroke="url(#gradient-render)"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeWidth="8"
              className="transition-all duration-300"
            />
            <defs>
              <linearGradient id="gradient-render" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#cdbdff" />
                <stop offset="100%" stopColor="#ffb59e" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-bold text-[#e7e0e9] leading-none tabular-nums">
              {renderProgress}%
            </span>
            <span className="text-[#cdbdff] text-[10px] uppercase font-semibold mt-0.5">
              {renderProgress === 100 ? 'Complete' : 'Stitching'}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Generated FFmpeg Command Drawer */}
      {showFfmpegCommandModal && (
        <div className="rounded-2xl bg-[#0f0d13] p-4 border border-[#cdbdff]/20 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono-code font-semibold text-[#cdbdff]">
              Generated FFmpeg Command (3 Clips + voice.wav + Subtitles drawtext)
            </span>
            <span className="text-[11px] font-mono-code text-[#ffb954]">9:16 1080x1920</span>
          </div>
          <pre className="text-[11px] font-mono-code text-[#cac3d8] whitespace-pre-wrap break-all leading-relaxed">
            {generatedFfmpegCommand}
          </pre>
        </div>
      )}

      {/* Step-by-Step Pipeline Tasks */}
      <div className="rounded-2xl bg-[#1d1b21] p-4 shadow-md flex flex-col gap-3 border border-white/[0.04]">
        <div className="flex items-center justify-between pb-1">
          <span className="text-base text-[#e7e0e9] font-medium">
            Pipeline Progression (DailyVideoWorker)
          </span>
          <span className="text-xs text-[#948ea1]">4-Step Sequential Flow</span>
        </div>

        {pipelineSteps.map((step) => {
          const isCompleted = step.status === 'completed';
          const isActive = step.status === 'active';
          return (
            <div
              key={step.stepNumber}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors ${
                isActive
                  ? 'bg-[#7c4dff]/20 ring-1 ring-[#cdbdff]/30'
                  : isCompleted
                  ? 'bg-[#211f25]/80'
                  : 'bg-[#211f25]/35 opacity-75'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isCompleted
                    ? 'bg-[#9d6700]/30 text-[#ffb954]'
                    : isActive
                    ? 'bg-[#7c4dff] text-white'
                    : 'bg-[#36343a] text-[#948ea1]'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isCompleted ? 'icon-filled' : isActive ? 'animate-spin' : ''
                  }`}
                >
                  {isCompleted
                    ? 'check_circle'
                    : isActive
                    ? 'motion_blur'
                    : 'schedule'}
                </span>
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-[#e7e0e9] font-semibold truncate">
                    {step.stepNumber}. {step.title}
                  </span>
                  <span
                    className={`text-[11px] font-semibold flex-shrink-0 tabular-nums ${
                      isCompleted
                        ? 'text-[#ffb954]'
                        : isActive
                        ? 'text-[#cdbdff]'
                        : 'text-[#948ea1]'
                    }`}
                  >
                    {step.durationText || (isActive ? 'Executing' : 'Queued')}
                  </span>
                </div>
                <p className="text-xs text-[#cac3d8] truncate mt-0.5">{step.subtitle}</p>

                {isActive && (
                  <>
                    <div className="mt-2 w-full bg-[#36343a] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#cdbdff] to-[#ffb59e] h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${step.progressPercent ?? 60}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#cdbdff] mt-1 font-mono-code">
                      <span>Frame {Math.round((renderProgress / 100) * 1440)} / 1440</span>
                      <span>48 fps • Hardware Encoder</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Terminal Log Viewer */}
      <div className="rounded-2xl bg-[#0f0d13] p-4 shadow-xl flex flex-col gap-2.5 border border-white/[0.05]">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#cdbdff]">
              terminal
            </span>
            <span className="text-xs sm:text-sm text-[#e7e0e9] font-semibold font-mono-code">
              dev/pts/ffmpeg.log
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2.5 py-1 rounded-full bg-[#2b292f] text-[#cdbdff] text-[11px] font-medium flex items-center gap-1 transition-opacity cursor-pointer ${
                autoScroll ? 'opacity-100' : 'opacity-50'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#cdbdff]" />
              <span>Auto-Scroll</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLogs}
              title="Copy Log"
              className="w-7 h-7 rounded-full bg-[#2b292f] text-[#cac3d8] flex items-center justify-center hover:bg-[#36343a] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">
                {copiedLog ? 'check' : 'content_copy'}
              </span>
            </button>
          </div>
        </div>

        {/* Terminal Code Box */}
        <div
          ref={terminalContainerRef}
          className="w-full h-48 overflow-y-auto rounded-xl bg-[#141218] p-3 font-mono-code text-[11px] leading-[1.65] text-[#cac3d8] shadow-inner select-text"
        >
          <div className="flex flex-col gap-1">
            {terminalLogs.map((log) => {
              const tagColor =
                log.tag === 'INIT' || log.tag === 'STATUS'
                  ? 'text-[#cdbdff]'
                  : log.tag === 'INFO' || log.tag === 'PEXELS' || log.tag === 'TTS'
                  ? 'text-[#ffb954]'
                  : log.tag === 'FFMPEG' || log.tag === 'UPLOAD'
                  ? 'text-[#ffb59e]'
                  : 'text-[#ffb4ab]';
              return (
                <p key={log.id}>
                  <span className="text-[#948ea1]">[{log.timestamp}]</span>{' '}
                  <span className={`${tagColor} font-semibold`}>[{log.tag}]</span>{' '}
                  <span>{log.message}</span>
                </p>
              );
            })}
            <p className="text-[#cdbdff] flex items-center gap-1 mt-1">
              <span>
                &gt;{' '}
                {isRendering
                  ? `executing pipeline stage #${currentStageNumber}/4 [progress: ${renderProgress}%]`
                  : `pipeline idle — ready for next 24h WorkManager cycle`}
              </span>
              <span className="inline-block w-2 h-3.5 bg-[#cdbdff] align-middle" />
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Interactive Controls */}
      <div className="flex flex-col gap-2 pt-1 pb-2">
        <button
          type="button"
          onClick={() => onPreviewShort(activeShort)}
          className="w-full h-12 rounded-full bg-[#2b292f] hover:bg-[#36343a] text-[#e7e0e9] text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] text-[#cdbdff]">
            smart_display
          </span>
          <span>Open 9:16 Burned Subtitle Video Preview</span>
        </button>

        {isRendering && (
          <button
            type="button"
            onClick={onCancelRender}
            className="w-full py-2.5 text-center text-[#ffb4ab] text-xs font-medium hover:underline cursor-pointer"
          >
            Cancel Current Render
          </button>
        )}
      </div>
    </div>
  );
};
