# FacelessShorts AutoPilot & FacelessReels Studio

An autonomous, end-to-end platform for creating viral 9:16 vertical short-form videos (YouTube Shorts, TikTok, Instagram Reels) inspired by [facelessreels.com](https://facelessreels.com).

This repository contains both:
1. **FacelessReels AI Web Studio**: Interactive web application featuring 1-click niche templates, viral hook generator, word-by-word animated caption engines (Hormozi, MrBeast, Stoic, Cyber), AI scene generators, and in-browser 9:16 WebM export.
2. **Native Android App (`/android`)**: Production-grade Kotlin + Jetpack Compose application designed to run daily automated background generation (`DailyVideoWorker`), local TTS speech synthesis, FFmpeg video rendering, and YouTube Data API v3 publishing.
3. **CI/CD APK Workflow (`.github/workflows/build-android-apk.yml`)**: Automated GitHub Actions pipeline that compiles and packages both Debug and signed Release APKs ready for download and device installation.

---

## Architecture Overview

```
├── .github/workflows/
│   └── build-android-apk.yml       # Automated GitHub Actions workflow to build APKs
├── android/                        # Full Native Android Kotlin + Jetpack Compose project
│   ├── app/
│   │   ├── build.gradle.kts        # Jetpack Compose, WorkManager, FFmpeg-kit, Google Play Auth
│   │   └── src/main/
│   │       ├── AndroidManifest.xml # Permissions, FileProvider, & launcher activity
│   │       ├── res/xml/file_paths.xml # FileProvider paths
│   │       └── java/com/facelessshorts/autopilot/
│   │           ├── MainActivity.kt # Single-Activity Jetpack Compose host
│   │           ├── data/models/    # AppSettingsJSON, VideoScriptRecipeJSON, CaptionWordJSON
│   │           ├── data/repository/ # Local JSON storage repository
│   │           ├── network/        # Gemini API, Pexels API, YouTube Upload
│   │           ├── worker/         # DailyVideoWorker & LocalMediaAndFFmpegEngine
│   │           └── ui/screens/     # DashboardScreen, SettingsScreen, MediaPreviewScreen
│   ├── build.gradle.kts            # Root Android project Gradle build configuration
│   ├── settings.gradle.kts         # Module and repository definitions
│   ├── gradlew & gradlew.bat       # Gradle Wrapper executables
│   └── gradle/wrapper/             # Gradle 8.9 wrapper jar & properties
├── src/                            # Web App (React + TypeScript + Tailwind CSS)
│   ├── App.tsx                     # Main navigation & orchestrator
│   ├── components/                 # FacelessReelsStudio, Dashboard, Campaign, Queue, Render
│   └── types/schemas.ts            # Shared data contracts & default presets
├── server.ts                       # Full-stack Node/Express proxy for Gemini & TTS APIs
└── metadata.json                   # Applet configuration & permissions
```

---

## 1. Web Application (FacelessReels Studio)

### Features
- **Niche Templates**: Mindset Loop, Money Minute, Storyframe, Reddit Story Card, Split Screen Gameplay.
- **Viral Hook Lab**: Generate 5 high-converting hook variants instantly for any topic.
- **Dynamic Subtitle Styling**: Hormozi Bold, MrBeast Pop, Stoic Glow, Minimal Clean, Cyber Neon.
- **Live 9:16 Storyboard Player**: Preview video playback with synchronized, word-by-word highlighted captions.
- **Direct Video Export**: Export vertical videos with burned captions directly from your browser.

### Running Locally
```bash
npm install
npm run dev
```
The application will launch on `http://localhost:3000`.

---

## 2. Generating Android APK via GitHub Actions

To build the Android APK automatically in the cloud without needing Android Studio installed locally:

1. Push this repository to GitHub (`main` or `master` branch).
2. Go to the **Actions** tab on your GitHub repository.
3. Select the **Build Android APK (FacelessShorts AutoPilot)** workflow.
4. Click **Run workflow** (or simply push any commit).
5. Once completed (approx. 2-3 minutes), download the generated APK from the **Artifacts** section:
   - `FacelessShorts-AutoPilot-debug-apk` (`app-debug.apk`)
   - `FacelessShorts-AutoPilot-release-signed-apk` (`FacelessShorts-AutoPilot-release-signed.apk`)
6. Transfer the `.apk` file to your Android phone and install it.

---

## 3. Opening in Android Studio

If you want to build or modify the native app using Android Studio:

1. Open **Android Studio**.
2. Select **Open** and choose the `android` folder in this repository.
3. Allow Gradle to sync dependencies.
4. Connect an Android device or start an emulator running Android 8.0 (API 26) or higher.
5. Click **Run** (`Shift + F10`) or run from terminal:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   The APK will be located at `android/app/build/outputs/apk/debug/app-debug.apk`.
