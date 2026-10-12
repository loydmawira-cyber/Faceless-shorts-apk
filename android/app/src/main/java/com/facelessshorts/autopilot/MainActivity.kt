package com.facelessshorts.autopilot

import android.accounts.AccountManager
import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.VideoLibrary
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.work.WorkInfo
import androidx.work.WorkManager
import com.facelessshorts.autopilot.data.repository.LocalJsonRepository
import com.facelessshorts.autopilot.ui.screens.DashboardScreen
import com.facelessshorts.autopilot.ui.screens.MediaPreviewScreen
import com.facelessshorts.autopilot.ui.screens.SettingsScreen
import com.facelessshorts.autopilot.worker.DailyVideoWorker
import com.google.android.gms.common.AccountPicker

private val FacelessShortsDarkColorScheme = darkColorScheme(
    primary = Color(0xFFCDBDFF),
    onPrimary = Color(0xFF370096),
    primaryContainer = Color(0xFF7C4DFF),
    onPrimaryContainer = Color(0xFFFCF6FF),
    secondary = Color(0xFFFFB59E),
    onSecondary = Color(0xFF5E1700),
    secondaryContainer = Color(0xFF7F2A0D),
    onSecondaryContainer = Color(0xFFFF9B7C),
    tertiary = Color(0xFFFFB954),
    background = Color(0xFF141218),
    onBackground = Color(0xFFE7E0E9),
    surface = Color(0xFF141218),
    onSurface = Color(0xFFE7E0E9),
    surfaceVariant = Color(0xFF211F25),
    onSurfaceVariant = Color(0xFFCAC3D8)
)

/**
 * Single-Activity Architecture entry point for FacelessShorts AutoPilot.
 * Hosts all Jetpack Compose screens (DashboardScreen, SettingsScreen, MediaPreviewScreen)
 * and observes WorkManager `DailyVideoWorker` status in real time.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val repository = LocalJsonRepository(applicationContext)

        // Ensure the 24-hour background worker is scheduled under Wi-Fi + Charging + Idle constraints
        DailyVideoWorker.scheduleDaily24HourWorker(applicationContext)

        setContent {
            MaterialTheme(colorScheme = FacelessShortsDarkColorScheme) {
                FacelessShortsAutoPilotApp(
                    repository = repository,
                    onScheduleWorker = {
                        DailyVideoWorker.scheduleDaily24HourWorker(applicationContext)
                    },
                    onTriggerImmediateWorker = {
                        DailyVideoWorker.runOnceImmediately(applicationContext)
                    }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FacelessShortsAutoPilotApp(
    repository: LocalJsonRepository,
    onScheduleWorker: () -> Unit,
    onTriggerImmediateWorker: () -> Unit
) {
    var selectedTab by remember { mutableStateOf("dashboard") }
    var settings by remember { mutableStateOf(repository.loadSettings()) }
    var uploadLogs by remember { mutableStateOf(repository.loadUploadLogs()) }
    var latestRecipe by remember { mutableStateOf(repository.loadLatestScriptRecipe()) }
    var downloadedClips by remember { mutableStateOf(repository.getDownloadedBRollFiles()) }
    var authenticatedEmail by remember { mutableStateOf(repository.getAuthenticatedYouTubeAccount()) }
    var pipelineStatus by remember { mutableStateOf(repository.getPipelineStatus()) }
    var pipelineProgress by remember { mutableIntStateOf(100) }

    // Observe WorkManager state updates for DailyVideoWorker
    val context = androidx.compose.ui.platform.LocalContext.current
    DisposableEffect(context) {
        val liveData = WorkManager.getInstance(context)
            .getWorkInfosByTagLiveData(DailyVideoWorker.UNIQUE_PERIODIC_WORK_NAME)

        val observer = androidx.lifecycle.Observer<List<WorkInfo>> { workInfos ->
            val activeInfo = workInfos?.firstOrNull {
                it.state == WorkInfo.State.RUNNING || it.state == WorkInfo.State.ENQUEUED
            } ?: workInfos?.firstOrNull()

            if (activeInfo != null) {
                val progressStatus = activeInfo.progress.getString(DailyVideoWorker.KEY_STATUS)
                val progressValue = activeInfo.progress.getInt(DailyVideoWorker.KEY_PROGRESS, -1)
                if (!progressStatus.isNullOrBlank()) {
                    pipelineStatus = progressStatus
                }
                if (progressValue in 0..100) {
                    pipelineProgress = progressValue
                }
                // Refresh local JSON models when worker finishes
                if (activeInfo.state == WorkInfo.State.SUCCEEDED) {
                    uploadLogs = repository.loadUploadLogs()
                    latestRecipe = repository.loadLatestScriptRecipe()
                    downloadedClips = repository.getDownloadedBRollFiles()
                    pipelineStatus = repository.getPipelineStatus()
                    pipelineProgress = 100
                }
            }
        }
        liveData.observeForever(observer)
        onDispose {
            liveData.removeObserver(observer)
        }
    }

    // OAuth 2.0 Google Account Picker Launcher for YouTube Data API v3 authentication
    val accountPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val selectedEmail = result.data?.getStringExtra(AccountManager.KEY_ACCOUNT_NAME)
            if (!selectedEmail.isNullOrBlank()) {
                repository.saveAuthenticatedYouTubeAccount(selectedEmail)
                authenticatedEmail = selectedEmail
            }
        }
    }

    Scaffold(
        containerColor = Color(0xFF141218),
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "FacelessShorts AutoPilot",
                        color = Color(0xFFE7E0E9)
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF141218)
                )
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color(0xFF211F25)) {
                NavigationBarItem(
                    selected = selectedTab == "dashboard",
                    onClick = {
                        uploadLogs = repository.loadUploadLogs()
                        pipelineStatus = repository.getPipelineStatus()
                        selectedTab = "dashboard"
                    },
                    icon = { Icon(Icons.Default.Dashboard, contentDescription = "Dashboard") },
                    label = { Text("Dashboard") }
                )
                NavigationBarItem(
                    selected = selectedTab == "settings",
                    onClick = { selectedTab = "settings" },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") }
                )
                NavigationBarItem(
                    selected = selectedTab == "preview",
                    onClick = {
                        latestRecipe = repository.loadLatestScriptRecipe()
                        downloadedClips = repository.getDownloadedBRollFiles()
                        selectedTab = "preview"
                    },
                    icon = { Icon(Icons.Default.VideoLibrary, contentDescription = "Media Preview") },
                    label = { Text("Media Preview") }
                )
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedTab) {
                "dashboard" -> DashboardScreen(
                    pipelineStatus = pipelineStatus,
                    pipelineProgress = pipelineProgress,
                    settings = settings,
                    uploadLogs = uploadLogs,
                    onTriggerImmediateRun = onTriggerImmediateWorker
                )
                "settings" -> SettingsScreen(
                    initialSettings = settings,
                    authenticatedEmail = authenticatedEmail,
                    onAuthenticateYouTubeClick = {
                        val intent = AccountPicker.newChooseAccountIntent(
                            AccountPicker.AccountChooserOptions.Builder()
                                .setAllowableAccountsTypes(listOf("com.google"))
                                .build()
                        )
                        accountPickerLauncher.launch(intent)
                    },
                    onSaveSettings = { updated ->
                        settings = updated
                        repository.saveSettings(updated)
                        onScheduleWorker()
                    }
                )
                "preview" -> MediaPreviewScreen(
                    scriptRecipe = latestRecipe,
                    downloadedClipFiles = downloadedClips
                )
            }
        }
    }
}
