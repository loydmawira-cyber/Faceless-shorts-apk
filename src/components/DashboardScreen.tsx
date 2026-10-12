import React, { useState } from 'react';
import { AppSettingsJSON, QueuedShortItem } from '../types/schemas';

interface DashboardScreenProps {
  settings: AppSettingsJSON;
  queueItems: QueuedShortItem[];
  onToggleAutoPilot: (enabled: boolean) => void;
  onNavigateTab: (tab: 'dashboard' | 'campaign' | 'queue' | 'render') => void;
  onPreviewShort: (item: QueuedShortItem) => void;
  onTriggerInstantPipeline: () => void;
  isRendering: boolean;
  renderProgress: number;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  settings,
  queueItems,
  onToggleAutoPilot,
  onNavigateTab,
  onPreviewShort,
  onTriggerInstantPipeline,
  isRendering,
  renderProgress,
}) => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');
  const [showAllHistory, setShowAllHistory] = useState(false);

  const heroShort = queueItems[0];

  const statsByTimeframe = {
    '24h': {
      views: '142.8K',
      viewsDelta: '+24.5%',
      subs: '+842',
      subsDelta: '+18.2%',
      watch: '48.2s',
      retention: '94.5% Ret.',
      yt: '82K',
      tt: '41K',
      reels: '19.8K',
    },
    '7d': {
      views: '984.2K',
      viewsDelta: '+38.1%',
      subs: '+5,410',
      subsDelta: '+29.4%',
      watch: '49.6s',
      retention: '95.8% Ret.',
      yt: '590K',
      tt: '264K',
      reels: '130.2K',
    },
    '30d': {
      views: '3.82M',
      viewsDelta: '+64.0%',
      subs: '+21.9K',
      subsDelta: '+42.7%',
      watch: '47.9s',
      retention: '93.2% Ret.',
      yt: '2.3M',
      tt: '980K',
      reels: '540K',
    },
  }[timeframe];

  const cycleTimeframe = () => {
    setTimeframe((prev) => (prev === '24h' ? '7d' : prev === '7d' ? '30d' : '24h'));
  };

  const displayedHistory = showAllHistory ? queueItems : queueItems.slice(0, 3);

  return (
    <div className="flex flex-col w-full gap-4">
      {/* Status Overview Card: Auto-Pilot Pipeline Active */}
      <div className="relative w-full rounded-[28px] bg-[#1d1b21] p-4 sm:p-5 shadow-xl overflow-hidden border border-white/[0.04]">
        {/* Ambient subtle tonal glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#7c4dff]/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-[#7f2a0d]/25 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Top Meta Row: Pulse state & Dynamic Switch */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#36343a] text-[#e7e0e9]">
                <span
                  className={`w-2 h-2 rounded-full ${
                    settings.autoPilotEnabled ? 'bg-[#10b981]' : 'bg-[#ffb954]'
                  }`}
                />
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#e7e0e9]">
                  {isRendering
                    ? 'Processing: Rendering Video'
                    : settings.autoPilotEnabled
                    ? 'Ready to Upload'
                    : 'Idle / Waiting for next cycle'}
                </span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#7f2a0d]/40 text-[#ff9b7c] text-[11px] font-medium tabular-nums">
                T-minus 2h 15m
              </span>
            </div>

            {/* Android M3 Auto-Pilot Switch Toggle */}
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={settings.autoPilotEnabled}
                onChange={(e) => onToggleAutoPilot(e.target.checked)}
                className="sr-only peer"
                aria-label="Toggle Auto-Pilot Automation"
              />
              <div className="w-12 h-7 bg-[#36343a] rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-[#cdbdff] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#7c4dff]" />
              <span
                className={`ml-2 text-xs font-medium hidden sm:inline ${
                  settings.autoPilotEnabled ? 'text-[#cdbdff]' : 'text-[#948ea1]'
                }`}
              >
                {settings.autoPilotEnabled ? 'Active: ON' : 'Paused: OFF'}
              </span>
            </label>
          </div>

          {/* Hero Video Teaser & Information */}
          {heroShort && (
            <div className="flex gap-4 items-center">
              {/* 9:16 Miniature Aspect Ratio Preview Thumbnail */}
              <button
                type="button"
                onClick={() => onPreviewShort(heroShort)}
                className="relative w-20 h-28 rounded-2xl bg-[#36343a] overflow-hidden flex-shrink-0 shadow-md group cursor-pointer text-left"
              >
                <img
                  src={heroShort.thumbnailUrl}
                  alt={heroShort.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d13]/85 via-transparent to-transparent flex items-end justify-center pb-2">
                  <div className="w-7 h-7 rounded-full bg-[#cdbdff]/95 text-[#370096] flex items-center justify-center shadow-lg transition-transform active:scale-90">
                    <span className="material-symbols-outlined text-[16px] icon-filled">
                      play_arrow
                    </span>
                  </div>
                </div>
                <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#0f0d13]/80 text-[9px] font-medium text-[#e7e0e9] tabular-nums">
                  9:16
                </span>
              </button>

              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[11px] font-medium uppercase tracking-wide text-[#cdbdff]">
                  Next Generation Dropping
                </span>
                <h2 className="text-lg font-medium text-[#e7e0e9] leading-tight mt-0.5 truncate">
                  {heroShort.title}
                </h2>
                <p className="text-xs text-[#cac3d8] mt-1 line-clamp-2">
                  Auto-composed with local TTS synthesis, FFmpeg burned word-by-word subtitles, and Pexels portrait B-roll.
                </p>
                <div className="flex items-center gap-1.5 mt-2.5">
                  <span className="material-symbols-outlined text-[#ffb954] text-[16px]">
                    schedule
                  </span>
                  <span className="text-xs text-[#e7e0e9] font-medium">
                    {heroShort.scheduledTime}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Linear Pipeline Progress Track */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex justify-between items-center text-[#cac3d8] text-[11px] font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#cdbdff]">
                  auto_awesome
                </span>
                Pipeline: {isRendering ? `${renderProgress}% Rendering Active` : '100% Render Complete'}
              </span>
              <span className="text-[#cdbdff] font-semibold">
                {isRendering ? 'Stitching' : 'Ready'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#36343a] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#7c4dff] via-[#cdbdff] to-[#ffb59e] transition-all duration-300"
                style={{ width: `${isRendering ? renderProgress : 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Performance Analytics Card */}
      <div className="w-full rounded-[28px] bg-[#1d1b21] p-4 sm:p-5 shadow-lg flex flex-col gap-4 border border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-[#cac3d8] uppercase tracking-wider">
              Multi-Platform Reach
            </span>
            <h3 className="text-xl font-semibold text-[#e7e0e9]">Daily Performance</h3>
          </div>
          <button
            type="button"
            onClick={cycleTimeframe}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#36343a] text-[#e7e0e9] text-xs font-medium transition-colors hover:bg-[#3b383f] active:scale-95"
          >
            <span>Last {timeframe}</span>
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </button>
        </div>

        {/* 3-Column Stats Grid with Inline Trend SVG */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Total Views */}
          <div className="flex flex-col p-3 rounded-2xl bg-[#211f25]">
            <span className="text-[11px] font-medium text-[#cac3d8] truncate">Total Views</span>
            <span className="text-lg text-[#e7e0e9] font-semibold mt-1 tabular-nums">
              {statsByTimeframe.views}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[#ffb59e] text-[11px] font-medium tabular-nums">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              <span>{statsByTimeframe.viewsDelta}</span>
            </div>
            <div className="w-full h-5 mt-2">
              <svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 70 20">
                <path
                  className="text-[#ffb59e]"
                  d="M0 16 L12 14 L24 17 L36 10 L48 11 L60 4 L70 2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* Subscribers Gained */}
          <div className="flex flex-col p-3 rounded-2xl bg-[#211f25]">
            <span className="text-[11px] font-medium text-[#cac3d8] truncate">New Subs</span>
            <span className="text-lg text-[#e7e0e9] font-semibold mt-1 tabular-nums">
              {statsByTimeframe.subs}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[#cdbdff] text-[11px] font-medium tabular-nums">
              <span className="material-symbols-outlined text-[12px]">trending_up</span>
              <span>{statsByTimeframe.subsDelta}</span>
            </div>
            <div className="w-full h-5 mt-2">
              <svg className="w-full h-full overflow-visible" fill="none" preserveAspectRatio="none" viewBox="0 0 70 20">
                <path
                  className="text-[#cdbdff]"
                  d="M0 18 L14 15 L28 13 L42 9 L54 6 L70 2"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </div>

          {/* Watch Time Retention */}
          <div className="flex flex-col p-3 rounded-2xl bg-[#211f25]">
            <span className="text-[11px] font-medium text-[#cac3d8] truncate">Avg Watch</span>
            <span className="text-lg text-[#e7e0e9] font-semibold mt-1 tabular-nums">
              {statsByTimeframe.watch}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[#ffb954] text-[11px] font-medium tabular-nums">
              <span className="material-symbols-outlined text-[12px]">bolt</span>
              <span>{statsByTimeframe.retention}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#36343a] mt-3 overflow-hidden">
              <div className="w-[94.5%] h-full bg-[#ffb954] rounded-full" />
            </div>
          </div>
        </div>

        {/* Platform Breakdown Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#211f25] flex-1 justify-center min-w-[90px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff0033]" />
            <span className="text-[11px] text-[#e7e0e9] font-medium">YouTube</span>
            <span className="text-[11px] text-[#cac3d8] tabular-nums">{statsByTimeframe.yt}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#211f25] flex-1 justify-center min-w-[90px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#25f4ee]" />
            <span className="text-[11px] text-[#e7e0e9] font-medium">TikTok</span>
            <span className="text-[11px] text-[#cac3d8] tabular-nums">{statsByTimeframe.tt}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#211f25] flex-1 justify-center min-w-[90px]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e1306c]" />
            <span className="text-[11px] text-[#e7e0e9] font-medium">Reels</span>
            <span className="text-[11px] text-[#cac3d8] tabular-nums">{statsByTimeframe.reels}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-[#cac3d8] uppercase tracking-wider">
            Fast Controls
          </span>
          <span className="text-[11px] text-[#cdbdff] font-medium">
            WorkManager 24h Cycle
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Create Manual Short */}
          <button
            type="button"
            onClick={onTriggerInstantPipeline}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#211f25] text-center transition-all duration-200 active:scale-95 hover:bg-[#2b292f] group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-[#7c4dff]/30 text-[#cdbdff] flex items-center justify-center mb-2 group-hover:bg-[#cdbdff] group-hover:text-[#370096] transition-colors">
              <span className="material-symbols-outlined text-[24px]">auto_videocam</span>
            </div>
            <span className="text-xs text-[#e7e0e9] font-medium leading-tight">Create Short</span>
            <span className="text-[11px] text-[#cdbdff] mt-0.5">+ Run Pipeline</span>
          </button>

          {/* View Media Queue */}
          <button
            type="button"
            onClick={() => onNavigateTab('queue')}
            className="relative flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#211f25] text-center transition-all duration-200 active:scale-95 hover:bg-[#2b292f] group cursor-pointer"
          >
            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-[#7f2a0d] text-[#ff9b7c] text-[10px] font-semibold tabular-nums">
              {queueItems.length}
            </span>
            <div className="w-11 h-11 rounded-full bg-[#7f2a0d]/30 text-[#ffb59e] flex items-center justify-center mb-2 group-hover:bg-[#ffb59e] group-hover:text-[#5e1700] transition-colors">
              <span className="material-symbols-outlined text-[24px]">video_library</span>
            </div>
            <span className="text-xs text-[#e7e0e9] font-medium leading-tight">Media Queue</span>
            <span className="text-[11px] text-[#cac3d8] mt-0.5">{queueItems.length} in line</span>
          </button>

          {/* Channel Settings */}
          <button
            type="button"
            onClick={() => onNavigateTab('campaign')}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl bg-[#211f25] text-center transition-all duration-200 active:scale-95 hover:bg-[#2b292f] group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-full bg-[#36343a] text-[#ffb954] flex items-center justify-center mb-2 group-hover:bg-[#ffb954] group-hover:text-[#452b00] transition-colors">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <span className="text-xs text-[#e7e0e9] font-medium leading-tight">Channels</span>
            <span className="text-[11px] text-[#cac3d8] mt-0.5 flex items-center gap-1">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  settings.youtubeChannelConnected ? 'bg-[#10b981]' : 'bg-[#ffb954]'
                }`}
              />
              {settings.youtubeChannelConnected ? 'Google OK' : 'Link OAuth'}
            </span>
          </button>
        </div>
      </div>

      {/* Recent Generation Pipeline Log */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-[#cac3d8] uppercase tracking-wider">
            Pipeline Activity (upload_logs.json)
          </span>
          <button
            type="button"
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="text-[11px] font-medium text-[#cdbdff] flex items-center gap-0.5 hover:underline"
          >
            <span>{showAllHistory ? 'Show Less' : 'View History'}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {displayedHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => onPreviewShort(item)}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#1d1b21] transition-colors hover:bg-[#211f25] cursor-pointer border border-white/[0.03]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-16 rounded-lg bg-[#36343a] overflow-hidden flex-shrink-0">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-[#0f0d13]/85 text-[9px] font-mono-code text-[#e7e0e9]">
                    {item.duration}
                  </span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-[#e7e0e9] font-medium truncate">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        item.status === 'Published'
                          ? 'bg-[#7c4dff]/30 text-[#cdbdff]'
                          : 'bg-[#9d6700]/30 text-[#ffb954]'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs text-[#cac3d8] truncate tabular-nums">
                      {item.views || item.scheduledTime}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Preview Short"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreviewShort(item);
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#cac3d8] hover:bg-[#36343a] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {item.status === 'Published' ? 'bar_chart' : 'play_circle'}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
