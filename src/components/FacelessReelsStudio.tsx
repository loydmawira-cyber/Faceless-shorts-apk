import React, { useEffect, useRef, useState } from 'react';
import {
  ALTERNATE_BROLL_POOL,
  AppSettingsJSON,
  BRollClipItem,
  INITIAL_STOCK_CLIPS,
  MotionVideoPreset,
  QueuedShortItem,
  VIRAL_MOTION_VIDEOS,
  VideoScriptRecipeJSON,
  buildCaptionsFromText,
} from '../types/schemas';

interface FacelessReelsStudioProps {
  settings: AppSettingsJSON;
  activeShort: QueuedShortItem;
  onUpdateShort: (updated: QueuedShortItem) => void;
  onCreateNewShortInQueue: (newShort: QueuedShortItem) => void;
  onNavigateToRender: () => void;
}

export type CaptionStylePreset = 'hormozi' | 'beast' | 'minimal' | 'neon';
export type VideoFormatMode = 'standard' | 'reddit' | 'faketext' | 'splitscreen';

interface NicheTemplatePreset {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  format: VideoFormatMode;
  visualStyle: string;
  defaultTopic: string;
  sampleHook: string;
}

const NICHE_TEMPLATES: NicheTemplatePreset[] = [
  {
    id: 'mindset-loop',
    name: 'Motivation',
    subtitle: 'Stoic & daily habits',
    icon: 'self_improvement',
    format: 'standard',
    visualStyle: 'Dark Cinematic Stoic',
    defaultTopic: '5 Daily Habits of Marcus Aurelius',
    sampleHook:
      'Most people wake up reactive. Marcus Aurelius woke up ready. Rule number one: Control your morning, or the morning controls you. Strip the noise, anchor your breath, and command your thoughts before the world takes the wheel.',
  },
  {
    id: 'money-minute',
    name: 'Finance',
    subtitle: 'Money & wealth rules',
    icon: 'currency_exchange',
    format: 'standard',
    visualStyle: 'Hyper-Realistic 4K',
    defaultTopic: 'The 3 Silent Rules of Asymmetric Wealth',
    sampleHook:
      'The middle class trades time for money. The ultra-wealthy buy assets that print cashflow while they sleep. Here are the three asymmetric leverage rules Wall Street never teaches in school.',
  },
  {
    id: 'storyframe',
    name: 'History Story',
    subtitle: 'Hook, tension & reveal',
    icon: 'auto_stories',
    format: 'standard',
    visualStyle: 'Historical Oil Painting',
    defaultTopic: 'The General Who Burned His Own Ships',
    sampleHook:
      'In 1519, outnumbered ten to one on a foreign shore, the commander gave a three-word order that shocked his entire army: Burn the ships. When retreat is impossible, victory becomes the only option.',
  },
  {
    id: 'reddit-confession',
    name: 'Reddit Story',
    subtitle: 'r/AskReddit card overlay',
    icon: 'forum',
    format: 'reddit',
    visualStyle: 'Cyberpunk / Sci-Fi',
    defaultTopic: 'What is a psychological secret nobody admits?',
    sampleHook:
      'What is a psychological trick that works on 99% of people? When someone is trying to manipulate you, stay completely silent for four seconds and look at their forehead. Watch how fast they panic.',
  },
  {
    id: 'fake-text-chat',
    name: 'Text Chat',
    subtitle: 'iMessage story bubbles',
    icon: 'chat_bubble',
    format: 'faketext',
    visualStyle: 'Moody Film Noir',
    defaultTopic: 'Unknown Number Texts at 3:00 AM',
    sampleHook:
      'Do not look out your bedroom window right now. Wait, who is this? How did you get my number? I told you not to look. Whoever is standing under the streetlight has been watching your house for an hour.',
  },
  {
    id: 'split-satisfying',
    name: 'Split-Screen',
    subtitle: 'Top story + bottom loop',
    icon: 'vertical_split',
    format: 'splitscreen',
    visualStyle: 'Hyper-Realistic 4K',
    defaultTopic: 'Why Your Brain Craves Dopamine Detox',
    sampleHook:
      'Your attention span is being auctioned off to the highest bidder every single second. While the bottom half of this screen keeps your eyes locked, listen closely to how you can reclaim your focus in 48 hours.',
  },
];

const CAPTION_PRESETS: {
  id: CaptionStylePreset;
  name: string;
  sampleClass: string;
}[] = [
  {
    id: 'hormozi',
    name: 'Bold Gold',
    sampleClass: 'text-[#FFD60A] font-black drop-shadow-[0_2px_0_#000]',
  },
  {
    id: 'beast',
    name: 'Purple Pop',
    sampleClass: 'bg-[#7c4dff] text-white font-black px-2 py-0.5 rounded',
  },
  {
    id: 'neon',
    name: 'Neon Glow',
    sampleClass: 'text-white font-extrabold drop-shadow-[0_0_10px_#7c4dff]',
  },
  {
    id: 'minimal',
    name: 'Clean Pill',
    sampleClass: 'bg-black/70 text-[#e7e0e9] font-bold px-2.5 py-0.5 rounded-full',
  },
];

const VOICE_PERSONAS = [
  { id: 'Charon', name: 'Marcus', desc: 'Deep Baritone', rate: 1.02, pitch: 0.88 },
  { id: 'Fenrir', name: 'Atlas', desc: 'Calm & Stoic', rate: 0.96, pitch: 0.92 },
  { id: 'Puck', name: 'Liam', desc: 'Fast & Punchy', rate: 1.12, pitch: 1.02 },
  { id: 'Kore', name: 'Elena', desc: 'Clear Storyteller', rate: 1.04, pitch: 1.0 },
];

const BGM_TRACKS = [
  { id: 'dark-synth', name: 'Dark Synthwave', freq: 110, type: 'sawtooth' as OscillatorType },
  { id: 'lofi-focus', name: 'Lofi Chill Beats', freq: 146.83, type: 'sine' as OscillatorType },
  { id: 'cinematic-drone', name: 'Ambient Tension', freq: 82.41, type: 'triangle' as OscillatorType },
  { id: 'none', name: 'Voice Only (No Music)', freq: 0, type: 'sine' as OscillatorType },
];

export const FacelessReelsStudio: React.FC<FacelessReelsStudioProps> = ({
  settings,
  activeShort,
  onUpdateShort,
  onCreateNewShortInQueue,
  onNavigateToRender,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('mindset-loop');
  const [videoFormat, setVideoFormat] = useState<VideoFormatMode>('standard');
  const [topicPrompt, setTopicPrompt] = useState('');
  const [visualStyle, setVisualStyle] = useState('Dark Cinematic Stoic');
  const [selectedVoice, setSelectedVoice] = useState(VOICE_PERSONAS[0]);
  const [captionStyle, setCaptionStyle] = useState<CaptionStylePreset>('hormozi');
  const [selectedBgm, setSelectedBgm] = useState(BGM_TRACKS[0]);

  // Clean sub-tab inside customization panel so the user never sees a wall of controls
  const [editorSection, setEditorSection] = useState<'script' | 'style' | 'scenes'>('script');

  // Fake Text conversation messages state
  const [fakeTextMessages, setFakeTextMessages] = useState([
    { sender: 'them', text: 'Do not look out your bedroom window right now.' },
    { sender: 'me', text: 'Wait, who is this?? How did you get my number?' },
    { sender: 'them', text: 'I told you not to look. Someone is standing under the streetlight.' },
    { sender: 'me', text: 'You are freaking me out. Calling the police.' },
  ]);

  // Playback & Real-time 9:16 Canvas state
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isGeneratingReel, setIsGeneratingReel] = useState(false);
  const [isRewritingHook, setIsRewritingHook] = useState(false);
  const [generatingClipIndex, setGeneratingClipIndex] = useState<number | null>(null);
  const [isExportingWebm, setIsExportingWebm] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Video picker & custom video upload states
  const [selectedClipForVideoPicker, setSelectedClipForVideoPicker] = useState<number | null>(null);
  const [customVideoUrlInput, setCustomVideoUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeClipIndexForUpload, setActiveClipIndexForUpload] = useState<number>(0);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mainVideoRef = useRef<HTMLVideoElement | null>(null);
  const splitTopVideoRef = useRef<HTMLVideoElement | null>(null);
  const splitBottomVideoRef = useRef<HTMLVideoElement | null>(null);

  const totalDurationMs =
    activeShort.recipe.captionsTimeline.length > 0
      ? Math.max(
          activeShort.recipe.captionsTimeline[
            activeShort.recipe.captionsTimeline.length - 1
          ].endTimeMs,
          12000
        )
      : 45000;

  const startAmbientBgm = () => {
    stopAmbientBgm();
    if (selectedBgm.id === 'none' || selectedBgm.freq === 0) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = selectedBgm.type;
      osc.frequency.setValueAtTime(selectedBgm.freq, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(240, ctx.currentTime);

      const vol = Math.min(0.1, (settings.musicDuckingVolume / 100) * 0.22);
      gain.gain.setValueAtTime(vol, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      audioCtxRef.current = ctx;
      oscRef.current = osc;
    } catch {
      // Ignore WebAudio restriction errors
    }
  };

  const stopAmbientBgm = () => {
    try {
      oscRef.current?.stop();
      oscRef.current?.disconnect();
      oscRef.current = null;
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      stopAmbientBgm();
      return;
    }
    startAmbientBgm();
    const timer = window.setInterval(() => {
      setElapsedMs((prev) => {
        if (prev + 80 >= totalDurationMs) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 80;
      });
    }, 80);
    return () => {
      window.clearInterval(timer);
    };
  }, [isPlaying, totalDurationMs, selectedBgm]);

  const handleSelectTemplatePreset = (tpl: NicheTemplatePreset) => {
    setSelectedTemplateId(tpl.id);
    setVideoFormat(tpl.format);
    setVisualStyle(tpl.visualStyle);
    onUpdateShort({
      ...activeShort,
      title: tpl.defaultTopic,
      recipe: {
        ...activeShort.recipe,
        targetTopic: tpl.defaultTopic,
        voiceScript: tpl.sampleHook,
        captionsTimeline: buildCaptionsFromText(tpl.sampleHook),
      },
    });
    setElapsedMs(0);
  };

  // Rewrite hook in 1 click
  const handleQuickRewriteHook = async () => {
    if (isRewritingHook) return;
    setIsRewritingHook(true);
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
          onUpdateShort({
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
    } catch {
      // ignore
    } finally {
      setIsRewritingHook(false);
    }
  };

  const togglePlayReel = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      stopAmbientBgm();
      return;
    }

    setIsPlaying(true);

    if (activeShort.audioBase64) {
      const audio = new Audio(`data:audio/wav;base64,${activeShort.audioBase64}`);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.play().catch(() => {});
      return;
    }

    try {
      const res = await fetch('/api/pipeline/synthesize-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeShort.recipe.voiceScript,
          voiceName: selectedVoice.id,
          style: visualStyle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          onUpdateShort({ ...activeShort, audioBase64: data.audioBase64 });
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioPlayerRef.current = audio;
          audio.onended = () => setIsPlaying(false);
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback below
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeShort.recipe.voiceScript);
      utterance.rate = selectedVoice.rate;
      utterance.pitch = selectedVoice.pitch;
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      stopAmbientBgm();
    };
  }, []);

  const handleCreateFullAiReel = async () => {
    if (isGeneratingReel) return;
    setIsGeneratingReel(true);
    setIsPlaying(false);

    const customTopicText = topicPrompt.trim();
    const resolvedTitle =
      customTopicText || `5 Iron Rules of ${settings.niche} for Relentless Focus`;
    const fallbackVoiceScript = `Most people wake up reactive. The top one percent wake up with a system for ${resolvedTitle}. Rule number one: Control your first ten minutes, or the world controls your next sixteen hours. Strip the noise, anchor your breath, and command your attention before checking a single screen. Second, embrace voluntary difficulty. Comfort is the silent killer of ambition. Master your habits today, and you master your destiny.`;

    let recipe: VideoScriptRecipeJSON = {
      targetTopic: resolvedTitle,
      voiceScript: fallbackVoiceScript,
      bRollKeywords: [
        'roman statue dark lighting',
        'foggy mountain sunrise',
        'writing leather journal',
        'stormy ocean waves',
        'ancient temple columns',
      ],
      captionsTimeline: buildCaptionsFromText(fallbackVoiceScript),
    };

    try {
      const res = await fetch('/api/pipeline/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: settings.niche,
          toneOfVoice: settings.toneOfVoice,
          customTopic: customTopicText || undefined,
        }),
      });

      if (res.ok) {
        const apiRecipe = await res.json();
        if (apiRecipe && apiRecipe.voiceScript) {
          recipe = apiRecipe;
        }
      }
    } catch {
      // Deterministic local recipe fallback
    }

    try {
      const sentences = recipe.voiceScript
        .split(/(?<=[.?!])\s+/)
        .filter(Boolean)
        .slice(0, 4);
      if (sentences.length >= 2) {
        setFakeTextMessages(
          sentences.map((s, idx) => ({
            sender: idx % 2 === 0 ? 'them' : 'me',
            text: s,
          }))
        );
      }

      const newId = `reel-${Date.now()}`;
      const newClips: BRollClipItem[] = INITIAL_STOCK_CLIPS.map((c, idx) => {
        const poolPick =
          ALTERNATE_BROLL_POOL[
            (idx + Math.floor(Math.random() * 4)) % ALTERNATE_BROLL_POOL.length
          ];
        const kw = recipe.bRollKeywords[idx] || poolPick.keyword;
        return {
          ...c,
          id: `${newId}-clip-${idx + 1}`,
          keyword: kw,
          title: kw
            .split(' ')
            .slice(0, 2)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' '),
          thumbnailUrl: poolPick.thumbnailUrl,
          videoUrl: poolPick.videoUrl || c.videoUrl,
        };
      });

      const createdShort: QueuedShortItem = {
        id: newId,
        title: recipe.targetTopic,
        scheduledTime: 'Ready Now',
        dateLabel: 'Created Just Now',
        dayName: 'Now',
        dayNumber: 'AI',
        status: 'Ready to Upload',
        duration: '0:50',
        thumbnailUrl: newClips[0].thumbnailUrl,
        recipe,
        clips: newClips,
      };

      onCreateNewShortInQueue(createdShort);
      setTopicPrompt('');
      setElapsedMs(0);
    } finally {
      setIsGeneratingReel(false);
    }
  };

  const handleGenerateAiSceneForClip = async (clipIndex: number) => {
    if (generatingClipIndex !== null) return;
    setGeneratingClipIndex(clipIndex);
    const clip = activeShort.clips[clipIndex];
    const promptText =
      activeShort.recipe.bRollKeywords[clipIndex] ||
      clip?.keyword ||
      activeShort.title;

    try {
      const res = await fetch('/api/pipeline/generate-scene-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          visualStyle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.imageUrl) {
          const updatedClips = [...activeShort.clips];
          updatedClips[clipIndex] = {
            ...updatedClips[clipIndex],
            thumbnailUrl: data.imageUrl,
            title: promptText
              .split(' ')
              .slice(0, 2)
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
          };
          onUpdateShort({
            ...activeShort,
            clips: updatedClips,
            thumbnailUrl:
              clipIndex === 0 ? data.imageUrl : activeShort.thumbnailUrl,
          });
          setGeneratingClipIndex(null);
          return;
        }
      }
    } catch {
      // Fallback to cycling stock pool
    }

    const nextVisual =
      ALTERNATE_BROLL_POOL[
        (clipIndex + Math.floor(Math.random() * ALTERNATE_BROLL_POOL.length)) %
          ALTERNATE_BROLL_POOL.length
      ];
    const updatedClips = [...activeShort.clips];
    updatedClips[clipIndex] = {
      ...updatedClips[clipIndex],
      thumbnailUrl: nextVisual.thumbnailUrl,
      videoUrl: nextVisual.videoUrl || '',
      title: nextVisual.title,
    };
    onUpdateShort({
      ...activeShort,
      clips: updatedClips,
      thumbnailUrl:
        clipIndex === 0 ? nextVisual.thumbnailUrl : activeShort.thumbnailUrl,
    });
    setGeneratingClipIndex(null);
  };

  const handleSelectVideoForClip = (
    clipIndex: number,
    videoUrl: string,
    title?: string,
    thumb?: string
  ) => {
    const updatedClips = [...activeShort.clips];
    updatedClips[clipIndex] = {
      ...updatedClips[clipIndex],
      videoUrl,
      title: title || updatedClips[clipIndex].title,
      thumbnailUrl: thumb || updatedClips[clipIndex].thumbnailUrl,
    };
    onUpdateShort({
      ...activeShort,
      clips: updatedClips,
      thumbnailUrl: clipIndex === 0 && thumb ? thumb : activeShort.thumbnailUrl,
    });
    setSelectedClipForVideoPicker(null);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    handleSelectVideoForClip(
      activeClipIndexForUpload,
      blobUrl,
      file.name.replace(/\.[^/.]+$/, '').slice(0, 24)
    );
  };

  const handleDownloadRealRenderedVideo = async () => {
    if (isExportingWebm) return;
    setIsExportingWebm(true);
    setExportProgress(5);

    try {
      const canvas = exportCanvasRef.current;
      if (!canvas) throw new Error('Canvas not initialized');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2D context unavailable');

      // Pre-load all media elements (Video elements for clips with videoUrl, fallback Image)
      const loadedMedia = await Promise.all(
        activeShort.clips.map(
          (clip) =>
            new Promise<HTMLVideoElement | HTMLImageElement>((resolve) => {
              if (clip.videoUrl) {
                const vid = document.createElement('video');
                vid.crossOrigin = 'anonymous';
                vid.src = clip.videoUrl;
                vid.muted = true;
                vid.loop = true;
                vid.playsInline = true;
                vid.autoplay = true;
                vid.onloadeddata = () => {
                  vid.play().catch(() => {});
                  resolve(vid);
                };
                vid.onerror = () => {
                  const img = new Image();
                  img.crossOrigin = 'anonymous';
                  img.onload = () => resolve(img);
                  img.onerror = () => resolve(img);
                  img.src = clip.thumbnailUrl;
                };
                setTimeout(() => {
                  if (vid.readyState >= 2) resolve(vid);
                  else {
                    const img = new Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(img);
                    img.src = clip.thumbnailUrl;
                  }
                }, 2000);
              } else {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => resolve(img);
                img.onerror = () => resolve(img);
                img.src = clip.thumbnailUrl;
              }
            })
        )
      );

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const exportDurationMs = 9000;
      const frameIntervalMs = 33;
      let currentSimMs = 0;

      recorder.start();

      await new Promise<void>((resolve) => {
        const interval = window.setInterval(() => {
          currentSimMs += frameIntervalMs * 4;
          const progress = Math.min(1, currentSimMs / totalDurationMs);
          setExportProgress(
            Math.min(98, Math.round((currentSimMs / (exportDurationMs * 4)) * 100))
          );

          const cIdx = progress < 0.33 ? 0 : progress < 0.66 ? 1 : 2;
          const media = loadedMedia[cIdx] || loadedMedia[0];

          ctx.fillStyle = '#0f0d13';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (videoFormat === 'splitscreen') {
            const topMedia = loadedMedia[0];
            const botMedia = loadedMedia[1] || loadedMedia[0];
            if (topMedia) {
              ctx.drawImage(topMedia as any, 0, 0, canvas.width, canvas.height / 2);
            }
            if (botMedia) {
              ctx.drawImage(botMedia as any, 0, canvas.height / 2, canvas.width, canvas.height / 2);
            }
          } else if (media) {
            ctx.drawImage(media as any, 0, 0, canvas.width, canvas.height);
          }

          // Dark cinematic gradient overlay for readability
          const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
          grad.addColorStop(0, 'rgba(15,13,19,0.50)');
          grad.addColorStop(0.5, 'rgba(15,13,19,0.20)');
          grad.addColorStop(1, 'rgba(15,13,19,0.85)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Subtitles rendering on top of motion video
          const wordEntry =
            activeShort.recipe.captionsTimeline.find(
              (w) => currentSimMs >= w.startTimeMs && currentSimMs <= w.endTimeMs + 100
            ) ||
            activeShort.recipe.captionsTimeline[
              Math.min(
                Math.floor(progress * activeShort.recipe.captionsTimeline.length),
                activeShort.recipe.captionsTimeline.length - 1
              )
            ];

          const activeWord = (wordEntry?.word || 'FOCUS').toUpperCase();

          ctx.save();
          ctx.font = '900 70px "Roboto Flex", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 14;
          ctx.strokeStyle = '#000000';
          ctx.strokeText(activeWord, canvas.width / 2, canvas.height / 2);
          ctx.fillStyle =
            captionStyle === 'hormozi'
              ? '#FFD60A'
              : captionStyle === 'neon'
              ? '#cdbdff'
              : '#FFFFFF';
          ctx.fillText(activeWord, canvas.width / 2, canvas.height / 2);
          ctx.restore();

          if (currentSimMs >= exportDurationMs * 4) {
            window.clearInterval(interval);
            recorder.stop();
            resolve();
          }
        }, frameIntervalMs);
      });

      await new Promise<void>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${activeShort.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')}_motion_reel.webm`;
          a.click();
          URL.revokeObjectURL(url);
          resolve();
        };
      });
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExportingWebm(false);
      setExportProgress(0);
    }
  };

  const progressRatio = elapsedMs / totalDurationMs;
  const activeClipIndex = progressRatio < 0.33 ? 0 : progressRatio < 0.66 ? 1 : 2;
  const currentClip = activeShort.clips[activeClipIndex] || activeShort.clips[0];
  const secondarySplitClip =
    activeShort.clips[(activeClipIndex + 1) % activeShort.clips.length] ||
    activeShort.clips[0];

  const activeCaptionIndex = activeShort.recipe.captionsTimeline.findIndex(
    (c) => elapsedMs >= c.startTimeMs && elapsedMs <= c.endTimeMs + 90
  );
  const resolvedCaptionIndex =
    activeCaptionIndex !== -1
      ? activeCaptionIndex
      : Math.min(
          Math.floor(progressRatio * activeShort.recipe.captionsTimeline.length),
          Math.max(0, activeShort.recipe.captionsTimeline.length - 1)
        );

  const chunkStart = Math.floor(resolvedCaptionIndex / 3) * 3;
  const threeWordWindow = activeShort.recipe.captionsTimeline.slice(
    chunkStart,
    chunkStart + 3
  );

  const scriptWords = activeShort.recipe.voiceScript
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const estDurationSec = Math.max(10, Math.round((scriptWords / 155) * 60));

  return (
    <div className="flex flex-col w-full gap-6">
      <canvas
        ref={exportCanvasRef}
        width={720}
        height={1280}
        className="hidden pointer-events-none"
      />

      {/* STEP 1: SIMPLE TOPIC INPUT & 1-CLICK TEMPLATES */}
      <section className="rounded-3xl bg-[#1d1b21] p-5 sm:p-6 border border-white/[0.06] shadow-xl flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-[#cdbdff]">
            Step 1 • Pick a Template or Enter an Idea
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#e7e0e9]">
            What is your faceless reel about?
          </h1>
        </div>

        {/* Clean Prompt Input + Generate Button */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={topicPrompt}
            onChange={(e) => setTopicPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFullAiReel();
            }}
            placeholder="Type any topic (e.g., '3 Stoic Rules for Focus' or 'Psychology of Silence')..."
            className="flex-1 h-12 px-4 rounded-2xl bg-[#2b292f] text-sm text-[#e7e0e9] placeholder:text-[#948ea1] focus:outline-none focus:ring-2 focus:ring-[#7c4dff]"
          />
          <button
            type="button"
            onClick={handleCreateFullAiReel}
            disabled={isGeneratingReel}
            className="h-12 px-6 rounded-2xl bg-[#7c4dff] hover:bg-[#7c4dff]/90 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all shrink-0"
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                isGeneratingReel ? 'animate-spin' : 'icon-filled'
              }`}
            >
              {isGeneratingReel ? 'sync' : 'auto_awesome'}
            </span>
            <span>{isGeneratingReel ? 'Creating Reel...' : 'Generate Reel'}</span>
          </button>
        </div>

        {/* Clean 6 Template Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {NICHE_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplatePreset(tpl)}
                className={`p-3 rounded-2xl text-left flex items-center gap-2.5 transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[#7c4dff]/20 border-[#7c4dff] text-white'
                    : 'bg-[#211f25] border-transparent text-[#cac3d8] hover:bg-[#2b292f]'
                }`}
              >
                <span className="material-symbols-outlined text-[20px] text-[#cdbdff] shrink-0">
                  {tpl.icon}
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-[#e7e0e9] block truncate">
                    {tpl.name}
                  </span>
                  <span className="text-[10px] text-[#948ea1] block truncate">
                    {tpl.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* STEP 2: 2-COLUMN WORKSPACE (LEFT: 9:16 PREVIEW, RIGHT: CLEAN 3-TAB EDITOR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 cols): 9:16 Vertical Video Preview */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[350px] rounded-[28px] bg-[#1d1b21] p-3.5 border border-white/[0.08] shadow-2xl flex flex-col gap-3">
            {/* 9:16 Vertical Stage */}
            <div
              onClick={togglePlayReel}
              className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-[#0f0d13] cursor-pointer select-none group"
            >
              {/* Motion Video Layer */}
              {videoFormat === 'splitscreen' ? (
                <div className="w-full h-full flex flex-col">
                  <div className="relative w-full h-1/2 overflow-hidden border-b-2 border-[#7c4dff]">
                    {currentClip?.videoUrl ? (
                      <video
                        key={`top-${currentClip.videoUrl}`}
                        ref={splitTopVideoRef}
                        src={currentClip.videoUrl}
                        poster={currentClip.thumbnailUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={currentClip?.thumbnailUrl || activeShort.thumbnailUrl}
                        alt={currentClip?.title}
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-transform duration-1000 ${
                          isPlaying ? 'scale-110' : 'scale-100'
                        }`}
                      />
                    )}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-white uppercase tracking-wider backdrop-blur-sm z-10">
                      Story Scene
                    </span>
                  </div>
                  <div className="relative w-full h-1/2 overflow-hidden">
                    {secondarySplitClip?.videoUrl ? (
                      <video
                        key={`bot-${secondarySplitClip.videoUrl}`}
                        ref={splitBottomVideoRef}
                        src={secondarySplitClip.videoUrl}
                        poster={secondarySplitClip.thumbnailUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={secondarySplitClip?.thumbnailUrl || activeShort.thumbnailUrl}
                        alt="Kinetic Visual"
                        referrerPolicy="no-referrer"
                        className={`w-full h-full object-cover transition-transform duration-700 ${
                          isPlaying ? 'scale-125' : 'scale-105'
                        }`}
                      />
                    )}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/70 text-[#10b981] uppercase tracking-wider backdrop-blur-sm z-10">
                      Kinetic ASMR
                    </span>
                  </div>
                </div>
              ) : currentClip?.videoUrl ? (
                <video
                  key={`main-${currentClip.videoUrl}`}
                  ref={mainVideoRef}
                  src={currentClip.videoUrl}
                  poster={currentClip.thumbnailUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  crossOrigin="anonymous"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={currentClip?.thumbnailUrl || activeShort.thumbnailUrl}
                  alt={currentClip?.title || activeShort.title}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-transform duration-1000 ${
                    isPlaying ? 'scale-110' : 'scale-100'
                  }`}
                />
              )}

              {/* Real Motion Video Badge */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                <span>MOTION VIDEO • {activeClipIndex + 1}/3</span>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/45" />

              {/* Reddit Card Overlay */}
              {videoFormat === 'reddit' && (
                <div className="absolute inset-x-3 top-10 bg-[#1A1A1B]/95 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 shadow-2xl flex flex-col gap-2 pointer-events-none">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white">
                      r/AskReddit • u/StoicAnon
                    </span>
                    <span className="text-[#FF4500] text-[10px] font-bold">▲ 42.8k</span>
                  </div>
                  <p className="text-xs font-bold text-white leading-snug">
                    {activeShort.title}
                  </p>
                </div>
              )}

              {/* Fake Text Overlay */}
              {videoFormat === 'faketext' && (
                <div className="absolute inset-x-3 top-10 bg-black/75 backdrop-blur-md rounded-2xl p-3 border border-white/15 shadow-2xl flex flex-col gap-2 pointer-events-none">
                  {fakeTextMessages.map((msg, mIdx) => {
                    const isVisible = progressRatio >= mIdx * 0.2;
                    if (!isVisible) return null;
                    const isMe = msg.sender === 'me';
                    return (
                      <div
                        key={mIdx}
                        className={`max-w-[82%] px-3 py-1.5 rounded-2xl text-[11px] leading-snug ${
                          isMe
                            ? 'self-end bg-[#0B84FE] text-white'
                            : 'self-start bg-[#262629] text-white'
                        }`}
                      >
                        {msg.text}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Burned Subtitles */}
              <div
                className={`absolute inset-x-0 flex flex-col items-center justify-center px-5 text-center pointer-events-none ${
                  videoFormat === 'reddit' || videoFormat === 'faketext'
                    ? 'bottom-16'
                    : 'inset-y-0'
                }`}
              >
                <div className="flex flex-wrap items-center justify-center gap-2 max-w-full">
                  {threeWordWindow.map((wordObj, idx) => {
                    const globalIdx = chunkStart + idx;
                    const isCurrentWord = globalIdx === resolvedCaptionIndex;

                    if (captionStyle === 'hormozi') {
                      return (
                        <span
                          key={`${wordObj.word}-${wordObj.startTimeMs}`}
                          className={`text-2xl sm:text-3xl font-black uppercase tracking-wide transition-transform duration-100 drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] ${
                            isCurrentWord
                              ? 'text-[#FFD60A] scale-110'
                              : 'text-white/90'
                          }`}
                        >
                          {wordObj.word}
                        </span>
                      );
                    }

                    if (captionStyle === 'beast') {
                      return (
                        <span
                          key={`${wordObj.word}-${wordObj.startTimeMs}`}
                          className={`text-2xl sm:text-3xl font-black uppercase tracking-wider px-2 py-0.5 rounded-lg transition-all duration-100 ${
                            isCurrentWord
                              ? 'bg-[#7c4dff] text-white scale-105'
                              : 'text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]'
                          }`}
                        >
                          {wordObj.word}
                        </span>
                      );
                    }

                    if (captionStyle === 'neon') {
                      return (
                        <span
                          key={`${wordObj.word}-${wordObj.startTimeMs}`}
                          className={`text-2xl sm:text-3xl font-extrabold uppercase tracking-wider transition-all duration-100 ${
                            isCurrentWord
                              ? 'text-[#cdbdff] drop-shadow-[0_0_16px_rgba(124,77,255,1)]'
                              : 'text-white/80'
                          }`}
                        >
                          {wordObj.word}
                        </span>
                      );
                    }

                    return (
                      <span
                        key={`${wordObj.word}-${wordObj.startTimeMs}`}
                        className={`text-xl sm:text-2xl font-bold uppercase tracking-wide px-2.5 py-1 rounded-full transition-all ${
                          isCurrentWord
                            ? 'bg-white text-[#141218]'
                            : 'bg-black/60 text-white/85'
                        }`}
                      >
                        {wordObj.word}
                      </span>
                    );
                  })}
                </div>
              </div>

              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-14 h-14 rounded-full bg-[#7c4dff] text-white flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[32px] icon-filled">
                      play_arrow
                    </span>
                  </div>
                </div>
              )}

              {/* Bottom Progress Bar */}
              <div
                className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="range"
                  min={0}
                  max={totalDurationMs}
                  value={elapsedMs}
                  onChange={(e) => setElapsedMs(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none bg-white/30 accent-[#cdbdff] cursor-pointer"
                />
              </div>
            </div>

            {/* Simple Play & Download Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={togglePlayReel}
                className="h-11 rounded-xl bg-[#2b292f] hover:bg-[#36343a] text-[#e7e0e9] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-[#cdbdff] icon-filled">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
                <span>{isPlaying ? 'Pause' : 'Play Preview'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadRealRenderedVideo}
                disabled={isExportingWebm}
                className="h-11 rounded-xl bg-[#7c4dff] hover:bg-[#7c4dff]/90 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isExportingWebm ? 'animate-spin' : ''
                  }`}
                >
                  {isExportingWebm ? 'sync' : 'download'}
                </span>
                <span>
                  {isExportingWebm ? `Saving ${exportProgress}%` : 'Download Video'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Clean Tabbed Customization Card */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-3xl bg-[#1d1b21] p-5 sm:p-6 border border-white/[0.06] shadow-xl flex flex-col gap-5">
            {/* Step 2 Segmented Tab Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-sm font-bold text-[#e7e0e9]">
                Step 2 • Customize Your Reel
              </span>
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#141218]">
                {(
                  [
                    ['script', '1. Script & Voice'],
                    ['style', '2. Captions & Music'],
                    ['scenes', '3. Motion Videos'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setEditorSection(key)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      editorSection === key
                        ? 'bg-[#7c4dff] text-white shadow-sm'
                        : 'text-[#cac3d8] hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: SCRIPT & VOICE */}
            {editorSection === 'script' && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#cac3d8]">
                      Voiceover Script ({scriptWords} words • ~{estDurationSec}s)
                    </label>
                    <button
                      type="button"
                      onClick={handleQuickRewriteHook}
                      disabled={isRewritingHook}
                      className="text-xs font-semibold text-[#cdbdff] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span
                        className={`material-symbols-outlined text-[15px] ${
                          isRewritingHook ? 'animate-spin' : ''
                        }`}
                      >
                        autorenew
                      </span>
                      <span>
                        {isRewritingHook ? 'Rewriting...' : 'Rewrite Viral Hook with AI'}
                      </span>
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={activeShort.recipe.voiceScript}
                    onChange={(e) => {
                      const updatedText = e.target.value;
                      onUpdateShort({
                        ...activeShort,
                        recipe: {
                          ...activeShort.recipe,
                          voiceScript: updatedText,
                          captionsTimeline: buildCaptionsFromText(updatedText),
                        },
                      });
                    }}
                    className="w-full p-3.5 rounded-2xl bg-[#211f25] text-sm text-[#e7e0e9] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#7c4dff]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#cac3d8]">
                    Select AI Narrator Voice
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {VOICE_PERSONAS.map((voice) => {
                      const active = selectedVoice.id === voice.id;
                      return (
                        <button
                          key={voice.id}
                          type="button"
                          onClick={() => setSelectedVoice(voice)}
                          className={`p-3 rounded-2xl text-left flex flex-col gap-1 transition-all cursor-pointer border ${
                            active
                              ? 'bg-[#7c4dff]/20 border-[#7c4dff] text-white'
                              : 'bg-[#211f25] border-transparent text-[#cac3d8] hover:bg-[#2b292f]'
                          }`}
                        >
                          <span className="text-xs font-bold text-[#e7e0e9]">
                            {voice.name}
                          </span>
                          <span className="text-[11px] text-[#948ea1]">{voice.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: CAPTIONS & MUSIC */}
            {editorSection === 'style' && (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#cac3d8]">
                    Caption Style
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {CAPTION_PRESETS.map((preset) => {
                      const selected = captionStyle === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setCaptionStyle(preset.id)}
                          className={`p-3 rounded-2xl text-center flex flex-col items-center gap-2 transition-all cursor-pointer border ${
                            selected
                              ? 'bg-[#2b292f] border-[#7c4dff]'
                              : 'bg-[#211f25] border-transparent hover:bg-[#2b292f]'
                          }`}
                        >
                          <div className="h-8 w-full rounded-lg bg-[#0f0d13] flex items-center justify-center">
                            <span
                              className={`text-xs uppercase tracking-wider ${preset.sampleClass}`}
                            >
                              WORD
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-[#e7e0e9]">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-[#cac3d8]">
                    Background Music
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {BGM_TRACKS.map((track) => {
                      const isTrackActive = selectedBgm.id === track.id;
                      return (
                        <button
                          key={track.id}
                          type="button"
                          onClick={() => setSelectedBgm(track)}
                          className={`px-3.5 py-3 rounded-2xl text-xs font-semibold text-left flex items-center justify-between cursor-pointer border transition-colors ${
                            isTrackActive
                              ? 'bg-[#7c4dff]/20 border-[#7c4dff] text-white'
                              : 'bg-[#211f25] border-transparent text-[#cac3d8] hover:bg-[#2b292f]'
                          }`}
                        >
                          <span>{track.name}</span>
                          {isTrackActive && (
                            <span className="material-symbols-outlined text-[16px] text-[#cdbdff]">
                              check_circle
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MOTION VIDEO CLIPS */}
            {editorSection === 'scenes' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#e7e0e9] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#cdbdff]">
                        movie
                      </span>
                      Motion Video Clips ({activeShort.clips.length} Scenes)
                    </span>
                    <span className="text-[11px] text-[#948ea1]">
                      Real 9:16 vertical video footage with dynamic camera motion
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveClipIndexForUpload(0);
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#2b292f] hover:bg-[#36343a] text-xs font-semibold text-[#cdbdff] flex items-center gap-1.5 transition-colors cursor-pointer border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    <span>Upload Custom Video</span>
                  </button>
                </div>

                {/* 3 Scenes Grid with Video Preview & Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeShort.clips.map((clip, idx) => {
                    const isGenThis = generatingClipIndex === idx;
                    return (
                      <div
                        key={clip.id}
                        className="relative rounded-2xl overflow-hidden bg-[#211f25] border border-white/10 flex flex-col"
                      >
                        {/* Video / Preview Stage */}
                        <div className="relative aspect-[9/16] w-full bg-[#0f0d13] overflow-hidden">
                          {clip.videoUrl ? (
                            <video
                              src={clip.videoUrl}
                              poster={clip.thumbnailUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={clip.thumbnailUrl}
                              alt={clip.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40 pointer-events-none" />

                          {/* Top Tag */}
                          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                            <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-mono-code text-white font-bold">
                              Scene {idx + 1}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#10b981]/80 text-[9px] font-bold text-white uppercase tracking-wider backdrop-blur-sm">
                              Video
                            </span>
                          </div>

                          {/* Bottom Title */}
                          <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-0.5 pointer-events-none">
                            <span className="text-xs font-bold text-white truncate">
                              {clip.title}
                            </span>
                            <span className="text-[10px] text-[#cdbdff]/80 font-mono-code truncate">
                              {clip.keyword}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons for Scene */}
                        <div className="p-2.5 flex flex-col gap-1.5 bg-[#1d1b21] border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setSelectedClipForVideoPicker(idx)}
                            className="w-full py-1.5 rounded-xl bg-[#7c4dff] hover:bg-[#6c3df0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              video_library
                            </span>
                            <span>Choose Video</span>
                          </button>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveClipIndexForUpload(idx);
                                fileInputRef.current?.click();
                              }}
                              className="py-1 px-2 rounded-lg bg-[#2b292f] hover:bg-[#36343a] text-[11px] font-medium text-[#cac3d8] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Upload custom MP4/WebM video"
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                upload
                              </span>
                              <span>Upload</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleGenerateAiSceneForClip(idx)}
                              disabled={isGenThis}
                              className="py-1 px-2 rounded-lg bg-[#2b292f] hover:bg-[#36343a] text-[11px] font-medium text-[#cac3d8] flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              title="Cycle to next motion video"
                            >
                              <span
                                className={`material-symbols-outlined text-[14px] ${
                                  isGenThis ? 'animate-spin' : ''
                                }`}
                              >
                                {isGenThis ? 'sync' : 'shuffle'}
                              </span>
                              <span>Cycle</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3 Bottom Primary CTA */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#e7e0e9]">
                  Step 3 • Ready to Post?
                </span>
                <span className="text-[11px] text-[#948ea1]">
                  Renders 1080x1920 MP4 &amp; uploads to {settings.youtubeChannelHandle}
                </span>
              </div>
              <button
                type="button"
                onClick={onNavigateToRender}
                className="h-11 px-5 rounded-full bg-[#7c4dff] hover:bg-[#7c4dff]/90 text-white text-xs font-bold flex items-center gap-2 shadow-lg cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">
                  rocket_launch
                </span>
                <span>Auto-Render &amp; Post to YouTube</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input for Custom Video Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
        className="hidden"
        onChange={handleCustomFileUpload}
      />

      {/* Motion Video Library Picker Modal */}
      {selectedClipForVideoPicker !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedClipForVideoPicker(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-3xl bg-[#1d1b21] border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-left max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#7c4dff]/20 text-[#cdbdff] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">movie</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#e7e0e9]">
                    Select Motion Video for Scene {selectedClipForVideoPicker + 1}
                  </h3>
                  <p className="text-xs text-[#948ea1]">
                    Pick from verified 9:16 vertical motion video footage or paste a custom link
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClipForVideoPicker(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#cac3d8] flex items-center justify-center cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Custom URL Input Bar */}
            <div className="flex gap-2">
              <input
                type="url"
                value={customVideoUrlInput}
                onChange={(e) => setCustomVideoUrlInput(e.target.value)}
                placeholder="Or paste direct video URL (.mp4 or .webm)..."
                className="flex-1 h-10 px-3.5 rounded-xl bg-[#26242a] text-xs text-white placeholder:text-[#948ea1] focus:outline-none focus:ring-2 focus:ring-[#7c4dff]"
              />
              <button
                type="button"
                disabled={!customVideoUrlInput.trim()}
                onClick={() => {
                  if (customVideoUrlInput.trim()) {
                    handleSelectVideoForClip(
                      selectedClipForVideoPicker,
                      customVideoUrlInput.trim(),
                      'Custom Web Video'
                    );
                    setCustomVideoUrlInput('');
                  }
                }}
                className="h-10 px-4 rounded-xl bg-[#7c4dff] hover:bg-[#6c3df0] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
              >
                <span>Apply Link</span>
              </button>
            </div>

            {/* Grid of Verified Motion Video Presets */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              <span className="text-xs font-semibold text-[#cdbdff] uppercase tracking-wider">
                Verified Royalty-Free Motion Video Loops
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {VIRAL_MOTION_VIDEOS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      handleSelectVideoForClip(
                        selectedClipForVideoPicker,
                        preset.videoUrl,
                        preset.title,
                        preset.thumbnailUrl
                      )
                    }
                    className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-[#0f0d13] border border-white/10 hover:border-[#7c4dff] transition-all cursor-pointer group text-left"
                  >
                    <video
                      src={preset.videoUrl}
                      poster={preset.thumbnailUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 p-2 flex flex-col justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 text-[9px] font-bold text-[#10b981] uppercase tracking-wider w-fit">
                        {preset.category}
                      </span>
                      <span className="text-xs font-bold text-white line-clamp-2 leading-tight">
                        {preset.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
