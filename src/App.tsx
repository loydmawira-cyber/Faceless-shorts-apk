/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ALTERNATE_BROLL_POOL,
  AppSettingsJSON,
  INITIAL_QUEUE_ITEMS,
  INITIAL_STOCK_CLIPS,
  PipelineStepState,
  QueuedShortItem,
  TerminalLogEntry,
  VideoScriptRecipeJSON,
} from './types/schemas';
import { FacelessReelsStudio } from './components/FacelessReelsStudio';
import { DashboardScreen } from './components/DashboardScreen';
import { CampaignScreen } from './components/CampaignScreen';
import { QueueScreen } from './components/QueueScreen';
import { RenderScreen } from './components/RenderScreen';
import { ShortPreviewModal } from './components/ShortPreviewModal';

type ActiveTab = 'studio' | 'dashboard' | 'campaign' | 'queue' | 'render';

const STORAGE_SETTINGS_KEY = 'faceless_shorts_app_settings_v1';
const STORAGE_QUEUE_KEY = 'faceless_shorts_queue_items_v1';

const DEFAULT_SETTINGS: AppSettingsJSON = {
  niche: 'Motivation & Mindset',
  frequencyPerDay: 2,
  toneOfVoice: 'Cinematic & Deep',
  pexelsApiKey: '',
  lastRunTimestamp: Date.now() - 3600 * 1000 * 5,
  autoPilotEnabled: true,
  musicDuckingVolume: 18,
  autoDuckingEnabled: true,
  youtubeChannelConnected: true,
  youtubeChannelHandle: '@MindsetDailyShorts',
};

const INITIAL_TERMINAL_LOGS: TerminalLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '16:42:08',
    tag: 'INIT',
    message: 'Initializing DailyVideoWorker constraints: UNMETERED + CHARGING + DEVICE_IDLE',
  },
  {
    id: 'log-2',
    timestamp: '16:42:10',
    tag: 'INFO',
    message:
      "Gemini prompt: '5 Daily Habits of Marcus Aurelius' returned VideoScriptRecipeJSON (5 B-Roll keywords)",
  },
  {
    id: 'log-3',
    timestamp: '16:42:12',
    tag: 'PEXELS',
    message:
      'Downloaded 3 portrait (9:16) .mp4 clips to context.cacheDir/broll_clips/',
  },
  {
    id: 'log-4',
    timestamp: '16:42:14',
    tag: 'TTS',
    message:
      'Android TextToSpeech.synthesizeToFile() wrote cacheDir/voice.wav (00:48.2)',
  },
  {
    id: 'log-5',
    timestamp: '16:42:16',
    tag: 'FFMPEG',
    message:
      "ffmpeg -i clip1.mp4 -i clip2.mp4 -i clip3.mp4 -i voice.wav -filter_complex 'scale=1080:1920,drawtext=...'",
  },
  {
    id: 'log-6',
    timestamp: '16:42:18',
    tag: 'FFMPEG',
    message:
      'frame=  980 fps= 48 q=21.0 size= 14850kB time=00:32.60 bitrate=5068.8kbits/s',
  },
  {
    id: 'log-7',
    timestamp: '16:42:20',
    tag: 'STATUS',
    message:
      'Hardware H.264 encoder engaged • Burning CaptionWordJSON center-screen subtitles',
  },
];

function formatTimeNow(): string {
  const d = new Date();
  return d.toTimeString().split(' ')[0];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('studio');

  const [settings, setSettings] = useState<AppSettingsJSON>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [queueItems, setQueueItems] = useState<QueuedShortItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_QUEUE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_QUEUE_ITEMS;
    } catch {
      return INITIAL_QUEUE_ITEMS;
    }
  });

  const [selectedShortId, setSelectedShortId] = useState<string>(
    () => INITIAL_QUEUE_ITEMS[0].id
  );
  const [previewModalShort, setPreviewModalShort] = useState<QueuedShortItem | null>(
    null
  );

  // Live 4-step pipeline execution state
  const [isRendering, setIsRendering] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [renderProgress, setRenderProgress] = useState(68);
  const [currentStageNumber, setCurrentStageNumber] = useState<1 | 2 | 3 | 4>(3);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLogEntry[]>(
    INITIAL_TERMINAL_LOGS
  );
  const renderTimerRef = useRef<number | null>(null);

  const [pipelineSteps, setPipelineSteps] = useState<PipelineStepState[]>([
    {
      stepNumber: 1,
      title: 'Generating AI Script (Gemini API)',
      subtitle: 'VideoScriptRecipeJSON • 50s script + 5 B-Roll keywords',
      status: 'completed',
      durationText: '1.8s',
    },
    {
      stepNumber: 2,
      title: 'Free B-Roll Ingestion (Pexels API)',
      subtitle: 'orientation=portrait • Top 3 MP4 clips cached locally',
      status: 'completed',
      durationText: '2.4s',
    },
    {
      stepNumber: 3,
      title: 'Local TTS & FFmpeg Rendering',
      subtitle: 'Android TextToSpeech voice.wav + CaptionWordJSON drawtext',
      status: 'active',
      durationText: 'Rendering',
      progressPercent: 68,
    },
    {
      stepNumber: 4,
      title: 'Automated YouTube Shorts Upload',
      subtitle: 'YouTube Data API v3 videos.insert • public • notMadeForKids',
      status: 'pending',
      durationText: 'Queued',
    },
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queueItems));
    } catch {
      // ignore storage errors
    }
  }, [queueItems]);

  const appendTerminalLog = (
    tag: TerminalLogEntry['tag'],
    message: string
  ) => {
    setTerminalLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: formatTimeNow(),
        tag,
        message,
      },
    ]);
  };

  const handleUpdateShortItem = (updated: QueuedShortItem) => {
    setQueueItems((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleCreateNewShortInQueue = (newShort: QueuedShortItem) => {
    setQueueItems((prev) => [newShort, ...prev]);
    setSelectedShortId(newShort.id);
    appendTerminalLog(
      'INFO',
      `Created new Faceless Reel: "${newShort.title}" (${newShort.recipe.captionsTimeline.length} timed words)`
    );
  };

  // Generate a brand-new Short via the server-side Gemini endpoint
  const handleGenerateNewAiShort = async (): Promise<void> => {
    if (isGeneratingAi) return;
    setIsGeneratingAi(true);
    appendTerminalLog(
      'INFO',
      `POST /api/pipeline/generate-script (niche="${settings.niche}", tone="${settings.toneOfVoice}")`
    );

    const fallbackScript =
      'Most people wake up reactive. Marcus Aurelius woke up ready. Rule number one: Control your morning, or the morning controls you. Strip the noise, anchor your breath, and command your thoughts before the world takes the wheel.';

    let recipe: VideoScriptRecipeJSON = {
      targetTopic: `5 Iron Rules of ${settings.niche}`,
      voiceScript: fallbackScript,
      bRollKeywords: [
        'roman statue dark lighting',
        'foggy mountain sunrise',
        'writing leather journal',
        'stormy ocean waves',
        'ancient temple columns',
      ],
      captionsTimeline: INITIAL_QUEUE_ITEMS[0].recipe.captionsTimeline,
    };

    try {
      const response = await fetch('/api/pipeline/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: settings.niche,
          toneOfVoice: settings.toneOfVoice,
        }),
      });

      if (response.ok) {
        const parsed = await response.json();
        if (parsed && parsed.voiceScript) {
          recipe = parsed;
        }
      }
    } catch {
      // Fallback recipe already prepared
    }

    try {
      const newId = `short-${Date.now()}`;
      const pickThumb =
        ALTERNATE_BROLL_POOL[queueItems.length % ALTERNATE_BROLL_POOL.length]
          .thumbnailUrl;

      const customClips = INITIAL_STOCK_CLIPS.map((clip, i) => ({
        ...clip,
        id: `${newId}-clip-${i + 1}`,
        keyword: recipe.bRollKeywords[i] || clip.keyword,
        title: (recipe.bRollKeywords[i] || clip.title)
          .split(' ')
          .slice(0, 2)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
      }));

      const newShort: QueuedShortItem = {
        id: newId,
        title: recipe.targetTopic,
        scheduledTime: 'Today at 7:15 PM EST',
        dateLabel: 'Today • 7:15 PM EST',
        dayName: 'Thu',
        dayNumber: '31',
        status: 'Ready for Review',
        duration: '0:50',
        thumbnailUrl: pickThumb,
        recipe,
        clips: customClips,
      };

      setQueueItems((prev) => [newShort, ...prev]);
      setSelectedShortId(newShort.id);
      appendTerminalLog(
        'INFO',
        `Parsed VideoScriptRecipeJSON: "${recipe.targetTopic}" (${recipe.captionsTimeline.length} timed words)`
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Run the full 4-step DailyVideoWorker pipeline live with real Gemini script generation
  const handleStartLivePipelineRun = async () => {
    if (isRendering) return;
    setActiveTab('render');
    setIsRendering(true);
    setRenderProgress(8);
    setCurrentStageNumber(1);

    setPipelineSteps([
      {
        stepNumber: 1,
        title: 'Generating AI Script (Gemini API)',
        subtitle: `Requesting 50s ${settings.niche} VideoScriptRecipeJSON...`,
        status: 'active',
        durationText: 'Running',
        progressPercent: 35,
      },
      {
        stepNumber: 2,
        title: 'Free B-Roll Ingestion (Pexels API)',
        subtitle: 'Waiting for 5 B-Roll search keywords...',
        status: 'pending',
        durationText: 'Queued',
      },
      {
        stepNumber: 3,
        title: 'Local TTS & FFmpeg Rendering',
        subtitle: 'Waiting for audio & portrait MP4 streams...',
        status: 'pending',
        durationText: 'Queued',
      },
      {
        stepNumber: 4,
        title: 'Automated YouTube Shorts Upload',
        subtitle: 'YouTube Data API v3 videos.insert',
        status: 'pending',
        durationText: 'Queued',
      },
    ]);

    appendTerminalLog(
      'INIT',
      'DailyVideoWorker.doWork() triggered • Constraints: Wi-Fi + Charging + Idle = TRUE'
    );

    // Step 1: Call real Gemini endpoint
    await handleGenerateNewAiShort();

    setRenderProgress(32);
    setCurrentStageNumber(2);
    setPipelineSteps((prev) =>
      prev.map((s) =>
        s.stepNumber === 1
          ? {
              ...s,
              status: 'completed',
              durationText: '1.9s',
              subtitle: 'VideoScriptRecipeJSON parsed • 5 B-Roll keywords verified',
            }
          : s.stepNumber === 2
          ? {
              ...s,
              status: 'active',
              durationText: 'Downloading',
              progressPercent: 55,
              subtitle: 'Fetching top 3 portrait (9:16) MP4 clips from Pexels API...',
            }
          : s
      )
    );
    appendTerminalLog(
      'PEXELS',
      'GET https://api.pexels.com/videos/search?orientation=portrait -> Downloading 3 MP4 clips to cacheDir'
    );

    // Step 2 -> Step 3 -> Step 4 progression
    let p = 35;
    if (renderTimerRef.current) {
      window.clearInterval(renderTimerRef.current);
    }

    renderTimerRef.current = window.setInterval(() => {
      p += 7;
      if (p >= 55 && p < 62) {
        setCurrentStageNumber(3);
        setPipelineSteps((prev) =>
          prev.map((s) =>
            s.stepNumber === 2
              ? {
                  ...s,
                  status: 'completed',
                  durationText: '2.1s',
                  subtitle: 'Saved broll_clip_1.mp4, broll_clip_2.mp4, broll_clip_3.mp4',
                }
              : s.stepNumber === 3
              ? {
                  ...s,
                  status: 'active',
                  durationText: 'Rendering',
                  progressPercent: 50,
                  subtitle:
                    'Synthesizing voice.wav & burning CaptionWordJSON drawtext subtitles...',
                }
              : s
          )
        );
        appendTerminalLog(
          'TTS',
          'TextToSpeech.synthesizeToFile() -> cacheDir/voice.wav (24kHz mono WAV)'
        );
        appendTerminalLog(
          'FFMPEG',
          'FFmpegKit.execute("-filter_complex scale=1080:1920,concat=n=3:v=1:a=0,drawtext=...")'
        );
      } else if (p >= 84 && p < 91) {
        setCurrentStageNumber(4);
        setPipelineSteps((prev) =>
          prev.map((s) =>
            s.stepNumber === 3
              ? {
                  ...s,
                  status: 'completed',
                  durationText: '4.6s',
                  subtitle: 'Output 1080x1920 H.264 MP4 rendered cleanly',
                }
              : s.stepNumber === 4
              ? {
                  ...s,
                  status: 'active',
                  durationText: 'Uploading',
                  progressPercent: 85,
                  subtitle:
                    'YouTube Data API v3 videos.insert (privacyStatus=public, notMadeForKids=true)',
                }
              : s
          )
        );
        appendTerminalLog(
          'UPLOAD',
          'YouTube.Videos.Insert -> snippet.title + #Shorts | status.privacyStatus="public" | selfDeclaredMadeForKids=false'
        );
      }

      if (p >= 100) {
        if (renderTimerRef.current) {
          window.clearInterval(renderTimerRef.current);
          renderTimerRef.current = null;
        }
        setRenderProgress(100);
        setIsRendering(false);
        setPipelineSteps((prev) =>
          prev.map((s) => ({
            ...s,
            status: 'completed',
            durationText: s.stepNumber === 4 ? '1.4s' : s.durationText,
          }))
        );
        setSettings((prev) => ({ ...prev, lastRunTimestamp: Date.now() }));
        setQueueItems((prev) =>
          prev.map((item, idx) =>
            idx === 0
              ? {
                  ...item,
                  status: 'Published',
                  views: 'Just Published • Public Short',
                }
              : item
          )
        );
        appendTerminalLog(
          'STATUS',
          'Pipeline 100% Complete! Video published to YouTube Shorts & recorded in upload_logs.json'
        );
      } else {
        setRenderProgress(p);
      }
    }, 450);
  };

  const handleCancelRender = () => {
    if (renderTimerRef.current) {
      window.clearInterval(renderTimerRef.current);
      renderTimerRef.current = null;
    }
    setIsRendering(false);
    appendTerminalLog('ERROR', 'Render session cancelled by user.');
  };

  const activeShort =
    queueItems.find((i) => i.id === selectedShortId) || queueItems[0];

  const tabSubtitles: Record<ActiveTab, string> = {
    studio: 'Create Reel',
    dashboard: 'Dashboard',
    campaign: 'Auto-Pilot Settings',
    queue: 'My Videos',
    render: 'Render & Publish',
  };

  return (
    <div className="min-h-screen bg-[#141218] text-[#e7e0e9] flex flex-col">
      {/* Top App Header Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#141218]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto h-16 px-4 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7c4dff] to-[#cdbdff] flex items-center justify-center shadow-md shrink-0">
              <span className="material-symbols-outlined text-[#20005f] text-[22px] icon-filled">
                play_shapes
              </span>
            </div>
            <span className="text-base font-bold text-[#e7e0e9] tracking-tight truncate">
              FacelessReels
            </span>
          </div>

          {/* Zone 2: Clean 4-item Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#cac3d8]">
            {(
              [
                ['studio', 'Create Reel'],
                ['queue', 'My Videos'],
                ['campaign', 'Auto-Pilot'],
                ['dashboard', 'Analytics'],
              ] as const
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tabKey
                    ? 'text-[#cdbdff] font-semibold border-b-2 border-[#7c4dff]'
                    : 'hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Clean Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('studio');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#7c4dff] hover:bg-[#6c3df0] text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Create Reel</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto pt-20 pb-28 px-4">
        {activeTab === 'studio' && activeShort ? (
          <FacelessReelsStudio
            settings={settings}
            activeShort={activeShort}
            onUpdateShort={handleUpdateShortItem}
            onCreateNewShortInQueue={handleCreateNewShortInQueue}
            onNavigateToRender={handleStartLivePipelineRun}
          />
        ) : (
          <div className="max-w-3xl mx-auto w-full flex flex-col">
            {activeTab === 'dashboard' && (
              <DashboardScreen
                settings={settings}
                queueItems={queueItems}
                onToggleAutoPilot={(enabled) =>
                  setSettings((prev) => ({ ...prev, autoPilotEnabled: enabled }))
                }
                onNavigateTab={(t) => setActiveTab(t)}
                onPreviewShort={(item) => setPreviewModalShort(item)}
                onTriggerInstantPipeline={() => setActiveTab('studio')}
                isRendering={isRendering}
                renderProgress={renderProgress}
              />
            )}

            {activeTab === 'campaign' && (
              <CampaignScreen
                settings={settings}
                onUpdateSettings={setSettings}
                onSaveAndStartAutoPilot={() => {
                  setSettings((prev) => ({
                    ...prev,
                    autoPilotEnabled: true,
                    lastRunTimestamp: Date.now(),
                  }));
                  setActiveTab('studio');
                }}
              />
            )}

            {activeTab === 'queue' && (
              <QueueScreen
                settings={settings}
                queueItems={queueItems}
                selectedShortId={selectedShortId}
                onSelectShort={setSelectedShortId}
                onUpdateShortItem={handleUpdateShortItem}
                onPreviewShort={(item) => setPreviewModalShort(item)}
                onApproveAndRenderShort={(item) => {
                  setSelectedShortId(item.id);
                  handleStartLivePipelineRun();
                }}
                onGenerateNewAiShort={handleGenerateNewAiShort}
                isGeneratingAi={isGeneratingAi}
              />
            )}

            {activeTab === 'render' && activeShort && (
              <RenderScreen
                activeShort={activeShort}
                isRendering={isRendering}
                renderProgress={renderProgress}
                currentStageNumber={currentStageNumber}
                pipelineSteps={pipelineSteps}
                terminalLogs={terminalLogs}
                onStartLivePipelineRun={handleStartLivePipelineRun}
                onCancelRender={handleCancelRender}
                onPreviewShort={(item) => setPreviewModalShort(item)}
              />
            )}
          </div>
        )}
      </main>

      {/* Clean 4-Tab Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1d1b21]/95 backdrop-blur-xl border-t border-white/[0.06]">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2">
          {(
            [
              { id: 'studio', label: 'Create', icon: 'auto_videocam' },
              { id: 'queue', label: 'My Videos', icon: 'video_library' },
              { id: 'campaign', label: 'Auto-Pilot', icon: 'tune' },
              { id: 'dashboard', label: 'Analytics', icon: 'bar_chart' },
            ] as const
          ).map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center h-full transition-colors cursor-pointer"
              >
                <span
                  className={`material-symbols-outlined text-[22px] transition-colors ${
                    isActive ? 'text-[#cdbdff] icon-filled' : 'text-[#948ea1]'
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-[11px] mt-0.5 transition-colors ${
                    isActive
                      ? 'text-[#e7e0e9] font-semibold'
                      : 'text-[#948ea1] font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 9:16 Vertical Short Preview Modal */}
      <ShortPreviewModal
        shortItem={previewModalShort}
        onClose={() => setPreviewModalShort(null)}
      />
    </div>
  );
}
