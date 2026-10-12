package com.facelessshorts.autopilot.worker

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

/**
 * Step 3: Local TTS & Rendering (The 100% Free Engine)
 * - Uses Android's native TextToSpeech engine (android.speech.tts.TextToSpeech) to synthesize
 *   the generated voiceScript string into a local audio file (`voice.wav`).
 * - Executes FFmpeg via `ffmpeg-kit-full` to merge the 3 downloaded stock video clips sequentially,
 *   overlay and mix `voice.wav`, and burn center-screen word-by-word subtitles mapped to CaptionWordJSON.
 */
class LocalMediaAndFFmpegEngine(private val context: Context) {

    /**
     * Converts the generated voiceScript string into a local audio file (`voice.wav`)
     * using Android's native TextToSpeech engine.
     */
    suspend fun synthesizeScriptToWavFile(
        voiceScript: String,
        outputWavFile: File
    ): Result<File> = withContext(Dispatchers.Main) {
        runCatching {
            suspendCancellableCoroutine<File> { continuation ->
                var tts: TextToSpeech? = null
                val utteranceId = "faceless_tts_${System.currentTimeMillis()}"

                tts = TextToSpeech(context) { initStatus ->
                    if (initStatus != TextToSpeech.SUCCESS) {
                        if (continuation.isActive) {
                            continuation.resumeWithException(
                                IllegalStateException("Android TextToSpeech init failed: $initStatus")
                            )
                        }
                        return@TextToSpeech
                    }

                    val engine = tts ?: return@TextToSpeech
                    engine.language = Locale.US
                    engine.setSpeechRate(1.04f)
                    engine.setPitch(0.92f)

                    engine.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                        override fun onStart(utteranceId: String?) = Unit

                        override fun onDone(utteranceId: String?) {
                            engine.stop()
                            engine.shutdown()
                            if (continuation.isActive) {
                                continuation.resume(outputWavFile)
                            }
                        }

                        @Deprecated("Deprecated in Java")
                        override fun onError(utteranceId: String?) {
                            engine.shutdown()
                            if (continuation.isActive) {
                                continuation.resumeWithException(
                                    RuntimeException("TextToSpeech synthesis failed for $utteranceId")
                                )
                            }
                        }

                        override fun onError(utteranceId: String?, errorCode: Int) {
                            engine.shutdown()
                            if (continuation.isActive) {
                                continuation.resumeWithException(
                                    RuntimeException("TextToSpeech error ($errorCode) on $utteranceId")
                                )
                            }
                        }
                    })

                    val params = Bundle()
                    val result = engine.synthesizeToFile(
                        voiceScript,
                        params,
                        outputWavFile,
                        utteranceId
                    )

                    if (result != TextToSpeech.SUCCESS && continuation.isActive) {
                        engine.shutdown()
                        continuation.resumeWithException(
                            RuntimeException("synthesizeToFile returned error code $result")
                        )
                    }
                }

                continuation.invokeOnCancellation {
                    tts?.stop()
                    tts?.shutdown()
                }
            }
        }
    }

    /**
     * Executes FFmpegKit to:
     * a. Merge the 3 downloaded stock video clips sequentially into a 9:16 (1080x1920) stream.
     * b. Overlay and mix the local TTS `voice.wav` file.
     * c. Burn fast, stylized center-screen word-by-word subtitles mapped to CaptionWordJSON.
     * d. Output a high-definition 9:16 vertical MP4 video file.
     */
    suspend fun renderVerticalShortWithFFmpeg(
        bRollClips: List<File>,
        voiceWavFile: File,
        captionsTimeline: List<CaptionWordJSON>,
        outputMp4File: File
    ): Result<File> = withContext(Dispatchers.IO) {
        runCatching {
            require(bRollClips.size >= 3) { "FFmpeg requires 3 downloaded B-roll clips." }
            require(voiceWavFile.exists()) { "Synthesized voice.wav file is missing." }

            val clip1 = bRollClips[0].absolutePath
            val clip2 = bRollClips[1].absolutePath
            val clip3 = bRollClips[2].absolutePath
            val voiceWav = voiceWavFile.absolutePath
            val outputMp4 = outputMp4File.absolutePath

            val drawTextChain = buildWordByWordDrawTextFilter(captionsTimeline)

            val filterComplex = buildString {
                append("[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,trim=duration=17,setpts=PTS-STARTPTS[v0];")
                append("[1:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,trim=duration=17,setpts=PTS-STARTPTS[v1];")
                append("[2:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,trim=duration=17,setpts=PTS-STARTPTS[v2];")
                append("[v0][v1][v2]concat=n=3:v=1:a=0[vconcat];")
                if (drawTextChain.isNotEmpty()) {
                    append("[vconcat]$drawTextChain[vout]")
                } else {
                    append("[vconcat]null[vout]")
                }
            }

            val command = listOf(
                "-y",
                "-i", "\"$clip1\"",
                "-i", "\"$clip2\"",
                "-i", "\"$clip3\"",
                "-i", "\"$voiceWav\"",
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
                "\"$outputMp4\""
            ).joinToString(" ")

            val session = FFmpegKit.execute(command)
            val returnCode = session.returnCode

            if (!ReturnCode.isSuccess(returnCode)) {
                throw IllegalStateException(
                    "FFmpegKit execution failed (rc=$returnCode): ${session.allLogsAsString.takeLast(600)}"
                )
            }

            outputMp4File
        }
    }

    /**
     * Maps each CaptionWordJSON(word, startTimeMs, endTimeMs) to an FFmpeg `drawtext` filter
     * that renders center-screen (`x=(w-text_w)/2:y=(h-text_h)/2`) during `between(t,start,end)`.
     */
    fun buildWordByWordDrawTextFilter(captions: List<CaptionWordJSON>): String {
        return captions.joinToString(separator = ",") { item ->
            val startSec = String.format(Locale.US, "%.3f", item.startTimeMs / 1000.0)
            val endSec = String.format(Locale.US, "%.3f", item.endTimeMs / 1000.0)
            val escapedWord = item.word
                .uppercase(Locale.US)
                .replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace(":", "\\:")
                .replace(",", "\\,")

            "drawtext=text='$escapedWord':" +
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
}
