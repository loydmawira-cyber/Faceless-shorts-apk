package com.facelessshorts.autopilot.worker

import android.content.Context
import android.os.Build
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.facelessshorts.autopilot.data.models.UploadLogEntryJSON
import com.facelessshorts.autopilot.data.repository.LocalJsonRepository
import com.facelessshorts.autopilot.network.GeminiApiService
import com.facelessshorts.autopilot.network.PexelsApiService
import com.facelessshorts.autopilot.network.YouTubeUploadService
import java.io.File
import java.util.UUID
import java.util.concurrent.TimeUnit

/**
 * Local Background Processing:
 * Android Jetpack WorkManager `DailyVideoWorker` that schedules once every 24 hours.
 * Only executes when the device is connected to Wi-Fi (UNMETERED), Charging, and Idle.
 * Executes the 4-step pipeline sequentially.
 */
class DailyVideoWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    private val repository = LocalJsonRepository(appContext)
    private val geminiApiService = GeminiApiService()
    private val pexelsApiService = PexelsApiService()
    private val mediaEngine = LocalMediaAndFFmpegEngine(appContext)
    private val youtubeUploadService = YouTubeUploadService(appContext)

    override suspend fun doWork(): Result {
        val settings = repository.loadSettings()

        if (settings.geminiApiKey.isBlank() || settings.pexelsApiKey.isBlank()) {
            val msg = "Missing Gemini or Pexels API Key in Settings."
            repository.savePipelineStatus("Error: $msg")
            return Result.failure(workDataOf(KEY_STATUS to msg))
        }

        // =========================================================================
        // STEP 1: AI Script Generation (Google Gemini API -> VideoScriptRecipeJSON)
        // =========================================================================
        updateStage("Processing: Step 1/4 Generating AI Script", 15)
        val scriptRecipe = geminiApiService.generateScriptRecipe(
            geminiApiKey = settings.geminiApiKey,
            niche = settings.niche,
            toneOfVoice = settings.toneOfVoice
        ).getOrElse { error ->
            val msg = "Step 1 Gemini Error: ${error.localizedMessage}"
            repository.savePipelineStatus("Network Retry: $msg")
            return Result.retry()
        }
        repository.saveLatestScriptRecipe(scriptRecipe)

        // =========================================================================
        // STEP 2: Free B-Roll Ingestion (Pexels Portrait MP4s -> cacheDir)
        // =========================================================================
        updateStage("Processing: Step 2/4 Downloading Pexels B-Roll", 40)
        val bRollClips = pexelsApiService.downloadTopThreePortraitClips(
            pexelsApiKey = settings.pexelsApiKey,
            bRollKeywords = scriptRecipe.bRollKeywords,
            cacheDir = applicationContext.cacheDir
        ).getOrElse { error ->
            val msg = "Step 2 Pexels Error: ${error.localizedMessage}"
            repository.savePipelineStatus("Network Retry: $msg")
            return Result.retry()
        }

        // =========================================================================
        // STEP 3: Local TTS & FFmpeg Rendering (voice.wav + 3 Clips + Subtitles)
        // =========================================================================
        updateStage("Processing: Step 3/4 Rendering Video & TTS", 70)
        val voiceWavFile = File(applicationContext.cacheDir, "voice.wav")
        mediaEngine.synthesizeScriptToWavFile(
            voiceScript = scriptRecipe.voiceScript,
            outputWavFile = voiceWavFile
        ).getOrElse { error ->
            val msg = "Step 3 TTS Error: ${error.localizedMessage}"
            repository.savePipelineStatus(msg)
            return Result.failure(workDataOf(KEY_STATUS to msg))
        }

        val finalMp4File = File(
            applicationContext.cacheDir,
            "faceless_short_${System.currentTimeMillis()}.mp4"
        )
        mediaEngine.renderVerticalShortWithFFmpeg(
            bRollClips = bRollClips,
            voiceWavFile = voiceWavFile,
            captionsTimeline = scriptRecipe.captionsTimeline,
            outputMp4File = finalMp4File
        ).getOrElse { error ->
            val msg = "Step 3 FFmpeg Error: ${error.localizedMessage}"
            repository.savePipelineStatus(msg)
            return Result.failure(workDataOf(KEY_STATUS to msg))
        }

        // =========================================================================
        // STEP 4: Automated YouTube Upload (YouTube Data API v3 videos.insert)
        // =========================================================================
        updateStage("Processing: Step 4/4 Uploading YouTube Short", 90)
        val accountEmail = repository.getAuthenticatedYouTubeAccount()
        if (accountEmail.isNullOrBlank()) {
            val msg = "Rendered MP4 Ready (Connect YouTube OAuth to auto-publish)"
            repository.savePipelineStatus(msg)
            val now = System.currentTimeMillis()
            repository.saveSettings(settings.copy(lastRunTimestamp = now))
            repository.appendUploadLog(
                UploadLogEntryJSON(
                    id = UUID.randomUUID().toString(),
                    title = scriptRecipe.targetTopic,
                    youtubeVideoId = null,
                    status = "Rendered Locally",
                    timestamp = now,
                    durationSec = 50
                )
            )
            return Result.success(workDataOf(KEY_STATUS to msg))
        }

        val uploadedVideoId = youtubeUploadService.uploadShortVideo(
            accountEmail = accountEmail,
            mp4File = finalMp4File,
            targetTopic = scriptRecipe.targetTopic,
            niche = settings.niche,
            bRollKeywords = scriptRecipe.bRollKeywords
        ).getOrElse { error ->
            val msg = "Step 4 YouTube Upload Retry: ${error.localizedMessage}"
            repository.savePipelineStatus(msg)
            return Result.retry()
        }

        val completedTimestamp = System.currentTimeMillis()
        repository.saveSettings(settings.copy(lastRunTimestamp = completedTimestamp))
        repository.appendUploadLog(
            UploadLogEntryJSON(
                id = UUID.randomUUID().toString(),
                title = scriptRecipe.targetTopic,
                youtubeVideoId = uploadedVideoId,
                status = "Published",
                timestamp = completedTimestamp,
                durationSec = 50,
                viewsCount = 0
            )
        )

        val finalStatus = "Idle / Waiting for next cycle (Last ID: $uploadedVideoId)"
        updateStage(finalStatus, 100)
        return Result.success(
            workDataOf(
                KEY_STATUS to finalStatus,
                KEY_YOUTUBE_ID to uploadedVideoId
            )
        )
    }

    private suspend fun updateStage(status: String, progress: Int) {
        repository.savePipelineStatus(status)
        setProgress(workDataOf(KEY_STATUS to status, KEY_PROGRESS to progress))
    }

    companion object {
        const val UNIQUE_PERIODIC_WORK_NAME = "FacelessShorts_DailyVideoWorker_24H"
        const val KEY_STATUS = "pipeline_status"
        const val KEY_PROGRESS = "pipeline_progress"
        const val KEY_YOUTUBE_ID = "youtube_video_id"

        /**
         * Schedules DailyVideoWorker once every 24 hours.
         * Enforces that the worker ONLY executes when:
         * 1. Connected to Wi-Fi (NetworkType.UNMETERED)
         * 2. Charging (setRequiresCharging(true))
         * 3. Device Idle (setRequiresDeviceIdle(true))
         */
        fun scheduleDaily24HourWorker(context: Context) {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.UNMETERED)
                .setRequiresCharging(true)
                .apply {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        setRequiresDeviceIdle(true)
                    }
                }
                .build()

            val periodicWorkRequest = PeriodicWorkRequestBuilder<DailyVideoWorker>(
                24,
                TimeUnit.HOURS
            )
                .setConstraints(constraints)
                .addTag(UNIQUE_PERIODIC_WORK_NAME)
                .build()

            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                UNIQUE_PERIODIC_WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                periodicWorkRequest
            )
        }

        /**
         * Triggers an immediate on-demand run of DailyVideoWorker for testing/manual generation.
         */
        fun runOnceImmediately(context: Context) {
            val immediateRequest = OneTimeWorkRequestBuilder<DailyVideoWorker>()
                .addTag(UNIQUE_PERIODIC_WORK_NAME)
                .build()
            WorkManager.getInstance(context).enqueue(immediateRequest)
        }
    }
}
