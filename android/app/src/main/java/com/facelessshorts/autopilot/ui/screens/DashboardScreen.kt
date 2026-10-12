package com.facelessshorts.autopilot.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.facelessshorts.autopilot.data.models.AppSettingsJSON
import com.facelessshorts.autopilot.data.models.UploadLogEntryJSON
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Dashboard Screen (Jetpack Compose Material You Dark Theme):
 * - Displays pipeline status ("Idle / Waiting for next cycle", "Processing: Rendering Video")
 * - Summary card showing past upload logs parsed from local JSON log database (`upload_logs.json`)
 * - Analytics performance graphs & sparklines
 */
@Composable
fun DashboardScreen(
    pipelineStatus: String,
    pipelineProgress: Int,
    settings: AppSettingsJSON,
    uploadLogs: List<UploadLogEntryJSON>,
    onTriggerImmediateRun: () -> Unit
) {
    val dateFormatter = SimpleDateFormat("MMM dd, hh:mm a", Locale.US)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF141218))
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // 1. Pipeline Status Hero Card
        item {
            Card(
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(Color(0xFF36343A))
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF10B981))
                            )
                            Text(
                                text = pipelineStatus,
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFE7E0E9),
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        Text(
                            text = "${settings.frequencyPerDay}x / 24h",
                            style = MaterialTheme.typography.labelMedium,
                            color = Color(0xFFFFB59E)
                        )
                    }

                    Text(
                        text = "Niche: ${settings.niche}",
                        style = MaterialTheme.typography.titleLarge,
                        color = Color(0xFFE7E0E9),
                        fontWeight = FontWeight.Bold
                    )

                    Text(
                        text = "WorkManager Constraints: Wi-Fi (UNMETERED) • Charging • Device Idle",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFFCAC3D8)
                    )

                    LinearProgressIndicator(
                        progress = { (pipelineProgress.coerceIn(0, 100)) / 100f },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(8.dp)
                            .clip(CircleShape),
                        color = Color(0xFF7C4DFF),
                        trackColor = Color(0xFF36343A),
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Schedule,
                                contentDescription = null,
                                tint = Color(0xFFFFB954),
                                modifier = Modifier.size(16.dp)
                            )
                            val lastRunText = if (settings.lastRunTimestamp > 0L) {
                                "Last Run: ${dateFormatter.format(Date(settings.lastRunTimestamp))}"
                            } else {
                                "Scheduled for Next Idle/Charging Window"
                            }
                            Text(
                                text = lastRunText,
                                style = MaterialTheme.typography.labelMedium,
                                color = Color(0xFFCAC3D8)
                            )
                        }

                        FilledTonalButton(
                            onClick = onTriggerImmediateRun,
                            colors = ButtonDefaults.filledTonalButtonColors(
                                containerColor = Color(0xFF7C4DFF),
                                contentColor = Color.White
                            )
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = null,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(4.dp))
                            Text("Run Pipeline Now")
                        }
                    }
                }
            }
        }

        // 2. Daily Performance Analytics & Graphs Card
        item {
            Card(
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Text(
                        text = "MULTI-PLATFORM REACH",
                        style = MaterialTheme.typography.labelSmall,
                        color = Color(0xFFCAC3D8)
                    )
                    Text(
                        text = "Daily Performance Analytics",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFFE7E0E9),
                        fontWeight = FontWeight.Bold
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        MetricSparkCard(
                            modifier = Modifier.weight(1f),
                            label = "Total Views",
                            value = "142.8K",
                            delta = "+24.5%",
                            lineColor = Color(0xFFFFB59E),
                            points = listOf(0.8f, 0.7f, 0.85f, 0.5f, 0.55f, 0.2f, 0.1f)
                        )
                        MetricSparkCard(
                            modifier = Modifier.weight(1f),
                            label = "New Subs",
                            value = "+842",
                            delta = "+18.2%",
                            lineColor = Color(0xFFCDBDFF),
                            points = listOf(0.9f, 0.75f, 0.65f, 0.45f, 0.3f, 0.15f, 0.08f)
                        )
                        MetricSparkCard(
                            modifier = Modifier.weight(1f),
                            label = "Avg Watch",
                            value = "48.2s",
                            delta = "94.5% Ret.",
                            lineColor = Color(0xFFFFB954),
                            points = listOf(0.5f, 0.42f, 0.38f, 0.3f, 0.25f, 0.18f, 0.12f)
                        )
                    }
                }
            }
        }

        // 3. Past Upload Logs Header (Parsed from local upload_logs.json)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "PIPELINE UPLOAD LOGS (upload_logs.json)",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color(0xFFCAC3D8)
                )
                Text(
                    text = "${uploadLogs.size} Entries",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFFCDBDFF)
                )
            }
        }

        if (uploadLogs.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Text(
                            text = "No Automated Uploads Yet",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color(0xFFE7E0E9),
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "Configure your Gemini & Pexels keys in Settings or tap 'Run Pipeline Now' to generate and upload your first 9:16 YouTube Short.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFCAC3D8)
                        )
                    }
                }
            }
        } else {
            items(uploadLogs, key = { it.id }) { entry ->
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = entry.title,
                                style = MaterialTheme.typography.titleSmall,
                                color = Color(0xFFE7E0E9),
                                fontWeight = FontWeight.SemiBold
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = "${dateFormatter.format(Date(entry.timestamp))} • ID: ${entry.youtubeVideoId ?: "Local MP4"}",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFCAC3D8)
                            )
                        }
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = Color(0xFF7C4DFF).copy(alpha = 0.25f)
                        ) {
                            Text(
                                text = entry.status,
                                style = MaterialTheme.typography.labelSmall,
                                color = Color(0xFFCDBDFF),
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MetricSparkCard(
    modifier: Modifier = Modifier,
    label: String,
    value: String,
    delta: String,
    lineColor: Color,
    points: List<Float>
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        color = Color(0xFF211F25)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFFCAC3D8)
            )
            Text(
                text = value,
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFFE7E0E9),
                fontWeight = FontWeight.Bold
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Bolt,
                    contentDescription = null,
                    tint = lineColor,
                    modifier = Modifier.size(12.dp)
                )
                Text(
                    text = delta,
                    style = MaterialTheme.typography.labelSmall,
                    color = lineColor
                )
            }
            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(22.dp)
                    .padding(top = 4.dp)
            ) {
                if (points.size < 2) return@Canvas
                val path = Path()
                val stepX = size.width / (points.size - 1)
                points.forEachIndexed { index, ratio ->
                    val x = index * stepX
                    val y = ratio * size.height
                    if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
                }
                drawPath(
                    path = path,
                    color = lineColor,
                    style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
                )
                val lastX = size.width
                val lastY = points.last() * size.height
                drawCircle(
                    color = lineColor,
                    radius = 3.dp.toPx(),
                    center = Offset(lastX, lastY)
                )
            }
        }
    }
}
