import React, { useState } from 'react';
import { AppSettingsJSON } from '../types/schemas';

interface CampaignScreenProps {
  settings: AppSettingsJSON;
  onUpdateSettings: (updated: AppSettingsJSON) => void;
  onSaveAndStartAutoPilot: () => void;
}

const NICHE_OPTIONS = [
  { id: 'Motivation & Mindset', icon: 'psychology_alt', themePreview: 'Stoic & Morning Motivation' },
  { id: 'Tech & AI Facts', icon: 'terminal', themePreview: 'Autonomous Future & Silicon Breakthroughs' },
  { id: 'Philosophy & Stoicism', icon: 'balance', themePreview: 'Ancient Wisdom for Modern Discipline' },
  { id: 'Dark Psychology', icon: 'visibility', themePreview: 'Cognitive Biases & Human Behavior' },
  { id: 'Financial Lifehacks', icon: 'payments', themePreview: 'Asymmetric Wealth & Cashflow Rules' },
];

const VOICE_ARCHETYPES = [
  {
    id: 'Cinematic & Deep',
    icon: 'graphic_eq',
    desc: 'Warm resonant baritone with slow pacing.',
    ttsVoice: 'Charon',
  },
  {
    id: 'High-Energy',
    icon: 'bolt',
    desc: 'Punchy hooks, rapid retention cuts.',
    ttsVoice: 'Puck',
  },
  {
    id: 'Calm & Stoic',
    icon: 'spa',
    desc: 'Measured rhythm, meditative pauses.',
    ttsVoice: 'Fenrir',
  },
  {
    id: 'Documentary',
    icon: 'history_edu',
    desc: 'Objective, authoritative cadence.',
    ttsVoice: 'Kore',
  },
];

export const CampaignScreen: React.FC<CampaignScreenProps> = ({
  settings,
  onUpdateSettings,
  onSaveAndStartAutoPilot,
}) => {
  const [editingPexelsKey, setEditingPexelsKey] = useState(false);
  const [pexelsInput, setPexelsInput] = useState(settings.pexelsApiKey);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showJsonModal, setShowJsonModal] = useState(false);

  const activeNicheObj =
    NICHE_OPTIONS.find((n) => n.id === settings.niche) || NICHE_OPTIONS[0];

  const handleSavePexelsKey = () => {
    onUpdateSettings({ ...settings, pexelsApiKey: pexelsInput.trim() });
    setEditingPexelsKey(false);
  };

  const handleTriggerSaveCta = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      onSaveAndStartAutoPilot();
      setTimeout(() => setSaveSuccess(false), 1800);
    }, 650);
  };

  return (
    <div className="flex flex-col w-full gap-5">
      {/* Step Tracker Header */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-[#cdbdff] font-medium tracking-wide uppercase">
              Campaign Wizard • AppSettingsJSON
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#e7e0e9] tracking-tight">
              Strategy &amp; Pipeline
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowJsonModal(!showJsonModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7c4dff]/20 text-[#cdbdff] text-xs font-semibold hover:bg-[#7c4dff]/30 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">data_object</span>
            <span>{showJsonModal ? 'Hide JSON' : 'Inspect JSON'}</span>
          </button>
        </div>
        <p className="text-sm text-[#cac3d8]">
          Define your autonomous viral niche and connect free AI generation tools.
        </p>
        {/* Linear Animated Progress Bar */}
        <div className="relative w-full h-2 rounded-full bg-[#36343a] overflow-hidden mt-1 shadow-inner">
          <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#7c4dff] via-[#cdbdff] to-[#ffb59e] transition-all duration-700 ease-out" />
        </div>
      </section>

      {/* Collapsible Live AppSettingsJSON Serialization Preview */}
      {showJsonModal && (
        <section className="rounded-2xl bg-[#0f0d13] p-4 border border-[#cdbdff]/20 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono-code font-semibold text-[#cdbdff]">
              filesDir/app_settings.json (AppSettingsJSON)
            </span>
            <span className="text-[11px] font-mono-code text-[#ffb954]">@Serializable</span>
          </div>
          <pre className="text-xs font-mono-code text-[#cac3d8] overflow-x-auto leading-relaxed">
            {JSON.stringify(
              {
                niche: settings.niche,
                frequencyPerDay: settings.frequencyPerDay,
                toneOfVoice: settings.toneOfVoice,
                geminiApiKey: 'MANAGED_SERVER_SECRET',
                pexelsApiKey: settings.pexelsApiKey ? 'pxls_configured_key' : 'free_stock_pool',
                lastRunTimestamp: settings.lastRunTimestamp,
              },
              null,
              2
            )}
          </pre>
        </section>
      )}

      {/* Interactive Niche Visual Showcase */}
      <section className="relative w-full rounded-2xl overflow-hidden bg-[#1d1b21] shadow-md group border border-white/[0.04]">
        <div className="relative h-36 w-full overflow-hidden">
          <img
            className="w-full h-full object-cover opacity-65 scale-105 transition-transform duration-700 group-hover:scale-110"
            alt="Active Theme Preview"
            referrerPolicy="no-referrer"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP46S9VmnZlYQoLLJ2Wy7gxtLRISTRWG_SEc2wU1ydX76fzAUjjMCsU35eAkd4lLH6yoQFo7uTLdrgeCIfc_8n9rjodB1ucYB94sfawsLzBxoRUBXBOYUh4W0dKRDkvDabOUGnzEKHnrhYdebhwpM7tuIUcXjr571zOHn2DNWfHjNE8Qb77bDa38eIAVKcmEiYAL1R3Yfas_QO9mI9DAEi62yirupeeSzpIZWz1xRuDBdqp7Saho7o"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1d1b21] via-[#1d1b21]/60 to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-[#36343a]/90 text-[#e7e0e9] text-[11px] font-medium backdrop-blur-md flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#ffb954] icon-filled">
                stars
              </span>
              Trending Niche (92% Retention)
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <span className="text-[11px] text-[#cac3d8]">Active Theme Preview</span>
              <p className="text-base text-[#e7e0e9] font-semibold">
                {activeNicheObj.themePreview}
              </p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-[#cdbdff]/15 text-[#cdbdff] text-[11px] font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">auto_videocam</span>
              Auto-Rendering
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Content & Voice Setup Form */}
      <section className="flex flex-col gap-5 bg-[#1d1b21] p-4 sm:p-5 rounded-2xl shadow-sm border border-white/[0.04]">
        {/* Field: Niche Category Selection */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm text-[#e7e0e9] font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[#cdbdff] text-[20px]">
                category
              </span>
              Niche Category
            </label>
            <span className="text-[11px] text-[#cdbdff] font-medium">5 Viral Presets</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            {NICHE_OPTIONS.map((item) => {
              const selected = settings.niche === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, niche: item.id })}
                  className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    selected
                      ? 'bg-[#7c4dff] text-white shadow-sm'
                      : 'bg-[#36343a] text-[#cac3d8] hover:bg-[#3b383f]'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      selected ? 'icon-filled' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.id}
                </button>
              );
            })}
          </div>
        </div>

        {/* Field: Target Posting Frequency */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-[#e7e0e9] font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[#ffb59e] text-[20px]">
                calendar_clock
              </span>
              Target Posting Frequency
            </label>
            <span className="text-[11px] text-[#ffb59e] font-medium">
              Algorithmic Sweetspot
            </span>
          </div>
          <div className="grid grid-cols-3 p-1 rounded-xl bg-[#36343a] gap-1">
            {[1, 2, 3].map((freq) => {
              const active = settings.frequencyPerDay === freq;
              return (
                <button
                  key={freq}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, frequencyPerDay: freq })}
                  className={`py-2.5 px-2 rounded-lg text-xs text-center transition-all cursor-pointer tabular-nums ${
                    active
                      ? 'bg-[#7f2a0d] text-[#ff9b7c] font-semibold shadow-sm'
                      : 'text-[#cac3d8] hover:text-white'
                  }`}
                >
                  {freq}x Daily
                </button>
              );
            })}
          </div>
          <p className="text-xs text-[#cac3d8] px-1 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-[#ffb954]">info</span>
            WorkManager DailyVideoWorker executes when connected to Wi-Fi, Charging, and Idle.
          </p>
        </div>

        {/* Field: Tone of Voice Selector */}
        <div className="flex flex-col gap-2.5">
          <label className="text-sm text-[#e7e0e9] font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[#cdbdff] text-[20px]">
              record_voice_over
            </span>
            AI Voice &amp; Tone Archetype
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {VOICE_ARCHETYPES.map((voice) => {
              const selected = settings.toneOfVoice === voice.id;
              return (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, toneOfVoice: voice.id })}
                  className={`flex flex-col p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                    selected
                      ? 'bg-gradient-to-br from-[#7c4dff]/25 to-[#2b292f] ring-1 ring-[#cdbdff]/40'
                      : 'bg-[#211f25] hover:bg-[#2b292f]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`material-symbols-outlined text-[22px] ${
                        selected ? 'text-[#cdbdff]' : 'text-[#cac3d8]'
                      }`}
                    >
                      {voice.icon}
                    </span>
                    {selected ? (
                      <span className="material-symbols-outlined text-[#cdbdff] text-[18px] icon-filled">
                        check_circle
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-[#36343a]" />
                    )}
                  </div>
                  <span className="text-sm text-[#e7e0e9] font-medium">{voice.id}</span>
                  <span className="text-xs text-[#cac3d8] mt-0.5">{voice.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Field: Background Music Preferences & Auto-Ducking */}
        <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-[#211f25]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#7f2a0d]/30 flex items-center justify-center text-[#ffb59e]">
                <span className="material-symbols-outlined text-[20px]">music_note</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#e7e0e9] font-medium">
                  Royalty-Free Audio Stream
                </span>
                <span className="text-[11px] text-[#cac3d8]">
                  No Copyright Lofi Chill Beats (Selected)
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-[#2b292f] text-[11px] text-[#cdbdff] font-mono-code">
              -14dB Ducking
            </span>
          </div>

          <div className="flex flex-col gap-1.5 mt-1 pt-2 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-[#cac3d8]">Music Ducking Level</span>
              <span className="text-[11px] text-[#cdbdff] font-semibold tabular-nums">
                {settings.musicDuckingVolume}% Volume
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              value={settings.musicDuckingVolume}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  musicDuckingVolume: Number(e.target.value),
                })
              }
              className="w-full h-2 rounded-full appearance-none bg-[#36343a] cursor-pointer accent-[#cdbdff]"
            />
          </div>
        </div>
      </section>

      {/* Section 2: Free API Credentials & Social Pipelines Card */}
      <section className="flex flex-col gap-4 bg-[#1d1b21] p-4 sm:p-5 rounded-2xl shadow-sm border border-white/[0.04]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#9d6700]/40 flex items-center justify-center text-[#ffb954]">
              <span className="material-symbols-outlined text-[16px]">key</span>
            </div>
            <h2 className="text-base text-[#e7e0e9] font-semibold">
              Free API Automation Hub
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#ffb954]/15 text-[#ffb954] text-[11px] font-semibold tracking-wide">
            100% Free Tools Only
          </span>
        </div>
        <p className="text-xs text-[#cac3d8]">
          Zero subscription fees. FacelessShorts operates strictly through free-tier creator developer tokens.
        </p>

        {/* Slot 1: Google Gemini Free API (Managed Server-Side Secret) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#e7e0e9] font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#cdbdff]">
                auto_awesome
              </span>
              Google Gemini Free API Engine
            </span>
            <span className="text-[11px] text-[#cdbdff] flex items-center gap-0.5 font-medium">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              Server Secret Connected
            </span>
          </div>
          <div className="flex items-center justify-between bg-[#2b292f] px-3.5 py-2.5 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <span className="material-symbols-outlined text-[#948ea1] text-[18px]">
                shield_lock
              </span>
              <span className="text-xs text-[#e7e0e9] tracking-wider font-mono-code truncate">
                GEMINI_API_KEY • Automatic Server Proxy
              </span>
            </div>
            <span className="text-[11px] text-[#cac3d8] font-mono-code">gemini-3.8-flash</span>
          </div>
        </div>

        {/* Slot 2: Pexels Free Media Key */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[#e7e0e9] font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#ffb59e]">
                movie
              </span>
              Pexels Free Video Key (Optional Live Fetch)
            </label>
            <span className="text-[11px] text-[#cdbdff] flex items-center gap-0.5 font-medium">
              <span className="material-symbols-outlined text-[14px]">check_circle</span>
              {settings.pexelsApiKey ? 'Custom Key Set' : 'Curated Pool Ready'}
            </span>
          </div>

          {editingPexelsKey ? (
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={pexelsInput}
                onChange={(e) => setPexelsInput(e.target.value)}
                placeholder="Paste Pexels API Key (or leave blank for built-in 9:16 clips)..."
                className="flex-1 bg-[#2b292f] px-3.5 py-2 rounded-xl text-xs text-[#e7e0e9] font-mono-code focus:outline-none focus:ring-2 focus:ring-[#7c4dff]"
              />
              <button
                type="button"
                onClick={handleSavePexelsKey}
                className="px-3 py-2 rounded-xl bg-[#7c4dff] text-white text-xs font-semibold"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-[#2b292f] px-3.5 py-2.5 rounded-xl">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-[#948ea1] text-[18px]">
                  lock
                </span>
                <span className="text-xs text-[#e7e0e9] tracking-wider font-mono-code truncate">
                  {settings.pexelsApiKey
                    ? `pxls_${settings.pexelsApiKey.slice(0, 4)}••••••••••••`
                    : 'pxls_982bZ••••••••••57u (Built-in Portrait Pool)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingPexelsKey(true)}
                className="text-[#cdbdff] text-xs font-medium px-2 py-1 rounded-lg hover:bg-[#36343a] transition-colors"
              >
                Configure
              </button>
            </div>
          )}
        </div>

        {/* Slot 3: Linked YouTube Channel OAuth Container */}
        <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[#211f25]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#FF0000]/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#FF4E45] text-[22px] icon-filled">
                  smart_display
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-[#e7e0e9] font-medium truncate">
                    {settings.youtubeChannelHandle}
                  </span>
                  {settings.youtubeChannelConnected && (
                    <span className="material-symbols-outlined text-[#cdbdff] text-[16px] icon-filled">
                      verified
                    </span>
                  )}
                </div>
                <span className="text-xs text-[#cac3d8]">
                  {settings.youtubeChannelConnected
                    ? 'Connected via Google OAuth 2.0 (youtube.upload)'
                    : 'Disconnected — Click to Authenticate YouTube Channel'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                onUpdateSettings({
                  ...settings,
                  youtubeChannelConnected: !settings.youtubeChannelConnected,
                })
              }
              className="px-3 py-1.5 rounded-full bg-[#2b292f] text-xs font-medium text-[#cdbdff] hover:bg-[#36343a] transition-all flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              <span>{settings.youtubeChannelConnected ? 'Verified' : 'Authenticate'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Persistent Bottom Action Area */}
      <section className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={handleTriggerSaveCta}
          className="w-full h-14 rounded-full bg-[#7c4dff] text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-[0_4px_24px_rgba(124,77,255,0.4)] active:scale-[0.98] hover:bg-[#7c4dff]/90 transition-all cursor-pointer"
        >
          {isSaving ? (
            <>
              <span className="material-symbols-outlined text-[22px] animate-spin">
                refresh
              </span>
              <span>Scheduling WorkManager Pipeline...</span>
            </>
          ) : saveSuccess ? (
            <>
              <span className="material-symbols-outlined text-[22px] icon-filled">
                check_circle
              </span>
              <span>Campaign Saved &amp; Auto-Pilot Live!</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[22px] icon-filled">
                auto_mode
              </span>
              <span>Save Campaign &amp; Start Auto-Pilot</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </>
          )}
        </button>
        <p className="text-[11px] text-[#cac3d8] text-center">
          You can pause, edit prompts, or swap voice models anytime from the Dashboard.
        </p>
      </section>
    </div>
  );
};
