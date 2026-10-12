import React, { useEffect, useState } from 'react';
import { KOTLIN_ARCHITECTURE_FILES } from '../data/kotlinArchitectureSource';

interface RealAndroidFile {
  relativePath: string;
  content: string;
}

export const KotlinArchitectureDrawer: React.FC = () => {
  const [androidFiles, setAndroidFiles] = useState<RealAndroidFile[]>([]);
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/android-project/files')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data.files) && data.files.length > 0) {
          setAndroidFiles(data.files);
        }
      })
      .catch(() => {
        // Fallback to static Kotlin architecture list if endpoint fails
      });
  }, []);

  const displayFiles: RealAndroidFile[] =
    androidFiles.length > 0
      ? androidFiles
      : KOTLIN_ARCHITECTURE_FILES.map((f) => ({
          relativePath: `android/app/src/main/java/com/facelessshorts/autopilot/${f.path}`,
          content: f.code,
        }));

  const activeFile = displayFiles[selectedFileIndex] || displayFiles[0];

  const handleCopyCode = () => {
    if (!activeFile) return;
    navigator.clipboard?.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadAllKotlinBundle = () => {
    const combinedContent = displayFiles
      .map(
        (f) =>
          `// ============================================================================\n// FILE: ${f.relativePath}\n// ============================================================================\n\n${f.content}\n\n`
      )
      .join('\n');

    const blob = new Blob([combinedContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FacelessShortsAutoPilot_Android_Studio_Project.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-6">
      {/* Architecture Overview Header */}
      <div className="rounded-2xl bg-[#1d1b21] p-4 sm:p-5 border border-white/[0.05] shadow-lg flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <span className="text-[11px] font-mono-code uppercase tracking-wider text-[#cdbdff]">
              Native Android Project (/android) • Kotlin + Jetpack Compose
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#e7e0e9] mt-0.5">
              Android Studio Project Tree ({displayFiles.length} Files)
            </h1>
            <p className="text-xs text-[#cac3d8] mt-1">
              Complete native Android application generated in the workspace{' '}
              <code className="text-[#ffb59e] font-mono-code">/android</code> directory with{' '}
              <code className="text-[#ffb59e] font-mono-code">build.gradle.kts</code>,{' '}
              <code className="text-[#ffb59e] font-mono-code">AndroidManifest.xml</code>,{' '}
              <code className="text-[#ffb59e] font-mono-code">MainActivity.kt</code>,{' '}
              <code className="text-[#ffb59e] font-mono-code">ui/screens</code>,{' '}
              <code className="text-[#ffb59e] font-mono-code">data/models</code>,{' '}
              <code className="text-[#ffb59e] font-mono-code">data/repository</code>,{' '}
              <code className="text-[#ffb59e] font-mono-code">network</code>, and{' '}
              <code className="text-[#ffb59e] font-mono-code">worker/DailyVideoWorker.kt</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadAllKotlinBundle}
            className="px-4 py-2.5 rounded-full bg-[#7c4dff] hover:bg-[#7c4dff]/90 text-white text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Full Android Project</span>
          </button>
        </div>

        {/* File Tree Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {displayFiles.map((file, idx) => {
            const active = idx === selectedFileIndex;
            const shortLabel = file.relativePath.replace(
              'android/app/src/main/java/com/facelessshorts/autopilot/',
              ''
            );
            return (
              <button
                key={file.relativePath}
                type="button"
                onClick={() => setSelectedFileIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono-code flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#cdbdff] text-[#370096] font-semibold shadow-sm'
                    : 'bg-[#211f25] text-[#cac3d8] hover:bg-[#2b292f]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">description</span>
                <span>{shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Kotlin / Gradle / Manifest Source Viewer */}
      {activeFile && (
        <div className="rounded-2xl bg-[#0f0d13] border border-white/[0.06] shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#1d1b21] border-b border-white/[0.06] gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-[#7c4dff]/25 text-[#cdbdff] text-[10px] font-mono-code font-semibold">
                ANDROID FILE
              </span>
              <span className="text-xs sm:text-sm font-mono-code font-semibold text-[#e7e0e9] truncate">
                /{activeFile.relativePath}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-full bg-[#2b292f] hover:bg-[#36343a] text-[#e7e0e9] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[15px] text-[#cdbdff]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied File' : 'Copy File'}</span>
            </button>
          </div>

          <pre className="p-4 text-xs font-mono-code text-[#e7e0e9] overflow-x-auto leading-relaxed max-h-[640px] overflow-y-auto select-all">
            <code>{activeFile.content}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
