package com.facelessshorts.autopilot

import android.os.Bundle
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.viewinterop.AndroidView

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
 * MainActivity for FacelessShorts AutoPilot.
 * Renders a high-performance full-screen WebView hosting the exact same Faceless Reels Studio
 * web application interface (Create Reel, 9:16 motion video player, templates, speech synthesis, and export)
 * ensuring 100% feature and UI parity between the web preview and the Android APK.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme(colorScheme = FacelessShortsDarkColorScheme) {
                AndroidView(
                    factory = { context ->
                        WebView(context).apply {
                            layoutParams = ViewGroup.LayoutParams(
                                ViewGroup.LayoutParams.MATCH_PARENT,
                                ViewGroup.LayoutParams.MATCH_PARENT
                            )
                            settings.javaScriptEnabled = true
                            settings.domStorageEnabled = true
                            settings.loadsImagesAutomatically = true
                            settings.setSupportZoom(true)
                            settings.useWideViewPort = true
                            settings.loadWithOverviewMode = true
                            webViewClient = WebViewClient()
                            // Load the live development web app URL
                            loadUrl("https://ais-dev-wxkolr75hpgzpipzrpeghg-283647450851.europe-west2.run.app")
                        }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }
        }
    }
}
