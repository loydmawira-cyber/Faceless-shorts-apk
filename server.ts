import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Helper to build timed captions from a script string
function generateTimedCaptionsFromScript(script: string) {
  const words = script
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  let currentTimeMs = 0;
  return words.map((word) => {
    const cleanLen = word.replace(/[^a-zA-Z0-9]/g, "").length;
    const durationMs = Math.max(220, Math.min(580, cleanLen * 55 + 140));
    const item = {
      word,
      startTimeMs: currentTimeMs,
      endTimeMs: currentTimeMs + durationMs,
    };
    currentTimeMs += durationMs + 35;
    return item;
  });
}

function buildFallbackRecipe(topicInput?: string, niche = "Motivation & Mindset") {
  const targetTopic =
    topicInput && topicInput.trim().length > 0
      ? topicInput.trim()
      : `5 Iron Rules of ${niche} for Unbreakable Focus`;
  const voiceScript = `Most people wake up reactive. The top one percent wake up with a system for ${targetTopic}. Rule number one: Control your first ten minutes, or the world controls your next sixteen hours. Strip the noise, anchor your breath, and command your attention before checking a single screen. Second, embrace voluntary difficulty. Comfort is the silent killer of ambition. Master your habits today, and you master your destiny.`;
  return {
    targetTopic,
    voiceScript,
    bRollKeywords: [
      "roman statue dark lighting",
      "foggy mountain sunrise",
      "writing leather journal",
      "stormy ocean waves",
      "ancient temple columns",
    ],
    captionsTimeline: generateTimedCaptionsFromScript(voiceScript),
  };
}

// Step 1: AI Script Generation returning strict VideoScriptRecipeJSON
app.post("/api/pipeline/generate-script", async (req, res) => {
  const { niche = "Motivation & Mindset", toneOfVoice = "Cinematic & Deep", customTopic } = req.body || {};
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.json(buildFallbackRecipe(customTopic, niche));
    }

    const prompt = `Generate a high-retention 50-second YouTube Shorts script in the "${niche}" niche with a "${toneOfVoice}" tone of voice.${
      customTopic ? ` Specifically focus on the topic: "${customTopic}".` : ""
    }
Output strictly as JSON matching VideoScriptRecipeJSON:
- targetTopic: Catchy viral YouTube Short title (under 65 chars).
- voiceScript: Spoken narration script of ~110 to 130 words (~48 seconds when read aloud), starting with a strong 3-second viral hook.
- bRollKeywords: Exactly 5 visual vertical B-roll search keywords suitable for Pexels stock video search.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an autonomous YouTube Shorts script engine. Always return valid JSON with targetTopic, voiceScript, and 5 bRollKeywords.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            targetTopic: {
              type: Type.STRING,
              description: "The viral title/topic of the short video.",
            },
            voiceScript: {
              type: Type.STRING,
              description: "The spoken 50-second narration script (~120 words).",
            },
            bRollKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Exactly 5 targeted B-Roll search keywords for Pexels.",
            },
          },
          required: ["targetTopic", "voiceScript", "bRollKeywords"],
        },
      },
    });

    const rawText = response.text || "{}";
    const parsed = JSON.parse(rawText);

    const bRollKeywords = Array.isArray(parsed.bRollKeywords)
      ? parsed.bRollKeywords.slice(0, 5)
      : ["cinematic dark statue", "morning fog forest", "writing notebook", "night city lights", "hourglass sand"];
    while (bRollKeywords.length < 5) {
      bRollKeywords.push("cinematic vertical atmosphere");
    }

    const voiceScript =
      parsed.voiceScript || buildFallbackRecipe(customTopic, niche).voiceScript;

    return res.json({
      targetTopic: parsed.targetTopic || customTopic || "Stoic Rules for Unbreakable Focus",
      voiceScript,
      bRollKeywords,
      captionsTimeline: generateTimedCaptionsFromScript(voiceScript),
    });
  } catch (error: any) {
    console.warn("Gemini script generation fallback triggered:", error?.message);
    return res.json(buildFallbackRecipe(customTopic, niche));
  }
});

// Regenerate just the hook or full script
app.post("/api/pipeline/regenerate-hook", async (req, res) => {
  const { currentScript = "", niche = "Motivation & Mindset", toneOfVoice = "Cinematic & Deep" } = req.body || {};
  const fallbackUpdated =
    "Every morning, 99% of people surrender their focus before getting out of bed. Marcus Aurelius did the exact opposite. Control your first ten minutes, strip the noise, anchor your breath, and command your thoughts before the world takes the wheel.";
  try {
    const ai = getAiClient();
    if (!ai) {
      return res.json({
        voiceScript: fallbackUpdated,
        captionsTimeline: generateTimedCaptionsFromScript(fallbackUpdated),
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Rewrite the opening hook and tighten this 50-second YouTube Short script for maximum viral retention in the "${niche}" niche (${toneOfVoice} tone):\n\n"${currentScript}"\n\nReturn ONLY the revised spoken script text (110-130 words), no quotes or extra commentary.`,
    });

    const voiceScript = (response.text || fallbackUpdated).trim();
    return res.json({
      voiceScript,
      captionsTimeline: generateTimedCaptionsFromScript(voiceScript),
    });
  } catch (error: any) {
    console.warn("Hook regeneration fallback triggered:", error?.message);
    return res.json({
      voiceScript: fallbackUpdated,
      captionsTimeline: generateTimedCaptionsFromScript(fallbackUpdated),
    });
  }
});

// Step 3: Gemini TTS Audio Synthesis (returns base64 WAV audio)
app.post("/api/pipeline/synthesize-tts", async (req, res) => {
  try {
    const { text, voiceName = "Charon", style = "Deep, resonant, cinematic narrator" } = req.body || {};
    const ai = getAiClient();

    if (!ai || !text) {
      return res.json({
        audioBase64: null,
        useBrowserFallback: true,
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash-lite-tts",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: text.slice(0, 900),
              speechMetadata: {
                style,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.json({ audioBase64: null, useBrowserFallback: true });
    }

    return res.json({
      audioBase64: base64Audio,
      mimeType: "audio/wav",
      sampleRate: 24000,
    });
  } catch (error: any) {
    return res.json({
      audioBase64: null,
      useBrowserFallback: true,
    });
  }
});

// Generate a 9:16 scene visual via Gemini image generation
app.post("/api/pipeline/generate-scene-image", async (req, res) => {
  try {
    const { prompt, visualStyle = "Dark Cinematic Realism" } = req.body || {};
    const ai = getAiClient();
    if (!ai || !prompt) {
      return res.json({ imageUrl: null, usePoolFallback: true });
    }

    const fullPrompt = `Vertical 9:16 cinematic frame for a viral faceless reel, style: ${visualStyle}. Scene: ${prompt}. Dramatic volumetric lighting, ultra-detailed, high contrast, no text or watermarks.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        return res.json({
          imageUrl: `data:${mime};base64,${part.inlineData.data}`,
        });
      }
    }

    return res.json({ imageUrl: null, usePoolFallback: true });
  } catch {
    return res.json({ imageUrl: null, usePoolFallback: true });
  }
});

// Generate 5 high-retention 3-second viral hooks for FacelessReels Creator Tools
app.post("/api/tools/generate-viral-hooks", async (req, res) => {
  const { topic = "Stoic Morning Routine", templateName = "Mindset Loop" } = req.body || {};
  const fallbackHooks = [
    {
      type: "Contrarian Shock",
      hookText: `Everything you were taught about ${topic} is a lie designed to keep you average.`,
      retentionScore: "96% 3s Hold",
    },
    {
      type: "Curiosity Gap",
      hookText: `Only 1% of people know the dark psychological rule behind ${topic}.`,
      retentionScore: "94% 3s Hold",
    },
    {
      type: "Negative Warning",
      hookText: `Stop doing this every morning unless you want to ruin your focus for the next 16 hours.`,
      retentionScore: "92% 3s Hold",
    },
    {
      type: "Historical Authority",
      hookText: `Two thousand years ago, Marcus Aurelius wrote down a secret law for ${topic}.`,
      retentionScore: "91% 3s Hold",
    },
    {
      type: "Direct Challenge",
      hookText: `If you can't survive the next 30 seconds of this video, your dopamine receptors are fried.`,
      retentionScore: "95% 3s Hold",
    },
  ];

  try {
    const ai = getAiClient();
    if (!ai) {
      return res.json({ hooks: fallbackHooks });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Generate 5 distinct, ultra-high-retention 3-second opening hooks for a faceless vertical short about "${topic}" using the "${templateName}" format.
Return strictly as JSON with a "hooks" array containing objects with "type", "hookText", and "retentionScore" (e.g. "95% 3s Hold").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hooks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  hookText: { type: Type.STRING },
                  retentionScore: { type: Type.STRING },
                },
                required: ["type", "hookText", "retentionScore"],
              },
            },
          },
          required: ["hooks"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({
      hooks: Array.isArray(parsed.hooks) && parsed.hooks.length > 0 ? parsed.hooks : fallbackHooks,
    });
  } catch {
    return res.json({ hooks: fallbackHooks });
  }
});

// Serve the real Android project files from /android directory plus GitHub Actions workflow
app.get("/api/android-project/files", (_req, res) => {
  try {
    const androidRoot = path.join(__dirname, "android");
    const results: { relativePath: string; content: string }[] = [];

    const workflowFile = path.join(
      __dirname,
      ".github",
      "workflows",
      "build-android-apk.yml"
    );
    if (fs.existsSync(workflowFile)) {
      results.push({
        relativePath: ".github/workflows/build-android-apk.yml",
        content: fs.readFileSync(workflowFile, "utf-8"),
      });
    }

    function walk(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else {
          const rel = path.relative(androidRoot, fullPath);
          const content = fs.readFileSync(fullPath, "utf-8");
          results.push({ relativePath: `android/${rel}`, content });
        }
      }
    }

    walk(androidRoot);
    res.json({ files: results });
  } catch (err: any) {
    res.json({ files: [] });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FacelessShorts Auto-Pilot server running on http://localhost:${PORT}`);
  });
}

startServer();
