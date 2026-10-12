package com.facelessshorts.autopilot.network

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

/**
 * Step 4: Automated YouTube Upload
 * Uses the Google API Client Library for Java/Kotlin with OAuth 2.0 credentials
 * to upload the finished 9:16 MP4 file to the YouTube Data API v3 `videos.insert` endpoint.
 */
class YouTubeUploadService(private val context: Context) {

    /**
     * Creates a GoogleAccountCredential scoped for YouTube uploads (`youtube.upload`).
     */
    fun getCredentialForAccount(accountEmail: String): GoogleAccountCredential {
        return GoogleAccountCredential.usingOAuth2(
            context,
            listOf(YouTubeScopes.YOUTUBE_UPLOAD)
        ).apply {
            selectedAccount = Account(accountEmail, "com.google")
        }
    }

    /**
     * Sends the finished local MP4 file to YouTube Data API v3 `videos.insert`.
     * - Dynamically sets the video snippet title (with #Shorts)
     * - Sets video privacy status to "public"
     * - Assigns it as a "YouTube Short" (#Shorts in title/description + 9:16 vertical aspect)
     * - Flags it as "not made for kids" (selfDeclaredMadeForKids = false)
     */
    suspend fun uploadShortVideo(
        accountEmail: String,
        mp4File: File,
        targetTopic: String,
        niche: String,
        bRollKeywords: List<String>
    ): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            require(mp4File.exists() && mp4File.length() > 0L) {
                "Rendered MP4 file does not exist or is empty: ${mp4File.absolutePath}"
            }

            val credential = getCredentialForAccount(accountEmail)

            val youtube = YouTube.Builder(
                NetHttpTransport(),
                GsonFactory.getDefaultInstance(),
                credential
            )
                .setApplicationName("FacelessShorts AutoPilot")
                .build()

            val baseTitle = targetTopic.trim().take(85)
            val shortTitle = if (baseTitle.contains("#Shorts", ignoreCase = true)) {
                baseTitle
            } else {
                "$baseTitle #Shorts"
            }

            val snippet = VideoSnippet().apply {
                title = shortTitle
                description = buildString {
                    appendLine(targetTopic)
                    appendLine()
                    appendLine("Automated daily faceless vertical video in the $niche niche.")
                    appendLine("#Shorts #YouTubeShorts #${niche.replace(" ", "")}")
                }
                tags = (bRollKeywords + listOf("Shorts", "YouTubeShorts", niche)).distinct()
                categoryId = "27" // Education / Motivation category
            }

            val status = VideoStatus().apply {
                privacyStatus = "public"
                selfDeclaredMadeForKids = false
            }

            val videoObject = Video().apply {
                this.snippet = snippet
                this.status = status
            }

            BufferedInputStream(FileInputStream(mp4File)).use { inputStream ->
                val mediaContent = InputStreamContent("video/mp4", inputStream).apply {
                    length = mp4File.length()
                }

                val videosInsert = youtube.videos().insert(
                    listOf("snippet", "status"),
                    videoObject,
                    mediaContent
                )

                // Configure resumable upload chunks for reliable network handling
                videosInsert.mediaHttpUploader.apply {
                    isDirectUploadEnabled = false
                    chunkSize = 4 * 1024 * 1024 // 4 MB chunks
                }

                val uploadedVideo = videosInsert.execute()
                uploadedVideo.id ?: throw IllegalStateException("YouTube API returned null video ID")
            }
        }
    }
}
