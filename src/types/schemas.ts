export interface CaptionWordJSON {
  word: string;
  startTimeMs: number;
  endTimeMs: number;
}

export interface VideoScriptRecipeJSON {
  targetTopic: string;
  voiceScript: string;
  bRollKeywords: string[];
  captionsTimeline: CaptionWordJSON[];
}

export interface AppSettingsJSON {
  niche: string;
  frequencyPerDay: number;
  toneOfVoice: string;
  pexelsApiKey: string;
  lastRunTimestamp: number;
  autoPilotEnabled: boolean;
  musicDuckingVolume: number;
  autoDuckingEnabled: boolean;
  youtubeChannelConnected: boolean;
  youtubeChannelHandle: string;
}

export interface BRollClipItem {
  id: string;
  index: number;
  title: string;
  keyword: string;
  timeRange: string;
  thumbnailUrl: string;
  videoUrl: string;
  durationSec: number;
  accentColor: 'primary' | 'tertiary' | 'secondary';
}

export interface QueuedShortItem {
  id: string;
  title: string;
  scheduledTime: string;
  dateLabel: string;
  dayNumber: string;
  dayName: string;
  status: 'Ready to Upload' | 'Scheduled' | 'Ready for Review' | 'Published' | 'Rendering';
  duration: string;
  views?: string;
  thumbnailUrl: string;
  recipe: VideoScriptRecipeJSON;
  clips: BRollClipItem[];
  audioBase64?: string;
  youtubeVideoId?: string;
}

export interface PipelineStepState {
  stepNumber: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  status: 'completed' | 'active' | 'pending' | 'error';
  durationText?: string;
  progressPercent?: number;
}

export interface TerminalLogEntry {
  id: string;
  timestamp: string;
  tag: 'INIT' | 'INFO' | 'PEXELS' | 'TTS' | 'FFMPEG' | 'STATUS' | 'UPLOAD' | 'ERROR';
  message: string;
}

export const INITIAL_STOCK_CLIPS: BRollClipItem[] = [
  {
    id: 'clip-1',
    index: 1,
    title: 'Ocean Coastal Waves',
    keyword: 'aerial ocean waves rolling dark',
    timeRange: '0:00 - 0:06',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAP4VmTRFUyL4B02ibTon7DXhnrKALR3nP_LB0GVuRxlLGaOi9V1Qdu9oZk_wfWCILwNHi7TXpk7_KkiqggY4WjQu_HXqZ1SwmPsO0-xvRa1kZw1-SOdw12Cj_3Z6v6Vn98uqVPtHoTmk91pYl3arHIh4-0VJ8uzE8Leitr9scexn_tSViET0Q7ONrXlFrzNXIgVqrENsMNeEdyIjraP9jvkXg-4bTYobe7o_RrCguVUhyOZSmGqdDG',
    videoUrl: '/videos/ocean_waves.mp4',
    durationSec: 6,
    accentColor: 'primary',
  },
  {
    id: 'clip-2',
    index: 2,
    title: 'Night Skyline Timelapse',
    keyword: 'night city earth lights timelapse',
    timeRange: '0:06 - 0:12',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCP46S9VmnZlYQoLLJ2Wy7gxtLRISTRWG_SEc2wU1ydX76fzAUjjMCsU35eAkd4lLH6yoQFo7uTLdrgeCIfc_8n9rjodB1ucYB94sfawsLzBxoRUBXBOYUh4W0dKRDkvDabOUGnzEKHnrhYdebhwpM7tuIUcXjr571zOHn2DNWfHjNE8Qb77bDa38eIAVKcmEiYAL1R3Yfas_QO9mI9DAEi62yirupeeSzpIZWz1xRuDBdqp7Saho7o',
    videoUrl: '/videos/city_timelapse.mp4',
    durationSec: 6,
    accentColor: 'tertiary',
  },
  {
    id: 'clip-3',
    index: 3,
    title: 'Fiery Combustion Front',
    keyword: 'flame fire slow motion channel',
    timeRange: '0:12 - 0:18',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC8xT35mUKIr0va0He0MbdvOXcOfRKQ9BcnT0mxzmoSLk_JXGkUaWQSA62qmFXidbSUPVNJpy7ulSp1Q7EOmwxOPDYv5O1d5nyihMZzTp1Adum6OjEtwLnobwo4i_knH_eO8XARotdoOrcQjtQysw13XeVMnt_gmZoq5GmAsPmvihkZSfRSFYgUc8g_CbYi04zEE9UZ4NWpwIXVfIE8ZsBxXWLC4qA0qOr9TzzO8Y-hVpk61rk5p5Jw',
    videoUrl: '/videos/fire_ember.mp4',
    durationSec: 6,
    accentColor: 'secondary',
  },
];

export const ALTERNATE_BROLL_POOL: Omit<BRollClipItem, 'id' | 'index' | 'timeRange' | 'accentColor'>[] = [
  {
    title: 'Infinite Fractal Zoom',
    keyword: 'hypnotic mandelbrot infinite zoom',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDmfgCbDGkYzhxybTyyiK4s2q0YJpSE8zX8cUmT67BCqXd76YwsRBwJpzcEQrBkKw-agZfdDkpdkOHKCJUqfPnjzChKBWW7e37WAcq9sBzRTjnCKciwgI0udMi2lUyvEzygvPyBl_5GNG9SPh9tDQF3JzdnlSeiii2T7-T482dgLT0hsGOLTCSiTLGqFMc-2kO4TTfZ6eA8pTDR2gDKp___QpOpplGrkv7k3_XCmz7cnWR7Rb7Mehyx',
    videoUrl: '/videos/fractal_hypnotic.mp4',
    durationSec: 6,
  },
  {
    title: 'Deep Space Cosmic Nebula',
    keyword: 'deep space black hole galaxy',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBryVTOOKbK_Wy9GLaAmfOiqttGDgiSJ1Bqf4aA9iUbMNSlhBBiUz7l49-LuW4W0Y9q5mVNbJ03EDa1jfVvkjlADbet9-sRM_-e0Ge7DZRGjcGho8HhFy-tYAj5jY4kCk1dFg6HpQqvhQAKgw6DjjbiGBUyOZThOjR8gk9K5u49fhdMQpvcF5Vyude1R2m0NRdBXqq_-gY8vVUqNaCty-XLOtx3UrTLn9fbDUfISz4T7gy3KYmxYQnF',
    videoUrl: '/videos/space_galaxy.mp4',
    durationSec: 6,
  },
  {
    title: 'Misty Canyon Waterfall',
    keyword: 'cascade waterfall forest stream',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDvoU5v9lNTPrtOP98NRMSF1HsAhhCcl-rz8EGDYksj2w87QS2jMpiNvGEuVnogP0p029wr86g0MVxukpeWxj6UZpe3EAvDsnxnio3KTfgtXHfXXg1wmJLA5llTleygPs_zXGkm_FE3yTvHUG8xLnHXkymwvWDVNYVTrph6YPADsfCvOUgq3NTnfAzyT3gPHS29ukILRqfzqTX0b64X54484R2-UnM8f-Ry1NMvpKdnA2QZ7gJWhRpd',
    videoUrl: '/videos/waterfall_mist.mp4',
    durationSec: 6,
  },
  {
    title: 'Heavy Rain Storm',
    keyword: 'heavy rain storm city street',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDSFT6_ncM6gmHCQoDRVemvRG5RyqxusrUpxx_x90yg1-6ed6CuYrRKGtMAO6nRtVrz9IWxs7pCK9q-hnrA8sfkA6mbOxJDSvhtyvCDmk3w2Nmb-iieJmJumDJtLPTxbqs5QwI2YI-M71svOait-Fr35xQ1SF8j00ukX2-Oylo6xndxVV9LikX76VXJr7hCxv5mYbQiRK_Q68OSItJ_ChHR7NE9yPSLw24Fa1Q3Lyo9VLnAI37dPLW0',
    videoUrl: '/videos/rain_atmosphere.mp4',
    durationSec: 6,
  },
  {
    title: 'Satisfying Kinetic Fluid',
    keyword: 'fluid simulation swirling loop',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDmfgCbDGkYzhxybTyyiK4s2q0YJpSE8zX8cUmT67BCqXd76YwsRBwJpzcEQrBkKw-agZfdDkpdkOHKCJUqfPnjzChKBWW7e37WAcq9sBzRTjnCKciwgI0udMi2lUyvEzygvPyBl_5GNG9SPh9tDQF3JzdnlSeiii2T7-T482dgLT0hsGOLTCSiTLGqFMc-2kO4TTfZ6eA8pTDR2gDKp___QpOpplGrkv7k3_XCmz7cnWR7Rb7Mehyx',
    videoUrl: '/videos/kinetic_fluid.mp4',
    durationSec: 6,
  },
];

export interface MotionVideoPreset {
  id: string;
  title: string;
  category: 'Cinematic' | 'Satisfying' | 'Nature' | 'Sci-Fi' | 'Elements';
  videoUrl: string;
  thumbnailUrl: string;
}

export const VIRAL_MOTION_VIDEOS: MotionVideoPreset[] = [
  {
    id: 'vid-ocean-waves',
    title: 'Ocean Coastal Drone Waves',
    category: 'Nature',
    videoUrl: '/videos/ocean_waves.mp4',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAP4VmTRFUyL4B02ibTon7DXhnrKALR3nP_LB0GVuRxlLGaOi9V1Qdu9oZk_wfWCILwNHi7TXpk7_KkiqggY4WjQu_HXqZ1SwmPsO0-xvRa1kZw1-SOdw12Cj_3Z6v6Vn98uqVPtHoTmk91pYl3arHIh4-0VJ8uzE8Leitr9scexn_tSViET0Q7ONrXlFrzNXIgVqrENsMNeEdyIjraP9jvkXg-4bTYobe7o_RrCguVUhyOZSmGqdDG',
  },
  {
    id: 'vid-night-timelapse',
    title: 'Glowing Earth & City Lights',
    category: 'Cinematic',
    videoUrl: '/videos/city_timelapse.mp4',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCP46S9VmnZlYQoLLJ2Wy7gxtLRISTRWG_SEc2wU1ydX76fzAUjjMCsU35eAkd4lLH6yoQFo7uTLdrgeCIfc_8n9rjodB1ucYB94sfawsLzBxoRUBXBOYUh4W0dKRDkvDabOUGnzEKHnrhYdebhwpM7tuIUcXjr571zOHn2DNWfHjNE8Qb77bDa38eIAVKcmEiYAL1R3Yfas_QO9mI9DAEi62yirupeeSzpIZWz1xRuDBdqp7Saho7o',
  },
  {
    id: 'vid-fire-channel',
    title: 'Slow-Mo Combustion Flame',
    category: 'Elements',
    videoUrl: '/videos/fire_ember.mp4',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC8xT35mUKIr0va0He0MbdvOXcOfRKQ9BcnT0mxzmoSLk_JXGkUaWQSA62qmFXidbSUPVNJpy7ulSp1Q7EOmwxOPDYv5O1d5nyihMZzTp1Adum6OjEtwLnobwo4i_knH_eO8XARotdoOrcQjtQysw13XeVMnt_gmZoq5GmAsPmvihkZSfRSFYgUc8g_CbYi04zEE9UZ4NWpwIXVfIE8ZsBxXWLC4qA0qOr9TzzO8Y-hVpk61rk5p5Jw',
  },
  {
    id: 'vid-fractal-zoom',
    title: 'Hypnotic Infinite Fractal Zoom',
    category: 'Satisfying',
    videoUrl: '/videos/fractal_hypnotic.mp4',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDmfgCbDGkYzhxybTyyiK4s2q0YJpSE8zX8cUmT67BCqXd76YwsRBwJpzcEQrBkKw-agZfdDkpdkOHKCJUqfPnjzChKBWW7e37WAcq9sBzRTjnCKciwgI0udMi2lUyvEzygvPyBl_5GNG9SPh9tDQF3JzdnlSeiii2T7-T482dgLT0hsGOLTCSiTLGqFMc-2kO4TTfZ6eA8pTDR2gDKp___QpOpplGrkv7k3_XCmz7cnWR7Rb7Mehyx',
  },
  {
    id: 'vid-black-hole',
    title: 'Deep Space Cosmic Nebula',
    category: 'Sci-Fi',
    videoUrl: '/videos/space_galaxy.mp4',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBryVTOOKbK_Wy9GLaAmfOiqttGDgiSJ1Bqf4aA9iUbMNSlhBBiUz7l49-LuW4W0Y9q5mVNbJ03EDa1jfVvkjlADbet9-sRM_-e0Ge7DZRGjcGho8HhFy-tYAj5jY4kCk1dFg6HpQqvhQAKgw6DjjbiGBUyOZThOjR8gk9K5u49fhdMQpvcF5Vyude1R2m0NRdBXqq_-gY8vVUqNaCty-XLOtx3UrTLn9fbDUfISz4T7gy3KYmxYQnF',
  },
  {
    id: 'vid-cascade-water',
    title: 'Misty Canyon Waterfall Stream',
    category: 'Nature',
    videoUrl: '/videos/waterfall_mist.mp4',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDvoU5v9lNTPrtOP98NRMSF1HsAhhCcl-rz8EGDYksj2w87QS2jMpiNvGEuVnogP0p029wr86g0MVxukpeWxj6UZpe3EAvDsnxnio3KTfgtXHfXXg1wmJLA5llTleygPs_zXGkm_FE3yTvHUG8xLnHXkymwvWDVNYVTrph6YPADsfCvOUgq3NTnfAzyT3gPHS29ukILRqfzqTX0b64X54484R2-UnM8f-Ry1NMvpKdnA2QZ7gJWhRpd',
  },
  {
    id: 'vid-rain-storm',
    title: 'Heavy Rain Storm Streets',
    category: 'Cinematic',
    videoUrl: '/videos/rain_atmosphere.mp4',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDSFT6_ncM6gmHCQoDRVemvRG5RyqxusrUpxx_x90yg1-6ed6CuYrRKGtMAO6nRtVrz9IWxs7pCK9q-hnrA8sfkA6mbOxJDSvhtyvCDmk3w2Nmb-iieJmJumDJtLPTxbqs5QwI2YI-M71svOait-Fr35xQ1SF8j00ukX2-Oylo6xndxVV9LikX76VXJr7hCxv5mYbQiRK_Q68OSItJ_ChHR7NE9yPSLw24Fa1Q3Lyo9VLnAI37dPLW0',
  },
  {
    id: 'vid-fluid-sim',
    title: 'Swirling Kinetic ASMR Fluid',
    category: 'Satisfying',
    videoUrl: '/videos/kinetic_fluid.mp4',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDmfgCbDGkYzhxybTyyiK4s2q0YJpSE8zX8cUmT67BCqXd76YwsRBwJpzcEQrBkKw-agZfdDkpdkOHKCJUqfPnjzChKBWW7e37WAcq9sBzRTjnCKciwgI0udMi2lUyvEzygvPyBl_5GNG9SPh9tDQF3JzdnlSeiii2T7-T482dgLT0hsGOLTCSiTLGqFMc-2kO4TTfZ6eA8pTDR2gDKp___QpOpplGrkv7k3_XCmz7cnWR7Rb7Mehyx',
  },
];

export function buildCaptionsFromText(text: string): CaptionWordJSON[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  let t = 0;
  return words.map((w) => {
    const dur = Math.max(220, Math.min(540, w.length * 52 + 130));
    const item = { word: w, startTimeMs: t, endTimeMs: t + dur };
    t += dur + 30;
    return item;
  });
}

const DEFAULT_SCRIPT =
  'Most people wake up reactive. Marcus Aurelius woke up ready. Rule number one: Control your morning, or the morning controls you. Strip the noise, anchor your breath, and command your thoughts before the world takes the wheel. Second, practice voluntary hardship. Comfort is the silent killer of ambition. Third, guard your attention like royal treasure. Master your mind, and you master your destiny.';

export const INITIAL_QUEUE_ITEMS: QueuedShortItem[] = [
  {
    id: 'short-1',
    title: '5 Daily Habits of Marcus Aurelius',
    scheduledTime: 'Today at 5:00 PM EST',
    dateLabel: 'Monday, Oct 28 • 5:00 PM',
    dayName: 'Mon',
    dayNumber: '28',
    status: 'Ready to Upload',
    duration: '0:48',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAP4VmTRFUyL4B02ibTon7DXhnrKALR3nP_LB0GVuRxlLGaOi9V1Qdu9oZk_wfWCILwNHi7TXpk7_KkiqggY4WjQu_HXqZ1SwmPsO0-xvRa1kZw1-SOdw12Cj_3Z6v6Vn98uqVPtHoTmk91pYl3arHIh4-0VJ8uzE8Leitr9scexn_tSViET0Q7ONrXlFrzNXIgVqrENsMNeEdyIjraP9jvkXg-4bTYobe7o_RrCguVUhyOZSmGqdDG',
    recipe: {
      targetTopic: '5 Daily Habits of Marcus Aurelius',
      voiceScript: DEFAULT_SCRIPT,
      bRollKeywords: [
        'roman statue dark lighting',
        'foggy mountain sunrise',
        'writing leather journal',
        'ancient stoic temple',
        'dramatic ocean waves',
      ],
      captionsTimeline: buildCaptionsFromText(DEFAULT_SCRIPT),
    },
    clips: INITIAL_STOCK_CLIPS,
  },
  {
    id: 'short-2',
    title: 'Why 99% Fail in 20s',
    scheduledTime: 'Tuesday, Oct 29 • 12:30 PM',
    dateLabel: 'Tuesday, Oct 29 • 12:30 PM',
    dayName: 'Tue',
    dayNumber: '29',
    status: 'Ready for Review',
    duration: '0:54',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDmfgCbDGkYzhxybTyyiK4s2q0YJpSE8zX8cUmT67BCqXd76YwsRBwJpzcEQrBkKw-agZfdDkpdkOHKCJUqfPnjzChKBWW7e37WAcq9sBzRTjnCKciwgI0udMi2lUyvEzygvPyBl_5GNG9SPh9tDQF3JzdnlSeiii2T7-T482dgLT0hsGOLTCSiTLGqFMc-2kO4TTfZ6eA8pTDR2gDKp___QpOpplGrkv7k3_XCmz7cnWR7Rb7Mehyx',
    recipe: {
      targetTopic: 'Why 99% Fail in Their 20s (Stoic Truth)',
      voiceScript:
        'Your twenties are not for comfort. They are the forge where your character is hammered into steel. Ninety-nine percent of people trade their sharpest decade for cheap dopamine, endless scrolling, and weekend escapes. Seneca warned us two thousand years ago: it is not that we have a short time to live, but that we waste a lot of it. Build in silence while they sleep.',
      bRollKeywords: [
        'ancient greek marble statue',
        'dark rainy city street',
        'man training discipline',
        'hourglass sand falling',
        'mountain peak clouds',
      ],
      captionsTimeline: buildCaptionsFromText(
        'Your twenties are not for comfort. They are the forge where your character is hammered into steel. Ninety-nine percent of people trade their sharpest decade for cheap dopamine, endless scrolling, and weekend escapes. Seneca warned us two thousand years ago: it is not that we have a short time to live, but that we waste a lot of it. Build in silence while they sleep.'
      ),
    },
    clips: [
      {
        ...INITIAL_STOCK_CLIPS[0],
        id: 'clip-2-1',
        title: 'Stoic Marble',
        thumbnailUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDmfgCbDGkYzhxybTyyiK4s2q0YJpSE8zX8cUmT67BCqXd76YwsRBwJpzcEQrBkKw-agZfdDkpdkOHKCJUqfPnjzChKBWW7e37WAcq9sBzRTjnCKciwgI0udMi2lUyvEzygvPyBl_5GNG9SPh9tDQF3JzdnlSeiii2T7-T482dgLT0hsGOLTCSiTLGqFMc-2kO4TTfZ6eA8pTDR2gDKp___QpOpplGrkv7k3_XCmz7cnWR7Rb7Mehyx',
      },
      INITIAL_STOCK_CLIPS[1],
      INITIAL_STOCK_CLIPS[2],
    ],
  },
  {
    id: 'short-3',
    title: 'The Science of Dopamine Fasting',
    scheduledTime: 'Wednesday, Oct 30 • 6:15 PM',
    dateLabel: 'Wednesday, Oct 30 • 6:15 PM',
    dayName: 'Wed',
    dayNumber: '30',
    status: 'Scheduled',
    duration: '0:51',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCP46S9VmnZlYQoLLJ2Wy7gxtLRISTRWG_SEc2wU1ydX76fzAUjjMCsU35eAkd4lLH6yoQFo7uTLdrgeCIfc_8n9rjodB1ucYB94sfawsLzBxoRUBXBOYUh4W0dKRDkvDabOUGnzEKHnrhYdebhwpM7tuIUcXjr571zOHn2DNWfHjNE8Qb77bDa38eIAVKcmEiYAL1R3Yfas_QO9mI9DAEi62yirupeeSzpIZWz1xRuDBdqp7Saho7o',
    recipe: {
      targetTopic: 'The Science of Dopamine Fasting',
      voiceScript:
        'When everything feels boring, your brain is not broken—it is overstimulated. Every notification, sugar spike, and algorithmic swipe floods your baseline dopamine until hard work feels impossible. Resetting your receptors takes seventy-two hours of radical stillness. Embrace boredom, and watch your drive return tenfold.',
      bRollKeywords: [
        'midnight city lights portrait',
        'neural network abstract',
        'meditation dark room',
        'forest rain drops',
        'focused writing desk',
      ],
      captionsTimeline: buildCaptionsFromText(
        'When everything feels boring, your brain is not broken—it is overstimulated. Every notification, sugar spike, and algorithmic swipe floods your baseline dopamine until hard work feels impossible. Resetting your receptors takes seventy-two hours of radical stillness. Embrace boredom, and watch your drive return tenfold.'
      ),
    },
    clips: INITIAL_STOCK_CLIPS,
  },
  {
    id: 'short-4',
    title: 'Deep Space Mysteries #9',
    scheduledTime: 'Published Yesterday',
    dateLabel: 'Sunday, Oct 27 • 5:00 PM',
    dayName: 'Sun',
    dayNumber: '27',
    status: 'Published',
    duration: '0:52',
    views: '18.4K views',
    youtubeVideoId: 'dQw4w9WgXcQ',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBryVTOOKbK_Wy9GLaAmfOiqttGDgiSJ1Bqf4aA9iUbMNSlhBBiUz7l49-LuW4W0Y9q5mVNbJ03EDa1jfVvkjlADbet9-sRM_-e0Ge7DZRGjcGho8HhFy-tYAj5jY4kCk1dFg6HpQqvhQAKgw6DjjbiGBUyOZThOjR8gk9K5u49fhdMQpvcF5Vyude1R2m0NRdBXqq_-gY8vVUqNaCty-XLOtx3UrTLn9fbDUfISz4T7gy3KYmxYQnF',
    recipe: {
      targetTopic: 'Deep Space Mysteries #9: Ton 618',
      voiceScript:
        'At the edge of the observable universe sits an ultramassive black hole so large it defies modern physics. Ton 618 holds the mass of sixty-six billion suns. Eleven solar systems could sit side by side inside its event horizon, and its accretion disk shines brighter than a hundred trillion stars.',
      bRollKeywords: [
        'black hole accretion disk',
        'deep space nebula',
        'galaxy stars rotation',
        'astronaut helmet reflection',
        'cosmic dust clouds',
      ],
      captionsTimeline: buildCaptionsFromText(
        'At the edge of the observable universe sits an ultramassive black hole so large it defies modern physics. Ton 618 holds the mass of sixty-six billion suns. Eleven solar systems could sit side by side inside its event horizon, and its accretion disk shines brighter than a hundred trillion stars.'
      ),
    },
    clips: INITIAL_STOCK_CLIPS,
  },
];
