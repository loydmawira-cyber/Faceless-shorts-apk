package com.facelessshorts.autopilot.network

import com.facelessshorts.autopilot.data.models.PexelsSearchResponseJSON
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.io.FileOutputStream
import java.io.IOException
import java.net.URLEncoder
import java.util.concurrent.TimeUnit

/**
 * Step 2: Free B-Roll Ingestion via Pexels Video Search API.
 * Filters exclusively for vertical (portrait) video URLs and downloads the top 3 matching .mp4
 * stock video clips to the app's local internal cache folder (context.cacheDir/broll_clips).
 */
class PexelsApiService {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(90, TimeUnit.SECONDS)
        .retryOnConnectionFailure(true)
        .build()

    suspend fun downloadTopThreePortraitClips(
        pexelsApiKey: String,
        bRollKeywords: List<String>,
        cacheDir: File
    ): Result<List<File>> = withContext(Dispatchers.IO) {
        runCatching {
            require(pexelsApiKey.isNotBlank()) { "Pexels API key cannot be blank." }

            val targetDir = File(cacheDir, "broll_clips").apply {
                if (!exists()) mkdirs()
            }

            val downloadedClips = mutableListOf<File>()

            for (keyword in bRollKeywords) {
                if (downloadedClips.size >= 3) break

                val encodedQuery = URLEncoder.encode(keyword, "UTF-8")
                val searchUrl =
                    "https://api.pexels.com/videos/search?query=$encodedQuery&orientation=portrait&size=medium&per_page=5"

                val request = Request.Builder()
                    .url(searchUrl)
                    .addHeader("Authorization", pexelsApiKey)
                    .get()
                    .build()

                okHttpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) {
                        throw IOException("Pexels API HTTP ${response.code}: ${response.message}")
                    }

                    val bodyString = response.body?.string()
                        ?: throw IOException("Empty response body from Pexels API")

                    val searchResponse = json.decodeFromString(
                        PexelsSearchResponseJSON.serializer(),
                        bodyString
                    )

                    // Select the best vertical (portrait: height > width) MP4 video file
                    val bestPortraitMp4Url = searchResponse.videos
                        .flatMap { video -> video.videoFiles }
                        .filter { file ->
                            file.fileType.equals("video/mp4", ignoreCase = true) &&
                                (file.height ?: 1920) > (file.width ?: 1080)
                        }
                        .sortedByDescending { file -> file.height ?: 0 }
                        .firstOrNull()?.link

                    if (bestPortraitMp4Url != null) {
                        val clipNumber = downloadedClips.size + 1
                        val outFile = File(targetDir, "broll_clip_$clipNumber.mp4")
                        downloadMp4ToFile(bestPortraitMp4Url, outFile)
                        downloadedClips.add(outFile)
                    }
                }
            }

            if (downloadedClips.size < 3) {
                throw IOException(
                    "Only downloaded ${downloadedClips.size}/3 portrait B-roll clips from Pexels."
                )
            }

            downloadedClips
        }
    }

    private fun downloadMp4ToFile(videoUrl: String, destinationFile: File) {
        val request = Request.Builder().url(videoUrl).get().build()
        okHttpClient.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                throw IOException("Failed downloading MP4 clip (${response.code}): $videoUrl")
            }
            val bodyStream = response.body?.byteStream()
                ?: throw IOException("Null byte stream when downloading MP4 clip")

            FileOutputStream(destinationFile).use { output ->
                val buffer = ByteArray(16 * 1024)
                var read: Int
                while (bodyStream.read(buffer).also { read = it } != -1) {
                    output.write(buffer, 0, read)
                }
                output.flush()
            }
        }
    }
}
