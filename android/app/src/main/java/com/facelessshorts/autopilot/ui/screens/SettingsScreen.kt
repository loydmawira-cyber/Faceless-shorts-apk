package com.facelessshorts.autopilot.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Key
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.facelessshorts.autopilot.data.models.AppSettingsJSON

/**
 * Settings Screen (Jetpack Compose Material You Dark Theme):
 * - Clean text inputs for user API keys (Google Gemini Free API Key & Pexels Free API Key)
 * - Niche dropdown menu & Tone of Voice selector
 * - Prominent "Authenticate YouTube Channel" OAuth 2.0 status button
 * - Persists directly to AppSettingsJSON (`app_settings.json`) and schedules the 24h WorkManager task
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    initialSettings: AppSettingsJSON,
    authenticatedEmail: String?,
    onAuthenticateYouTubeClick: () -> Unit,
    onSaveSettings: (AppSettingsJSON) -> Unit
) {
    val niches = listOf(
        "Motivation & Mindset",
        "Tech & AI Facts",
        "Philosophy & Stoicism",
        "Dark Psychology",
        "Financial Lifehacks"
    )

    val tones = listOf(
        "Cinematic & Deep",
        "High-Energy",
        "Calm & Stoic",
        "Documentary"
    )

    var selectedNiche by remember(initialSettings) { mutableStateOf(initialSettings.niche) }
    var nicheExpanded by remember { mutableStateOf(false) }

    var selectedTone by remember(initialSettings) { mutableStateOf(initialSettings.toneOfVoice) }
    var frequencyPerDay by remember(initialSettings) { mutableIntStateOf(initialSettings.frequencyPerDay) }

    var geminiApiKey by remember(initialSettings) { mutableStateOf(initialSettings.geminiApiKey) }
    var pexelsApiKey by remember(initialSettings) { mutableStateOf(initialSettings.pexelsApiKey) }
    var savedBannerVisible by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF141218))
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "CAMPAIGN & FREE API CONFIGURATION",
            style = MaterialTheme.typography.labelSmall,
            color = Color(0xFFCDBDFF)
        )
        Text(
            text = "Strategy & Pipeline Settings",
            style = MaterialTheme.typography.headlineSmall,
            color = Color(0xFFE7E0E9),
            fontWeight = FontWeight.Bold
        )

        // 1. Niche Dropdown Menu & Tone Selector Card
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "1. Content Niche & Voice Archetype",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color(0xFFE7E0E9),
                    fontWeight = FontWeight.SemiBold
                )

                ExposedDropdownMenuBox(
                    expanded = nicheExpanded,
                    onExpandedChange = { nicheExpanded = !nicheExpanded }
                ) {
                    OutlinedTextField(
                        value = selectedNiche,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Select Content Niche") },
                        trailingIcon = {
                            ExposedDropdownMenuDefaults.TrailingIcon(expanded = nicheExpanded)
                        },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFF7C4DFF),
                            unfocusedBorderColor = Color(0xFF494455),
                            focusedTextColor = Color(0xFFE7E0E9),
                            unfocusedTextColor = Color(0xFFE7E0E9)
                        )
                    )

                    ExposedDropdownMenu(
                        expanded = nicheExpanded,
                        onDismissRequest = { nicheExpanded = false }
                    ) {
                        niches.forEach { nicheOption ->
                            DropdownMenuItem(
                                text = { Text(nicheOption) },
                                onClick = {
                                    selectedNiche = nicheOption
                                    nicheExpanded = false
                                }
                            )
                        }
                    }
                }

                Text(
                    text = "Tone of Voice",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color(0xFFCAC3D8)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    tones.take(2).forEach { tone ->
                        FilterChip(
                            selected = selectedTone == tone,
                            onClick = { selectedTone = tone },
                            label = { Text(tone) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    tones.drop(2).forEach { tone ->
                        FilterChip(
                            selected = selectedTone == tone,
                            onClick = { selectedTone = tone },
                            label = { Text(tone) },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Text(
                    text = "Daily Posting Frequency: ${frequencyPerDay}x / Day",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color(0xFFFFB59E)
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(1, 2, 3).forEach { freq ->
                        FilterChip(
                            selected = frequencyPerDay == freq,
                            onClick = { frequencyPerDay = freq },
                            label = { Text("${freq}x Daily") }
                        )
                    }
                }
            }
        }

        // 2. Free API Keys Card (Gemini & Pexels)
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Key,
                        contentDescription = null,
                        tint = Color(0xFFFFB954)
                    )
                    Text(
                        text = "2. Free API Keys (AppSettingsJSON)",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFFE7E0E9),
                        fontWeight = FontWeight.SemiBold
                    )
                }

                OutlinedTextField(
                    value = geminiApiKey,
                    onValueChange = { geminiApiKey = it },
                    label = { Text("Google Gemini Free API Key") },
                    placeholder = { Text("AIzaSy...") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF7C4DFF),
                        unfocusedBorderColor = Color(0xFF494455)
                    )
                )

                OutlinedTextField(
                    value = pexelsApiKey,
                    onValueChange = { pexelsApiKey = it },
                    label = { Text("Pexels Free Video API Key") },
                    placeholder = { Text("Enter Pexels API Key...") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFF7C4DFF),
                        unfocusedBorderColor = Color(0xFF494455)
                    )
                )
            }
        }

        // 3. Prominent Authenticate YouTube Channel OAuth 2.0 Card
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "3. YouTube Data API v3 OAuth 2.0",
                    style = MaterialTheme.typography.titleMedium,
                    color = Color(0xFFE7E0E9),
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = if (authenticatedEmail != null) {
                        "Authenticated Account: $authenticatedEmail (Scope: youtube.upload)"
                    } else {
                        "Connect your Google account to allow DailyVideoWorker to upload public Shorts automatically."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFFCAC3D8)
                )

                Button(
                    onClick = onAuthenticateYouTubeClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(999.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (authenticatedEmail != null) Color(0xFF2B292F) else Color(0xFFFF4E45),
                        contentColor = Color.White
                    )
                ) {
                    Icon(
                        imageVector = if (authenticatedEmail != null) Icons.Default.CheckCircle else Icons.Default.AccountCircle,
                        contentDescription = null
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = if (authenticatedEmail != null) {
                            "YouTube Channel Connected ($authenticatedEmail)"
                        } else {
                            "Authenticate YouTube Channel"
                        },
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // 4. Save Campaign & Schedule 24h WorkManager Button
        Button(
            onClick = {
                val updated = initialSettings.copy(
                    niche = selectedNiche,
                    frequencyPerDay = frequencyPerDay,
                    toneOfVoice = selectedTone,
                    geminiApiKey = geminiApiKey.trim(),
                    pexelsApiKey = pexelsApiKey.trim()
                )
                onSaveSettings(updated)
                savedBannerVisible = true
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            shape = RoundedCornerShape(999.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFF7C4DFF),
                contentColor = Color.White
            )
        ) {
            Icon(imageVector = Icons.Default.AutoAwesome, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text(
                text = "Save AppSettingsJSON & Schedule 24h Auto-Pilot",
                fontWeight = FontWeight.Bold
            )
        }

        if (savedBannerVisible) {
            Text(
                text = "Saved to filesDir/app_settings.json & scheduled DailyVideoWorker (24h cycle).",
                style = MaterialTheme.typography.labelMedium,
                color = Color(0xFF10B981)
            )
        }
    }
}
