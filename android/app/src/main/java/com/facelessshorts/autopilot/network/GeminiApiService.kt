package com.facelessshorts.autopilot.network

import com.facelessshorts.autopilot.data.models.CaptionWordJSON
import com.facelessshorts.autopilot.data.models.VideoScriptRecipeJSON
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

@Serializable
private data class GeminiRequestPayload(
    val contents: List<GeminiContentItem>,
    val generationConfig: GeminiGenerationConfig
)

@Serializable
private data class GeminiContentItem(
    val parts: List<GeminiTextPart>
)

@Serializable
private data class GeminiTextPart(
    val text: String
)

@Serializable
private data class GeminiGenerationConfig(
    val responseMimeType: String = "application/json",
    val temperature: Double = 0.7
)

@Serializable
private data class GeminiResponsePayload(
    val candidates: List<GeminiCandidateItem> = emptyList()
)

@Serializable
private data class GeminiCandidateItem(
    val content: GeminiContentItem
)

/**
 * Step 1: AI Script Generation via HTTP POST to the Google Gemini API endpoint.
 */
class GeminiApiService {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    /**
     * Sends an HTTP POST request to the Google Gemini API endpoint using the user's free-tier API key.
     * Instructs Gemini to output text strictly formatted as a parseable VideoScriptRecipeJSON object
     * containing a 50-second motivational/educational script and 5 targeted B-Roll search keywords.
     */
    suspend fun generateScriptRecipe(
        geminiApiKey: String,
        niche: String,
        toneOfVoice: String
    ): Result<VideoScriptRecipeJSON> = withContext(Dispatchers.IO) {
        runCatching {
            require(geminiApiKey.isNotBlank()) { "Gemini API key cannot be blank." }

            val prompt = """
                Act as an expert viral YouTube Shorts scriptwriter.
                Generate a 50-second motivational/educational vertical video script in the "$niche" niche
                with a "$toneOfVoice" tone of voice.
                
                Output strictly as a valid JSON object matching VideoScriptRecipeJSON with no markdown formatting:
                {
                  "targetTopic": "Catchy Viral Short Title (under 65 chars)",
                  "voiceScript": "Full 50-second spoken voiceover script (~125-135 words)",
                  "bRollKeywords": [
                    "portrait keyword 1",
                    "portrait keyword 2",
                    "portrait keyword 3",
                    "portrait keyword 4",
                    "portrait keyword 5"
                  ],
                  "captionsTimeline": [
                    { "word": "Word", "startTimeMs": 0, "endTimeMs": 320 }
                  ]
                }
                Requirements:
                1. bRollKeywords MUST contain EXACTLY 5 visual search keywords for Pexels vertical stock videos.
                2. captionsTimeline MUST contain sequential word-level startTimeMs and endTimeMs spanning ~0 to 50000ms.
            """.trimIndent()

            val requestPayload = GeminiRequestPayload(
                contents = listOf(
                    GeminiContentItem(parts = listOf(GeminiTextPart(text = prompt)))
                ),
                generationConfig = GeminiGenerationConfig(
                    responseMimeType = "application/json",
                    temperature = 0.7
                )
            )

            val requestBodyString = json.encodeToString(GeminiRequestPayload.serializer(), requestPayload)
            val endpointUrl =
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=$geminiApiKey"

            val request = Request.Builder()
                .url(endpointUrl)
                .addHeader("Content-Type", "application/json")
                .post(requestBodyString.toRequestBody("application/json; charset=utf-8".toMediaType()))
                .build()

            okHttpClient.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    val errorBody = response.body?.string().orEmpty()
                    throw IOException("Gemini API HTTP ${response.code}: ${response.message} - $errorBody")
                }

                val bodyString = response.body?.string()
                    ?: throw IOException("Gemini API returned an empty response body.")

                val parsedEnvelope = json.decodeFromString(GeminiResponsePayload.serializer(), bodyString)
                val rawModelText = parsedEnvelope.candidates.firstOrNull()
                    ?.content?.parts?.firstOrNull()?.text
                    ?: throw IOException("Gemini API returned no candidate text.")

                val sanitizedJson = rawModelText
                    .trim()
                    .removePrefix("```json")
                    .removePrefix("```")
                    .removeSuffix("```")
                    .trim()

                val parsedRecipe = json.decodeFromString(VideoScriptRecipeJSON.serializer(), sanitizedJson)

                // Guarantee 5 keywords and non-empty captionsTimeline
                val normalizedKeywords = parsedRecipe.bRollKeywords.take(5).toMutableList()
                while (normalizedKeywords.size < 5) {
                    normalizedKeywords.add("$niche vertical aesthetic")
                }

                val normalizedTimeline = if (parsedRecipe.captionsTimeline.isNotEmpty()) {
                    parsedRecipe.captionsTimeline
                } else {
                    buildFallbackWordTimeline(parsedRecipe.voiceScript)
                }

                parsedRecipe.copy(
                    bRollKeywords = normalizedKeywords,
                    captionsTimeline = normalizedTimeline
                )
            }
        }
    }

    private fun buildFallbackWordTimeline(voiceScript: String): List<CaptionWordJSON> {
        val words = voiceScript.trim().split(Regex("\\s+")).filter { it.isNotBlank() }
        var currentMs = 0L
        return words.map { word ->
            val durationMs = (word.length * 55L + 140L).coerceIn(220L, 580L)
            val entry = CaptionWordJSON(
                word = word,
                startTimeMs = currentMs,
                endTimeMs = currentMs + durationMs
            )
            currentMs += durationMs + 35L
            entry
        }
    }
}
