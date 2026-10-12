package com.facelessshorts.autopilot.ui.screens

import android.graphics.Bitmap
import android.media.MediaMetadataRetriever
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.MovieFilter
import androidx.compose.material.icons.filled.Subtitles
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.facelessshorts.autopilot.data.models.VideoScriptRecipeJSON
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File

/**
 * Media Preview Screen (Jetpack Compose Material You Dark Theme):
 * - Allows the user to look inside the pipeline
 * - View the current parsed JSON script recipe text (`VideoScriptRecipeJSON`)
 * - Preview the downloaded stock video thumbnails extracted from `cacheDir/broll_clips/*.mp4`
 * - Inspect the `CaptionWordJSON` word-by-word subtitle timeline
 */
@Composable
fun MediaPreviewScreen(
    scriptRecipe: VideoScriptRecipeJSON?,
    downloadedClipFiles: List<File>
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF141218))
            .padding(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "PIPELINE MEDIA INSPECTOR",
                style = MaterialTheme.typography.labelSmall,
                color = Color(0xFFFFB59E)
            )
            Text(
                text = "Script Recipe & B-Roll Preview",
                style = MaterialTheme.typography.headlineSmall,
                color = Color(0xFFE7E0E9),
                fontWeight = FontWeight.Bold
            )
        }

        if (scriptRecipe == null) {
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "No VideoScriptRecipeJSON Cached Yet",
                            style = MaterialTheme.typography.titleMedium,
                            color = Color(0xFFE7E0E9),
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "Once Step 1 (Gemini Script Generation) executes, the parsed targetTopic, 50-second voiceScript, 5 bRollKeywords, and CaptionWordJSON timeline will appear here.",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFCAC3D8)
                        )
                    }
                }
            }
        } else {
            // 1. Parsed VideoScriptRecipeJSON Card
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Code,
                                contentDescription = null,
                                tint = Color(0xFFCDBDFF)
                            )
                            Text(
                                text = scriptRecipe.targetTopic,
                                style = MaterialTheme.typography.titleMedium,
                                color = Color(0xFFE7E0E9),
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = Color(0xFF211F25),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = scriptRecipe.voiceScript,
                                style = MaterialTheme.typography.bodyMedium,
                                color = Color(0xFFE7E0E9),
                                modifier = Modifier.padding(14.dp)
                            )
                        }

                        Text(
                            text = "5 Targeted Pexels B-Roll Keywords:",
                            style = MaterialTheme.typography.labelMedium,
                            color = Color(0xFFCAC3D8)
                        )

                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            itemsIndexed(scriptRecipe.bRollKeywords) { idx, keyword ->
                                Surface(
                                    shape = RoundedCornerShape(999.dp),
                                    color = Color(0xFF2B292F)
                                ) {
                                    Text(
                                        text = "#${idx + 1} $keyword",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = Color(0xFFCDBDFF),
                                        fontFamily = FontFamily.Monospace,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 2. Downloaded Pexels Stock Video Thumbnails (9:16 Vertical Preview)
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.MovieFilter,
                                contentDescription = null,
                                tint = Color(0xFFFFB59E)
                            )
                            Text(
                                text = "Downloaded 9:16 Stock Video Clips (${downloadedClipFiles.size}/3)",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color(0xFFE7E0E9),
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        if (downloadedClipFiles.isEmpty()) {
                            Text(
                                text = "No local MP4 files found in cacheDir/broll_clips yet.",
                                style = MaterialTheme.typography.bodySmall,
                                color = Color(0xFFCAC3D8)
                            )
                        } else {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                downloadedClipFiles.take(3).forEachIndexed { index, mp4File ->
                                    VideoThumbnailCard(
                                        modifier = Modifier.weight(1f),
                                        clipIndex = index + 1,
                                        mp4File = mp4File
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // 3. CaptionWordJSON Timeline Preview
            item {
                Card(
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1D1B21)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Subtitles,
                                contentDescription = null,
                                tint = Color(0xFFFFB954)
                            )
                            Text(
                                text = "CaptionWordJSON Burn Timeline (${scriptRecipe.captionsTimeline.size} words)",
                                style = MaterialTheme.typography.titleMedium,
                                color = Color(0xFFE7E0E9),
                                fontWeight = FontWeight.SemiBold
                            )
                        }

                        scriptRecipe.captionsTimeline.take(12).forEach { caption ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Color(0xFF211F25))
                                    .padding(horizontal = 12.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = caption.word.uppercase(),
                                    color = Color(0xFFE7E0E9),
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                                Text(
                                    text = "${caption.startTimeMs}ms -> ${caption.endTimeMs}ms",
                                    color = Color(0xFFCDBDFF),
                                    style = MaterialTheme.typography.labelSmall,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun VideoThumbnailCard(
    modifier: Modifier = Modifier,
    clipIndex: Int,
    mp4File: File
) {
    var thumbnailBitmap by remember(mp4File.absolutePath) { mutableStateOf<Bitmap?>(null) }

    LaunchedEffect(mp4File.absolutePath) {
        thumbnailBitmap = withContext(Dispatchers.IO) {
            runCatching {
                val retriever = MediaMetadataRetriever()
                retriever.setDataSource(mp4File.absolutePath)
                val frame = retriever.getFrameAtTime(1_000_000L) // 1 second mark
                retriever.release()
                frame
            }.getOrNull()
        }
    }

    Box(
        modifier = modifier
            .aspectRatio(9f / 16f)
            .clip(RoundedCornerShape(16.dp))
            .background(Color(0xFF36343A))
    ) {
        thumbnailBitmap?.let { bmp ->
            Image(
                bitmap = bmp.asImageBitmap(),
                contentDescription = mp4File.name,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Surface(
                shape = RoundedCornerShape(6.dp),
                color = Color(0xFF0F0D13).copy(alpha = 0.8f)
            ) {
                Text(
                    text = "#0$clipIndex",
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.White,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }

            Surface(
                shape = RoundedCornerShape(6.dp),
                color = Color(0xFF0F0D13).copy(alpha = 0.8f)
            ) {
                Text(
                    text = mp4File.name,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color(0xFFCAC3D8),
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
    }
}
