package com.facelessshorts.autopilot.data.models

import com.google.gson.annotations.SerializedName
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * 1. AppSettingsJSON: Holds user parameters for the automated campaign.
 * Annotated with both kotlinx.serialization (@Serializable/@SerialName) and Gson (@SerializedName).
 */
@Serializable
data class AppSettingsJSON(
    @SerialName("niche")
    @SerializedName("niche")
    val niche: String = "Motivation & Mindset",

    @SerialName("frequencyPerDay")
    @SerializedName("frequencyPerDay")
    val frequencyPerDay: Int = 2,

    @SerialName("toneOfVoice")
    @SerializedName("toneOfVoice")
    val toneOfVoice: String = "Cinematic & Deep",

    @SerialName("geminiApiKey")
    @SerializedName("geminiApiKey")
    val geminiApiKey: String = "",

    @SerialName("pexelsApiKey")
    @SerializedName("pexelsApiKey")
    val pexelsApiKey: String = "",

    @SerialName("lastRunTimestamp")
    @SerializedName("lastRunTimestamp")
    val lastRunTimestamp: Long = 0L
)

/**
 * 2. VideoScriptRecipeJSON: Returned by the AI script generation step (Step 1).
 * Contains a 50-second motivational/educational script, 5 targeted B-Roll search keywords,
 * and timed word-level captions for FFmpeg subtitle burning.
 */
@Serializable
data class VideoScriptRecipeJSON(
    @SerialName("targetTopic")
    @SerializedName("targetTopic")
    val targetTopic: String,

    @SerialName("voiceScript")
    @SerializedName("voiceScript")
    val voiceScript: String,

    @SerialName("bRollKeywords")
    @SerializedName("bRollKeywords")
    val bRollKeywords: List<String>,

    @SerialName("captionsTimeline")
    @SerializedName("captionsTimeline")
    val captionsTimeline: List<CaptionWordJSON>
)

/**
 * 3. CaptionWordJSON: Timed text segments for burning onto the 9:16 video.
 */
@Serializable
data class CaptionWordJSON(
    @SerialName("word")
    @SerializedName("word")
    val word: String,

    @SerialName("startTimeMs")
    @SerializedName("startTimeMs")
    val startTimeMs: Long,

    @SerialName("endTimeMs")
    @SerializedName("endTimeMs")
    val endTimeMs: Long
)

/**
 * Local JSON database record for past automated YouTube Shorts uploads.
 */
@Serializable
data class UploadLogEntryJSON(
    @SerialName("id")
    @SerializedName("id")
    val id: String,

    @SerialName("title")
    @SerializedName("title")
    val title: String,

    @SerialName("youtubeVideoId")
    @SerializedName("youtubeVideoId")
    val youtubeVideoId: String? = null,

    @SerialName("status")
    @SerializedName("status")
    val status: String,

    @SerialName("timestamp")
    @SerializedName("timestamp")
    val timestamp: Long,

    @SerialName("durationSec")
    @SerializedName("durationSec")
    val durationSec: Int = 50,

    @SerialName("viewsCount")
    @SerializedName("viewsCount")
    val viewsCount: Int = 0
)

/**
 * Pexels Video Search API JSON payload models (orientation=portrait).
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
    @SerialName("video_files") val videoFiles: List<PexelsVideoFileJSON> = emptyList()
)

@Serializable
data class PexelsVideoFileJSON(
    @SerialName("id") val id: Long,
    @SerialName("quality") val quality: String,
    @SerialName("file_type") val fileType: String,
    @SerialName("width") val width: Int? = null,
    @SerialName("height") val height: Int? = null,
    @SerialName("link") val link: String
)
