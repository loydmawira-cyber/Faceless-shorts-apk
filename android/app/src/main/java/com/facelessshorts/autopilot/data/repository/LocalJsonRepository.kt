package com.facelessshorts.autopilot.data.repository

import android.content.Context
import com.facelessshorts.autopilot.data.models.AppSettingsJSON
import com.facelessshorts.autopilot.data.models.UploadLogEntryJSON
import com.facelessshorts.autopilot.data.models.VideoScriptRecipeJSON
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import java.io.File

/**
 * Manages local JSON persistence in the app's internal filesDir and cacheDir:
 * - app_settings.json (AppSettingsJSON)
 * - latest_script_recipe.json (VideoScriptRecipeJSON)
 * - upload_logs.json (List<UploadLogEntryJSON>)
 */
class LocalJsonRepository(private val context: Context) {

    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val settingsFile: File
        get() = File(context.filesDir, "app_settings.json")

    private val recipeFile: File
        get() = File(context.filesDir, "latest_script_recipe.json")

    private val uploadLogsFile: File
        get() = File(context.filesDir, "upload_logs.json")

    private val prefs by lazy {
        context.getSharedPreferences("faceless_shorts_oauth_prefs", Context.MODE_PRIVATE)
    }

    fun loadSettings(): AppSettingsJSON {
        if (!settingsFile.exists()) return AppSettingsJSON()
        return runCatching {
            json.decodeFromString(AppSettingsJSON.serializer(), settingsFile.readText())
        }.getOrDefault(AppSettingsJSON())
    }

    fun saveSettings(settings: AppSettingsJSON) {
        runCatching {
            settingsFile.writeText(json.encodeToString(AppSettingsJSON.serializer(), settings))
        }
    }

    fun loadLatestScriptRecipe(): VideoScriptRecipeJSON? {
        if (!recipeFile.exists()) return null
        return runCatching {
            json.decodeFromString(VideoScriptRecipeJSON.serializer(), recipeFile.readText())
        }.getOrNull()
    }

    fun saveLatestScriptRecipe(recipe: VideoScriptRecipeJSON) {
        runCatching {
            recipeFile.writeText(json.encodeToString(VideoScriptRecipeJSON.serializer(), recipe))
        }
    }

    fun loadUploadLogs(): List<UploadLogEntryJSON> {
        if (!uploadLogsFile.exists()) return emptyList()
        return runCatching {
            json.decodeFromString(
                ListSerializer(UploadLogEntryJSON.serializer()),
                uploadLogsFile.readText()
            )
        }.getOrDefault(emptyList())
    }

    suspend fun appendUploadLog(entry: UploadLogEntryJSON) = withContext(Dispatchers.IO) {
        val current = loadUploadLogs()
        val updated = listOf(entry) + current
        uploadLogsFile.writeText(
            json.encodeToString(ListSerializer(UploadLogEntryJSON.serializer()), updated)
        )
    }

    fun getDownloadedBRollFiles(): List<File> {
        val folder = File(context.cacheDir, "broll_clips")
        if (!folder.exists()) return emptyList()
        return folder.listFiles { file -> file.extension.equals("mp4", ignoreCase = true) }
            ?.sortedBy { it.name }
            ?: emptyList()
    }

    fun saveAuthenticatedYouTubeAccount(email: String) {
        prefs.edit().putString("youtube_account_email", email).apply()
    }

    fun getAuthenticatedYouTubeAccount(): String? {
        return prefs.getString("youtube_account_email", null)
    }

    fun savePipelineStatus(status: String) {
        prefs.edit().putString("pipeline_status", status).apply()
    }

    fun getPipelineStatus(): String {
        return prefs.getString("pipeline_status", "Idle / Waiting for next cycle")
            ?: "Idle / Waiting for next cycle"
    }
}
