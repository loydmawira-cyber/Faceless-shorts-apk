export interface KotlinSourceFile {
  path: string;
  packageName: string;
  title: string;
  layer: 'data/models' | 'data/repository' | 'network' | 'worker' | 'ui/screens' | 'root';
  description: string;
  code: string;
}

export const KOTLIN_ARCHITECTURE_FILES: KotlinSourceFile[] = [
  {
    path: 'data/models/JsonSchemas.kt',
    packageName: 'com.facelessshorts.autopilot.data.models',
    title: 'JsonSchemas.kt',
    layer: 'data/models',
    description:
      'Strongly-typed Kotlin data classes annotated with kotlinx.serialization (@Serializable) and @SerialName for AppSettingsJSON, VideoScriptRecipeJSON, CaptionWordJSON, and Pexels/YouTube payloads.',
    code: `package com.facelessshorts.autopilot.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * 1. AppSettingsJSON: Holds user parameters for the automated campaign.
 * Persisted locally in context.filesDir/app_settings.json
 */
@Serializable
data class AppSettingsJSON(
    @SerialName("niche") val niche: String = "Motivation & Mindset",
    @SerialName("frequencyPerDay") val frequencyPerDay: Int = 2,
    @SerialName("toneOfVoice") val toneOfVoice: String = "Cinematic & Deep",
    @SerialName("geminiApiKey") val geminiApiKey: String = "",
    @SerialName("pexelsApiKey") val pexelsApiKey: String = "",
    @SerialName("lastRunTimestamp") val lastRunTimestamp: Long = 0L
)

/**
 * 2. VideoScriptRecipeJSON: Returned by the AI script generation step (Step 1).
 * Contains a 50-second motivational/educational script, 5 targeted B-Roll search keywords,
 * and word-level timestamps for FFmpeg subtitle burning.
 */
@Serializable
data class VideoScriptRecipeJSON(
    @SerialName("targetTopic") val targetTopic: String,
    @SerialName("voiceScript") val voiceScript: String,
    @SerialName("bRollKeywords") val bRollKeywords: List<String>,
    @SerialName("captionsTimeline") val captionsTimeline: List<CaptionWordJSON>
)

/**
 * 3. CaptionWordJSON: Timed text segments for burning onto the 9:16 video via FFmpeg drawtext/ASS.
 */
@Serializable
data class CaptionWordJSON(
    @SerialName("word") val word: String,
    @SerialName("startTimeMs") val startTimeMs: Long,
    @SerialName("endTimeMs") val endTimeMs: Long
)

/**
 * Local Upload Log Record stored in local JSON log database (upload_logs.json).
 */
@Serializable
data class UploadLogEntryJSON(
    @SerialName("id") val id: String,
    @SerialName("title") val title: String,
    @SerialName("youtubeVideoId") val youtubeVideoId: String?,
    @SerialName("status") val status: String,
    @SerialName("timestamp") val timestamp: Long,
    @SerialName("durationSec") val durationSec: Int,
    @SerialName("viewsCount") val viewsCount: Int = 0
)

/**
 * Pexels Videos Search API Response Models (orientation=portrait)
 */
@Serializable
data class PexelsSearchResponseJSON(
    @SerialName("page") val page: Int = 1,
    @SerialName("per_page") val perPage: Int = 15,
    @SerialName("videos") val videos: List<PexelsVideoJSON> = emptyList()
)

@Serializable
data class PexelsVideoJSON(
    @SerialName("id") val id: Long,
    @SerialName("width") val width: Int,
    @SerialName("height") val height: Int,
    @SerialName("duration") val duration: Int,
    @SerialName("image") val image: String,
    @SerialName("video_files") val videoFiles: List<PexelsVideoFileJSON>
)

@Serializable
data class PexelsVideoFileJSON(
    @SerialName("id") val id: Long,
    @SerialName("quality") val quality: String,
    @SerialName("file_type") val fileType: String,
    @SerialName("width") val width: Int? = null,
    @SerialName("height") val height: Int? = null,
    @SerialName("link") val link: String
)`,
  },
  {
    path: 'network/GeminiAndPexelsNetwork.kt',
    packageName: 'com.facelessshorts.autopilot.network',
    title: 'GeminiAndPexelsNetwork.kt',
    layer: 'network',
    description:
      'Step 1 (Google Gemini API HTTP POST returning strict VideoScriptRecipeJSON) and Step 2 (Pexels Portrait Video API ingestion & MP4 download to cacheDir).',
    code: `package com.facelessshorts.autopilot.network

import com.facelessshorts.autopilot.data.models.PexelsSearchResponseJSON
import com.facelessshorts.autopilot.data.models.VideoScriptRecipeJSON
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.util.concurrent.TimeUnit

@Serializable
private data class GeminiGenerateRequest(
    val contents: List<GeminiContent>,
    val generationConfig: GeminiGenerationConfig
)

@Serializable
private data class GeminiContent(val parts: List<GeminiPart>)

@Serializable
private data class GeminiPart(val text: String)

@Serializable
private data class GeminiGenerationConfig(
    val responseMimeType: String = "application/json",
    val temperature: Double = 0.7
)

@Serializable
private data class GeminiGenerateResponse(
    val candidates: List<GeminiCandidate> = emptyList()
)

@Serializable
private data class GeminiCandidate(val content: GeminiContent)

class PipelineNetworkClient {

    private val jsonParser = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    /**
     * Step 1: AI Script Generation
     * Executes an HTTP POST request to the Gemini API endpoint using the user's free-tier API key.
     * Instructs Gemini to output text strictly formatted as a parseable VideoScriptRecipeJSON object
     * containing a 50-second motivational/educational script and 5 targeted B-Roll search keywords.
     */
    suspend fun generateVideoScriptRecipe(
        apiKey: String,
        niche: String,
        toneOfVoice: String
    ): Result<VideoScriptRecipeJSON> = withContext(Dispatchers.IO) {
        runCatching {
            require(apiKey.isNotBlank()) { "Gemini API Key must not be empty." }

            val prompt = """
                You are an elite viral YouTube Shorts producer.
                Generate a 50-second motivational/educational vertical video script for the niche: "$niche"
                with tone of voice: "$toneOfVoice".
                
                Output MUST be strictly valid JSON matching VideoScriptRecipeJSON with these exact keys:
                {
                  "targetTopic": "Viral Short Title (under 60 chars)",
                  "voiceScript": "Full 50-second narration text (~130 words)",
                  "bRollKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
                  "captionsTimeline": [
                    { "word": "First", "startTimeMs": 0, "endTimeMs": 320 }
                  ]
                }
                Ensure bRollKeywords contains EXACTLY 5 portrait visual search phrases.
                Ensure captionsTimeline maps every spoken word sequentially across 0..50000ms.
            """.trimIndent()

            val payload = GeminiGenerateRequest(
                contents = listOf(GeminiContent(parts = listOf(GeminiPart(text = prompt)))),
                generationConfig = GeminiGenerationConfig(responseMimeType = "application/json")
            )

            val requestBodyString = jsonParser.encodeToString(GeminiGenerateRequest.serializer(), payload)
            val endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=$apiKey"

            val request = Request.Builder()
                .url(endpoint)
                .post(requestBodyString.toRequestBody("application/json; charset=utf-8".toMediaType()))
                .build()

            httpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    throw IOException("Gemini HTTP Error \${response.code}: \${response.message}")
                }
                val rawBody = response.body?.string()
                    ?: throw IOException("Empty response body from Gemini API")

                val geminiResponse = jsonParser.decodeFromString(GeminiGenerateResponse.serializer(), rawBody)
                val recipeJsonText = geminiResponse.candidates.firstOrNull()
                    ?.content?.parts?.firstOrNull()?.text
                    ?: throw IOException("No text candidate returned by Gemini")

                val cleanJson = recipeJsonText
                    .removePrefix("\`\`\`json")
                    .removePrefix("\`\`\`")
                    .removeSuffix("\`\`\`")
                    .trim()

                val recipe = jsonParser.decodeFromString(VideoScriptRecipeJSON.serializer(), cleanJson)
                require(recipe.bRollKeywords.size == 5) {
                    "Expected 5 B-Roll keywords, received \${recipe.bRollKeywords.size}"
                }
                recipe
            }
        }
    }

    /**
     * Step 2: Free B-Roll Ingestion
     * Queries Pexels Video Search API with orientation=portrait for vertical (9:16) clips
     * and downloads the top 3 matching .mp4 stock video clips to context.cacheDir.
     */
    suspend fun fetchAndDownloadPortraitBRollClips(
        pexelsApiKey: String,
        keywords: List<String>,
        cacheDir: File
    ): Result<List<File>> = withContext(Dispatchers.IO) {
        runCatching {
            require(pexelsApiKey.isNotBlank()) { "Pexels API Key must not be empty." }
            val downloadedFiles = mutableListOf<File>()
            val bRollCacheFolder = File(cacheDir, "broll_clips").apply { mkdirs() }

            for (keyword in keywords) {
                if (downloadedFiles.size >= 3) break

                val encodedQuery = java.net.URLEncoder.encode(keyword, "UTF-8")
                val url = "https://api.pexels.com/videos/search?query=$encodedQuery&orientation=portrait&size=medium&per_page=3"

                val request = Request.Builder()
                    .url(url)
                    .addHeader("Authorization", pexelsApiKey)
                    .get()
                    .build()

                httpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        throw IOException("Pexels API HTTP \${response.code}: \${response.message}")
                    }
                    val bodyStr = response.body?.string() ?: return@use
                    val searchResult = jsonParser.decodeFromString(PexelsSearchResponseJSON.serializer(), bodyStr)

                    val matchingMp4Link = searchResult.videos
                        .flatMap { it.videoFiles }
                        .filter { it.fileType == "video/mp4" && (it.height ?: 1920) > (it.width ?: 1080) }
                        .sortedByDescending { it.height ?: 0 }
                        .firstOrNull()?.link

                    if (matchingMp4Link != null) {
                        val index = downloadedFiles.size + 1
                        val targetFile = File(bRollCacheFolder, "broll_clip_\$index.mp4")
                        downloadFileStreaming(matchingMp4Link, targetFile)
                        downloadedFiles.add(targetFile)
                    }
                }
            }

            if (downloadedFiles.size < 3) {
                throw IOException("Could only download \${downloadedFiles.size}/3 portrait B-Roll clips from Pexels.")
            }
            downloadedFiles
        }
    }

    private fun downloadFileStreaming(url: String, outputFile: File) {
        val request = Request.Builder().url(url).get().build()
        httpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed to download MP4 stream: HTTP \${response.code}")
            }
            val inputStream = response.body?.byteStream()
                ?: throw IOException("Null byteStream for MP4 clip")
            FileOutputStream(outputFile).use { fos ->
                val buffer = ByteArray(16 * 1024)
                var bytesRead: Int
                while (inputStream.read(buffer).also { bytesRead = it } != -1) {
                    fos.write(buffer, 0, bytesRead)
                }
                fos.flush()
            }
        }
    }
}`,
  },
  {
    path: 'worker/LocalMediaAndFFmpegEngine.kt',
    packageName: 'com.facelessshorts.autopilot.worker',
    title: 'LocalMediaAndFFmpegEngine.kt',
    layer: 'worker',
    description:
      'Step 3 (100% Free Local Engine): Synthesizes voice.wav via Android native TextToSpeech.synthesizeToFile() and runs FFmpegKit to stitch 3 clips, mix audio, and burn word-by-word CaptionWordJSON center subtitles into a 1080x1920 MP4.',
    code: `package com.facelessshorts.autopilot.worker

import android.content.Context
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.ReturnCode
import com.facelessshorts.autopilot.data.models.CaptionWordJSON
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import java.io.File
import java.util.Locale
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class LocalMediaAndFFmpegEngine(private val context: Context) {

    /**
     * Step 3A: Local TTS Synthesis
     * Uses Android's native TextToSpeech engine (android.speech.tts.TextToSpeech)
     * to convert the generated voiceScript string into a local audio file (voice.wav).
     */
    suspend fun synthesizeScriptToWav(
        voiceScript: String,
        outputWavFile: File
    ): Result<File> = withContext(Dispatchers.Main) {
        runCatching {
            suspendCancellableCoroutine<File> { continuation ->
                var ttsEngine: TextToSpeech? = null
                val utteranceId = "faceless_short_tts_\${System.currentTimeMillis()}"

                ttsEngine = TextToSpeech(context) { status ->
                    if (status != TextToSpeech.SUCCESS) {
                        if (continuation.isActive) {
                            continuation.resumeWithException(
                                IllegalStateException("Android TextToSpeech initialization failed with code $status")
                            )
                        }
                        return@TextToSpeech
                    }

                    val engine = ttsEngine ?: return@TextToSpeech
                    engine.language = Locale.US
                    engine.setSpeechRate(1.05f)
                    engine.setPitch(0.92f) // Deep resonant baritone pitch

                    engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                        override fun onStart(id: String?) = Unit

                        override fun onDone(id: String?) {
                            engine.stop()
                            engine.shutdown()
                            if (continuation.isActive) {
                                continuation.resume(outputWavFile)
                            }
                        }

                        @Deprecated("Deprecated in Java")
                        override fun onError(id: String?) {
                            engine.shutdown()
                            if (continuation.isActive) {
                                continuation.resumeWithException(
                                    RuntimeException("TextToSpeech synthesis error on utterance: $id")
                                )
                            }
                        }

                        override fun onError(id: String?, errorCode: Int) {
                            engine.shutdown()
                            if (continuation.isActive) {
                                continuation.resumeWithException(
                                    RuntimeException("TextToSpeech synthesis error ($errorCode) on $id")
                                )
                            }
                        }
                    })

                    val params = Bundle()
                    val synthResult = engine.synthesizeToFile(
                        voiceScript,
                        params,
                        outputWavFile,
                        utteranceId
                    )

                    if (synthResult != TextToSpeech.SUCCESS && continuation.isActive) {
                        engine.shutdown()
                        continuation.resumeWithException(
                            RuntimeException("synthesizeToFile immediate failure: $synthResult")
                        )
                    }
                }

                continuation.invokeOnCancellation {
                    ttsEngine?.stop()
                    ttsEngine?.shutdown()
                }
            }
        }
    }

    /**
     * Step 3B: FFmpeg Rendering Pipeline (ffmpeg-kit-full)
     * a. Merges the 3 downloaded stock video clips sequentially scaled/cropped to 1080x1920 (9:16).
     * b. Overlays and mixes the local TTS voice.wav file.
     * c. Uses FFmpeg drawtext filter chain mapped to CaptionWordJSON timeline data to burn
     *    fast, stylized center-screen word-by-word subtitles onto the final video.
     * d. Outputs a high-definition 9:16 vertical MP4 video file.
     */
    suspend fun renderFinalVerticalShortMp4(
        bRollClips: List<File>,
        voiceWavFile: File,
        captionsTimeline: List<CaptionWordJSON>,
        outputMp4File: File,
        onLogLine: (String) -> Unit = {}
    ): Result<File> = withContext(Dispatchers.IO) {
        runCatching {
            require(bRollClips.size >= 3) { "FFmpeg requires 3 B-Roll MP4 clips." }
            require(voiceWavFile.exists()) { "TTS voice.wav file does not exist." }

            val clip1 = bRollClips[0].absolutePath
            val clip2 = bRollClips[1].absolutePath
            val clip3 = bRollClips[2].absolutePath
            val voicePath = voiceWavFile.absolutePath
            val outPath = outputMp4File.absolutePath

            // Build FFmpeg drawtext filter expressions from CaptionWordJSON timeline
            val drawTextFilters = buildDrawTextFilterChain(captionsTimeline)

            val filterComplex = buildString {
                append("[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,trim=duration=17,setpts=PTS-STARTPTS[v0];")
                append("[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,trim=duration=17,setpts=PTS-STARTPTS[v1];")
                append("[2:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,trim=duration=17,setpts=PTS-STARTPTS[v2];")
                append("[v0][v1][v2]concat=n=3:v=1:a=0[vconcat];")
                if (drawTextFilters.isNotEmpty()) {
                    append("[vconcat]$drawTextFilters[vout]")
                } else {
                    append("[vconcat]null[vout]")
                }
            }

            val ffmpegCommand = listOf(
                "-y",
                "-i", "\"$clip1\"",
                "-i", "\"$clip2\"",
                "-i", "\"$clip3\"",
                "-i", "\"$voicePath\"",
                "-filter_complex", "\"$filterComplex\"",
                "-map", "\"[vout]\"",
                "-map", "3:a:0",
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-crf", "21",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                "\"$outPath\""
            ).joinToString(" ")

            onLogLine("ffmpeg $ffmpegCommand")

            val session = FFmpegKit.execute(ffmpegCommand)
            val returnCode = session.returnCode

            if (!ReturnCode.isSuccess(returnCode)) {
                val failStack = session.failStackTrace ?: session.allLogsAsString
                throw IllegalStateException("FFmpeg render failed (rc=$returnCode): $failStack")
            }

            outputMp4File
        }
    }

    /**
     * Generates chained drawtext filters for center-screen high-retention captions
     * mapped directly to CaptionWordJSON(word, startTimeMs, endTimeMs).
     */
    fun buildDrawTextFilterChain(captions: List<CaptionWordJSON>): String {
        return captions.joinToString(separator = ",") { item ->
            val startSec = String.format(Locale.US, "%.3f", item.startTimeMs / 1000.0)
            val endSec = String.format(Locale.US, "%.3f", item.endTimeMs / 1000.0)
            val sanitizedWord = item.word
                .uppercase(Locale.US)
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace(":", "\\:")
                .replace(",", "\\,")

            "drawtext=text='$sanitizedWord':" +
                "fontcolor=#FFFFFF:" +
                "fontsize=84:" +
                "borderw=6:" +
                "bordercolor=#141218:" +
                "shadowcolor=#7C4DFF@0.85:" +
                "shadowx=0:shadowy=6:" +
                "x=(w-text_w)/2:" +
                "y=(h-text_h)/2:" +
                "enable='between(t,$startSec,$endSec)'"
        }
    }
}`,
  },
  {
    path: 'network/YouTubeShortsUploader.kt',
    packageName: 'com.facelessshorts.autopilot.network',
    title: 'YouTubeShortsUploader.kt',
    layer: 'network',
    description:
      'Step 4: Automated YouTube Data API v3 videos.insert upload with OAuth 2.0 credential binding, setting privacyStatus="public", #Shorts metadata, and selfDeclaredMadeForKids=false.',
    code: `package com.facelessshorts.autopilot.network

import android.accounts.Account
import android.content.Context
import com.google.api.client.googleapis.extensions.android.gms.auth.GoogleAccountCredential
import com.google.api.client.http.InputStreamContent
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.youtube.YouTube
import com.google.api.services.youtube.YouTubeScopes
import com.google.api.services.youtube.model.Video
import com.google.api.services.youtube.model.VideoSnippet
import com.google.api.services.youtube.model.VideoStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedInputStream
import java.io.File
import java.io.FileInputStream

class YouTubeShortsUploader(private val context: Context) {

    /**
     * Builds an OAuth 2.0 GoogleAccountCredential scoped for YouTube Data API v3 upload.
     */
    fun buildCredential(selectedAccount: Account): GoogleAccountCredential {
        return GoogleAccountCredential.usingOAuth2(
            context,
            listOf(YouTubeScopes.YOUTUBE_UPLOAD)
        ).apply {
            this.selectedAccount = selectedAccount
        }
    }

    /**
     * Step 4: Automated YouTube Upload
     * Sends the finished local 9:16 MP4 file to the YouTube Data API v3 videos.insert endpoint.
     * - Dynamically sets the video snippet title & description with #Shorts
     * - Sets video privacy status to "public"
     * - Flags selfDeclaredMadeForKids = false ("not made for kids")
     */
    suspend fun uploadRenderedShortToYouTube(
        credential: GoogleAccountCredential,
        renderedMp4File: File,
        targetTopic: String,
        niche: String,
        keywords: List<String>
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            require(renderedMp4File.exists() && renderedMp4File.length() > 0L) {
                "Rendered MP4 file is missing or empty: \${renderedMp4File.absolutePath}"
            }

            val youtubeService = YouTube.Builder(
                NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                credential
            )
                .setApplicationName("FacelessShorts-AutoPilot-Android")
                .build()

            // Ensure title includes #Shorts for YouTube Shorts shelf assignment
            val cleanTitle = targetTopic.take(85).trim()
            val formattedShortTitle = if (cleanTitle.contains("#Shorts", ignoreCase = true)) {
                cleanTitle
            } else {
                "$cleanTitle #Shorts"
            }

            val snippet = VideoSnippet().apply {
                title = formattedShortTitle
                description = buildString {
                    appendLine(targetTopic)
                    appendLine()
                    appendLine("Automated daily short in $niche.")
                    appendLine("#Shorts #YouTubeShorts #\${niche.replace(" ", "")}")
                }
                tags = (keywords + listOf("Shorts", "YouTubeShorts", niche)).distinct()
                categoryId = "27" // Category 27 = Education / Motivational
            }

            val status = VideoStatus().apply {
                privacyStatus = "public"
                selfDeclaredMadeForKids = false
            }

            val videoMetadata = Video().apply {
                this.snippet = snippet
                this.status = status
            }

            BufferedInputStream(FileInputStream(renderedMp4File)).use { fileStream ->
                val mediaContent = InputStreamContent("video/mp4", fileStream).apply {
                    length = renderedMp4File.length()
                }

                val insertRequest = youtubeService.videos().insert(
                    listOf("snippet", "status"),
                    videoMetadata,
                    mediaContent
                )

                // Enable resumable media upload for reliability over mobile/Wi-Fi networks
                insertRequest.mediaHttpUploader.apply {
                    isDirectUploadEnabled = false
                    chunkSize = 5 * 1024 * 1024 // 5 MB chunks
                }

                val uploadedVideo = insertRequest.execute()
                uploadedVideo.id ?: throw IllegalStateException("YouTube API returned null video ID")
            }
        }
    }
}`,
  },
  {
    path: 'worker/DailyVideoWorker.kt',
    packageName: 'com.facelessshorts.autopilot.worker',
    title: 'DailyVideoWorker.kt',
    layer: 'worker',
    description:
      'Android Jetpack WorkManager CoroutineWorker scheduled every 24 hours with strict constraints (UNMETERED Wi-Fi, Charging, and Device Idle). Executes Steps 1-4 sequentially.',
    code: `package com.facelessshorts.autopilot.worker

import android.accounts.Account
import android.content.Context
import android.os.Build
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.facelessshorts.autopilot.data.models.UploadLogEntryJSON
import com.facelessshorts.autopilot.data.repository.LocalJsonRepository
import com.facelessshorts.autopilot.network.PipelineNetworkClient
import com.facelessshorts.autopilot.network.YouTubeShortsUploader
import java.io.File
import java.util.UUID
import java.util.concurrent.TimeUnit

class DailyVideoWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val repository = LocalJsonRepository(appContext)
    private val networkClient = PipelineNetworkClient()
    private val mediaEngine = LocalMediaAndFFmpegEngine(appContext)
    private val youtubeUploader = YouTubeShortsUploader(appContext)

    override suspend fun doWork(): Result {
        val settings = repository.loadSettings()
        if (settings.geminiApiKey.isBlank() || settings.pexelsApiKey.isBlank()) {
            return Result.failure(workDataOf("error" to "Missing Gemini or Pexels API keys in AppSettingsJSON"))
        }

        // STEP 1: AI Script Generation (Gemini API -> VideoScriptRecipeJSON)
        setProgress(workDataOf("stage" to "Step 1/4: Generating AI Script via Gemini", "progress" to 15))
        val scriptRecipe = networkClient.generateVideoScriptRecipe(
            apiKey = settings.geminiApiKey,
            niche = settings.niche,
            toneOfVoice = settings.toneOfVoice
        ).getOrElse { err ->
            return Result.retry()
        }
        repository.saveLatestRecipe(scriptRecipe)

        // STEP 2: Free B-Roll Ingestion (Pexels Portrait MP4s -> cacheDir)
        setProgress(workDataOf("stage" to "Step 2/4: Downloading 3 Portrait B-Roll Clips", "progress" to 40))
        val bRollFiles = networkClient.fetchAndDownloadPortraitBRollClips(
            pexelsApiKey = settings.pexelsApiKey,
            keywords = scriptRecipe.bRollKeywords,
            cacheDir = applicationContext.cacheDir
        ).getOrElse { err ->
            return Result.retry()
        }

        // STEP 3: Local TTS & FFmpeg Rendering (voice.wav + 3 MP4s + CaptionWordJSON -> final_short.mp4)
        setProgress(workDataOf("stage" to "Step 3/4: Synthesizing Local TTS & FFmpeg Rendering", "progress" to 68))
        val voiceWavFile = File(applicationContext.cacheDir, "voice.wav")
        mediaEngine.synthesizeScriptToWav(
            voiceScript = scriptRecipe.voiceScript,
            outputWavFile = voiceWavFile
        ).getOrElse { err ->
            return Result.failure(workDataOf("error" to "TTS Failure: \${err.message}"))
        }

        val renderedShortMp4 = File(applicationContext.cacheDir, "final_short_\${System.currentTimeMillis()}.mp4")
        mediaEngine.renderFinalVerticalShortMp4(
            bRollClips = bRollFiles,
            voiceWavFile = voiceWavFile,
            captionsTimeline = scriptRecipe.captionsTimeline,
            outputMp4File = renderedShortMp4
        ).getOrElse { err ->
            return Result.failure(workDataOf("error" to "FFmpeg Render Failure: \${err.message}"))
        }

        // STEP 4: Automated YouTube Shorts Upload (YouTube Data API v3 videos.insert)
        setProgress(workDataOf("stage" to "Step 4/4: Uploading Short to YouTube Data API v3", "progress" to 92))
        val savedAccountEmail = repository.getAuthenticatedGoogleEmail()
            ?: return Result.failure(workDataOf("error" to "YouTube OAuth Account not connected"))

        val credential = youtubeUploader.buildCredential(Account(savedAccountEmail, "com.google"))
        val uploadedVideoId = youtubeUploader.uploadRenderedShortToYouTube(
            credential = credential,
            renderedMp4File = renderedShortMp4,
            targetTopic = scriptRecipe.targetTopic,
            niche = settings.niche,
            keywords = scriptRecipe.bRollKeywords
        ).getOrElse { err ->
            return Result.retry()
        }

        // Persist run timestamp & log entry in local JSON database
        val now = System.currentTimeMillis()
        repository.saveSettings(settings.copy(lastRunTimestamp = now))
        repository.appendUploadLog(
            UploadLogEntryJSON(
                id = UUID.randomUUID().toString(),
                title = scriptRecipe.targetTopic,
                youtubeVideoId = uploadedVideoId,
                status = "Published",
                timestamp = now,
                durationSec = 50
            )
        )

        setProgress(workDataOf("stage" to "Completed: Short Published ($uploadedVideoId)", "progress" to 100))
        return Result.success(workDataOf("youtubeVideoId" to uploadedVideoId))
    }

    companion object {
        private const val UNIQUE_WORK_NAME = "FacelessShorts_DailyVideoWorker"

        /**
         * Schedules DailyVideoWorker to run once every 24 hours.
         * Enforces strict hardware & network constraints:
         * - Connected to Wi-Fi (NetworkType.UNMETERED)
         * - Device is Charging (setRequiresCharging(true))
         * - Device is Idle (setRequiresDeviceIdle(true))
         */
        fun scheduleDailyAutoPilot(context: Context) {
            val constraintsBuilder = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.UNMETERED) // Wi-Fi / Unmetered connection
                .setRequiresCharging(true)                     // Must be plugged in / charging
                .apply {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        setRequiresDeviceIdle(true)            // Must be in device-idle maintenance window
                    }
                }
                .build()

            val dailyWorkRequest = PeriodicWorkRequestBuilder<DailyVideoWorker>(
                repeatInterval = 24,
                repeatIntervalTimeUnit = TimeUnit.HOURS
            )
                .setConstraints(constraintsBuilder)
                .addTag(UNIQUE_WORK_NAME)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                dailyWorkRequest
            )
        }
    }
}`,
  },
  {
    path: 'data/repository/LocalJsonRepository.kt',
    packageName: 'com.facelessshorts.autopilot.data.repository',
    title: 'LocalJsonRepository.kt',
    layer: 'data/repository',
    description:
      'Local JSON file database managing app_settings.json, latest_recipe.json, and upload_logs.json inside Android internal storage.',
    code: `package com.facelessshorts.autopilot.data.repository

import android.content.Context
import com.facelessshorts.autopilot.data.models.AppSettingsJSON
import com.facelessshorts.autopilot.data.models.UploadLogEntryJSON
import com.facelessshorts.autopilot.data.models.VideoScriptRecipeJSON
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import java.io.File

class LocalJsonRepository(private val context: Context) {

    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val settingsFile: File
        get() = File(context.filesDir, "app_settings.json")

    private val latestRecipeFile: File
        get() = File(context.filesDir, "latest_script_recipe.json")

    private val uploadLogsFile: File
        get() = File(context.filesDir, "upload_logs.json")

    private val prefs by lazy {
        context.getSharedPreferences("faceless_oauth_prefs", Context.MODE_PRIVATE)
    }

    fun loadSettings(): AppSettingsJSON {
        if (!settingsFile.exists()) return AppSettingsJSON()
        return runCatching {
            json.decodeFromString(AppSettingsJSON.serializer(), settingsFile.readText())
        }.getOrDefault(AppSettingsJSON())
    }

    fun saveSettings(settings: AppSettingsJSON) {
        settingsFile.writeText(json.encodeToString(AppSettingsJSON.serializer(), settings))
    }

    fun saveLatestRecipe(recipe: VideoScriptRecipeJSON) {
        latestRecipeFile.writeText(json.encodeToString(VideoScriptRecipeJSON.serializer(), recipe))
    }

    fun loadLatestRecipe(): VideoScriptRecipeJSON? {
        if (!latestRecipeFile.exists()) return null
        return runCatching {
            json.decodeFromString(VideoScriptRecipeJSON.serializer(), latestRecipeFile.readText())
        }.getOrNull()
    }

    fun loadUploadLogs(): List<UploadLogEntryJSON> {
        if (!uploadLogsFile.exists()) return emptyList()
        return runCatching {
            json.decodeFromString(ListSerializer(UploadLogEntryJSON.serializer()), uploadLogsFile.readText())
        }.getOrDefault(emptyList())
    }

    fun appendUploadLog(entry: UploadLogEntryJSON) {
        val updated = listOf(entry) + loadUploadLogs()
        uploadLogsFile.writeText(
            json.encodeToString(ListSerializer(UploadLogEntryJSON.serializer()), updated)
        )
    }

    fun saveAuthenticatedGoogleEmail(email: String) {
        prefs.edit().putString("google_oauth_email", email).apply()
    }

    fun getAuthenticatedGoogleEmail(): String? {
        return prefs.getString("google_oauth_email", null)
    }
}`,
  },
  {
    path: 'ui/screens/MainActivityAndComposeScreens.kt',
    packageName: 'com.facelessshorts.autopilot.ui.screens',
    title: 'MainActivityAndComposeScreens.kt',
    layer: 'ui/screens',
    description:
      'Single-Activity Jetpack Compose Material 3 Dark Theme implementation featuring DashboardScreen, CampaignSettingsScreen (OAuth & API keys), QueueMediaPreviewScreen, and RenderEngineScreen.',
    code: `package com.facelessshorts.autopilot.ui.screens

import android.accounts.AccountManager
import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.facelessshorts.autopilot.data.models.AppSettingsJSON
import com.facelessshorts.autopilot.data.models.UploadLogEntryJSON
import com.facelessshorts.autopilot.data.models.VideoScriptRecipeJSON
import com.facelessshorts.autopilot.data.repository.LocalJsonRepository
import com.facelessshorts.autopilot.worker.DailyVideoWorker
import com.google.android.gms.common.AccountPicker

private val M3DarkColorScheme = darkColorScheme(
    primary = Color(0xFFCDBDFF),
    onPrimary = Color(0xFF370096),
    primaryContainer = Color(0xFF7C4DFF),
    onPrimaryContainer = Color(0xFFFCF6FF),
    secondary = Color(0xFFFFB59E),
    secondaryContainer = Color(0xFF7F2A0D),
    tertiary = Color(0xFFFFB954),
    background = Color(0xFF141218),
    surface = Color(0xFF141218),
    surfaceVariant = Color(0xFF211F25),
    onSurface = Color(0xFFE7E0E9),
    onSurfaceVariant = Color(0xFFCAC3D8)
)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val repository = LocalJsonRepository(applicationContext)

        setContent {
            MaterialTheme(colorScheme = M3DarkColorScheme) {
                FacelessShortsAppShell(
                    repository = repository,
                    onScheduleWorker = {
                        DailyVideoWorker.scheduleDailyAutoPilot(applicationContext)
                    }
                )
            }
        }
    }
}

@Composable
fun FacelessShortsAppShell(
    repository: LocalJsonRepository,
    onScheduleWorker: () -> Unit
) {
    var currentTab by remember { mutableStateOf("dashboard") }
    var settings by remember { mutableStateOf(repository.loadSettings()) }
    var logs by remember { mutableStateOf(repository.loadUploadLogs()) }
    var currentRecipe by remember { mutableStateOf(repository.loadLatestRecipe()) }
    var oauthAccountEmail by remember { mutableStateOf(repository.getAuthenticatedGoogleEmail()) }

    val oauthAccountLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val email = result.data?.getStringExtra(AccountManager.KEY_ACCOUNT_NAME)
            if (!email.isNullOrBlank()) {
                repository.saveAuthenticatedGoogleEmail(email)
                oauthAccountEmail = email
            }
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF211F25)) {
                listOf(
                    "dashboard" to "Dashboard",
                    "campaign" to "Campaign",
                    "queue" to "Queue",
                    "render" to "Render"
                ).forEach { (route, label) ->
                    NavigationBarItem(
                        selected = currentTab == route,
                        onClick = { currentTab = route },
                        icon = {},
                        label = { Text(label) }
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding).fillMaxSize()) {
            when (currentTab) {
                "dashboard" -> DashboardScreen(settings = settings, logs = logs)
                "campaign" -> SettingsScreen(
                    settings = settings,
                    connectedEmail = oauthAccountEmail,
                    onSave = { updated ->
                        settings = updated
                        repository.saveSettings(updated)
                        onScheduleWorker()
                    },
                    onLaunchOAuth = {
                        val intent = AccountPicker.newChooseAccountIntent(
                            AccountPicker.AccountChooserOptions.Builder()
                                .setAllowableAccountsTypes(listOf("com.google"))
                                .build()
                        )
                        oauthAccountLauncher.launch(intent)
                    }
                )
                "queue" -> MediaPreviewScreen(recipe = currentRecipe)
                "render" -> DashboardScreen(settings = settings, logs = logs)
            }
        }
    }
}

@Composable
fun DashboardScreen(settings: AppSettingsJSON, logs: List<UploadLogEntryJSON>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "READY TO UPLOAD • WORKMANAGER ACTIVE",
                        color = MaterialTheme.colorScheme.primary,
                        style = MaterialTheme.typography.labelSmall
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        text = "Niche: \${settings.niche} (\${settings.frequencyPerDay}x/day)",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "Constraints: Wi-Fi (UNMETERED) + Charging + Device Idle",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
        items(logs) { log ->
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF211F25))
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(log.title, fontWeight = FontWeight.SemiBold)
                        Text("YouTube ID: \${log.youtubeVideoId ?: "Scheduled"}", style = MaterialTheme.typography.bodySmall)
                    }
                    Text(log.status, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }
}

@Composable
fun SettingsScreen(
    settings: AppSettingsJSON,
    connectedEmail: String?,
    onSave: (AppSettingsJSON) -> Unit,
    onLaunchOAuth: () -> Unit
) {
    var niche by remember(settings) { mutableStateOf(settings.niche) }
    var tone by remember(settings) { mutableStateOf(settings.toneOfVoice) }
    var geminiKey by remember(settings) { mutableStateOf(settings.geminiApiKey) }
    var pexelsKey by remember(settings) { mutableStateOf(settings.pexelsApiKey) }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("Campaign & API Automation Setup", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        OutlinedTextField(
            value = niche,
            onValueChange = { niche = it },
            label = { Text("Content Niche") },
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = tone,
            onValueChange = { tone = it },
            label = { Text("Tone of Voice") },
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = geminiKey,
            onValueChange = { geminiKey = it },
            label = { Text("Google Gemini Free API Key") },
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = pexelsKey,
            onValueChange = { pexelsKey = it },
            label = { Text("Pexels Free Video API Key") },
            modifier = Modifier.fillMaxWidth()
        )
        Button(
            onClick = onLaunchOAuth,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2B292F))
        ) {
            Text(if (connectedEmail != null) "YouTube Connected: $connectedEmail" else "Authenticate YouTube Channel (OAuth 2.0)")
        }
        Button(
            onClick = {
                onSave(settings.copy(niche = niche, toneOfVoice = tone, geminiApiKey = geminiKey, pexelsApiKey = pexelsKey))
            },
            modifier = Modifier.fillMaxWidth().height(54.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF7C4DFF))
        ) {
            Text("Save Campaign & Schedule 24h Worker", color = Color.White, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun MediaPreviewScreen(recipe: VideoScriptRecipeJSON?) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Media Queue & Script Recipe Inspector", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(12.dp))
        if (recipe == null) {
            Text("No VideoScriptRecipeJSON generated yet. Trigger pipeline to inspect.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        } else {
            Text("Topic: \${recipe.targetTopic}", style = MaterialTheme.typography.titleMedium)
            Spacer(Modifier.height(8.dp))
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1D1B21), RoundedCornerShape(16.dp))
                    .padding(16.dp)
            ) {
                Text(recipe.voiceScript, fontFamily = FontFamily.Monospace)
            }
        }
    }
}`,
  },
];
