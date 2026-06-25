"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import GlassEditor from "./GlassEditor";
import { useLocalStorage } from "./useLocalStorage";

const ShaderBackground = dynamic(() => import("./ShaderBackground"), {
  ssr: false,
});

export default function Home() {
  const [noteContent, setNoteContent, isLoaded] = useLocalStorage("vibe-note-content", "");
  const [rainIntensity, setRainIntensity] = useLocalStorage("vibe-rain", 0.7);
  const [snowIntensity, setSnowIntensity] = useLocalStorage("vibe-snow", 0.7);
  const [blurIntensity, setBlurIntensity] = useLocalStorage("vibe-blur", 0.5);
  const [whiteNoiseVolume, setWhiteNoiseVolume] = useLocalStorage("vibe-white-noise", 0.3);
  const [musicBlend, setMusicBlend] = useLocalStorage("vibe-music", 0.5);
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState("txt");
  const [mode, setMode] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Notes sidebar
  const [savedNotes, setSavedNotes] = useLocalStorage<{ id: string; title: string; content: string; time: string }[]>("vibe-saved-notes", []);
  const [showNotes, setShowNotes] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");

  const handleExport = useCallback(() => {
    const timestamp = new Date().toLocaleString("zh-CN").replace(/[/:]/g, "-");
    let blob, filename, mimeType;

    switch (exportFormat) {
      case "txt":
        blob = new Blob([noteContent], { type: "text/plain;charset=utf-8" });
        filename = `沉浸式笔记-${timestamp}.txt`;
        break;
      case "doc":
        const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>沉浸式笔记</title></head><body><pre>${noteContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></body></html>`;
        blob = new Blob([htmlContent], { type: "application/msword" });
        filename = `沉浸式笔记-${timestamp}.doc`;
        break;
      case "pdf":
        // Create PDF using print content
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>沉浸式笔记</title><style>body{font-family:SimSun,serif;padding:40px;white-space:pre-wrap;}</style></head><body>${noteContent}</body></html>`);
          printWindow.document.close();
          printWindow.print();
        }
        setShowExport(false);
        return;
      case "image":
        // Capture the editor area as image using canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = 800;
          canvas.height = 600;
          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "white";
          ctx.font = "18px SimSun, serif";
          const lines = noteContent.split("\n");
          lines.forEach((line, i) => {
            ctx.fillText(line, 40, 40 + i * 28);
          });
          canvas.toBlob((imgBlob) => {
            if (imgBlob) {
              const url = URL.createObjectURL(imgBlob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `沉浸式笔记-${timestamp}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }
          }, "image/png");
        }
        setShowExport(false);
        return;
      default:
        blob = new Blob([noteContent], { type: "text/plain;charset=utf-8" });
        filename = `沉浸式笔记-${timestamp}.txt`;
    }

    if (blob && filename) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    setShowExport(false);
  }, [noteContent, exportFormat]);

  const handleTimerEnd = useCallback(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("心流时间结束", {
        body: "休息一下吧！",
      });
    }
  }, []);

  const handleSaveNote = useCallback(() => {
    if (!noteContent.trim()) return;
    const now = new Date();
    const timeStr = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newNote = {
      id: Date.now().toString(),
      title: noteTitle.trim() || `笔记 ${savedNotes.length + 1}`,
      content: noteContent,
      time: timeStr,
    };
    setSavedNotes((prev) => [newNote, ...prev]);
    setNoteTitle("");
  }, [noteContent, noteTitle, savedNotes.length]);

  const handleDeleteNote = useCallback((id: string) => {
    setSavedNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleLoadNote = useCallback((note: { id: string; title: string; content: string; time: string }) => {
    setNoteContent(note.content);
    setShowNotes(false);
  }, []);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Listen for openNotes event from GlassEditor
  useEffect(() => {
    const handleOpenNotes = () => setShowNotes(true);
    window.addEventListener('openNotes', handleOpenNotes);
    return () => window.removeEventListener('openNotes', handleOpenNotes);
  }, []);

  // Audio element setup
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = whiteNoiseVolume;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  // Change audio source based on mode
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (mode === 0) {
      audio.src = "/rain.mp4";
    } else if (mode === 1) {
      audio.src = "/rain.mp4";
    } else if (mode === 2) {
      audio.src = "/wave.mp4";
    }
  }, [mode]);

  // Control audio based on mode and volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (mode === 0 || mode === 1 || mode === 2) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [mode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = whiteNoiseVolume;
    }
  }, [whiteNoiseVolume]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white/50">加载中...</div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Shader background */}
      <ShaderBackground mode={mode} rainIntensity={rainIntensity} snowIntensity={snowIntensity} blurIntensity={blurIntensity} />

      {/* Bottom left - Vibe mixer (above export button) */}
      <VibeMixerPanel
        rainIntensity={rainIntensity}
        setRainIntensity={setRainIntensity}
        snowIntensity={snowIntensity}
        setSnowIntensity={setSnowIntensity}
        blurIntensity={blurIntensity}
        setBlurIntensity={setBlurIntensity}
        whiteNoiseVolume={whiteNoiseVolume}
        setWhiteNoiseVolume={setWhiteNoiseVolume}
        musicBlend={musicBlend}
        setMusicBlend={setMusicBlend}
        isHovered={isHovered}
      />

      {/* Bottom left - Export button (below vibe mixer) */}
      <div className="fixed bottom-6 left-6 z-50">
        <button
          onClick={() => setShowExport(true)}
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-500"
          style={{
            opacity: isHovered ? 1 : 0.15,
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>

      {/* Export modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl p-8 max-w-2xl mx-4">
            <h3 className="text-white/90 font-medium mb-6 text-lg">导出笔记</h3>
            <div className="mb-6 space-y-2">
              <p className="text-white/60 text-sm mb-4">选择导出格式：</p>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { value: "txt", label: "TXT", icon: "📄" },
                  { value: "doc", label: "Word", icon: "📝" },
                  { value: "pdf", label: "PDF", icon: "📕" },
                  { value: "image", label: "图片", icon: "🖼️" },
                ].map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => setExportFormat(fmt.value)}
                    className={`py-6 px-4 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                      exportFormat === fmt.value
                        ? 'bg-white/25 text-white border border-white/30'
                        : 'bg-white/10 text-white/70 border border-transparent hover:bg-white/15'
                    }`}
                  >
                    <span className="text-3xl">{fmt.icon}</span>
                    <span>{fmt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                className="flex-1 py-3 rounded-full bg-white/15 text-white/90 text-sm font-medium hover:bg-white/25 transition-all"
              >
                确认导出
              </button>
              <button
                onClick={() => setShowExport(false)}
                className="px-6 py-3 rounded-full bg-white/10 text-white/60 text-sm hover:bg-white/15 transition-all"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes sidebar toggle */}
      <button
        onClick={() => setShowNotes(!showNotes)}
        className="fixed top-1/2 -translate-y-1/2 right-0 z-50 w-10 h-12 rounded-l-xl rounded-r-none bg-white/10 backdrop-blur-xl border border-white/20 border-r-0 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-300"
        style={{ opacity: isHovered ? 1 : 0.2 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </button>

      {/* Notes sidebar */}
      <div
        className="fixed top-0 right-0 h-full w-72 backdrop-blur-2xl bg-white/10 border-l border-white/20 z-40 transition-transform duration-300"
        style={{ transform: showNotes ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/90 font-medium text-sm">便签</h2>
            <button
              onClick={() => setShowNotes(false)}
              className="w-7 h-7 rounded-full bg-white/10 text-white/60 flex items-center justify-center hover:bg-white/20 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Save current note */}
          <div className="mb-4">
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="标题（可选）"
              className="w-full px-3 py-2 mb-2 bg-white/10 border border-white/20 rounded-xl text-white/90 text-sm placeholder-white/40 focus:outline-none focus:border-white/40"
            />
            <button
              onClick={handleSaveNote}
              disabled={!noteContent.trim()}
              className="w-full py-2 rounded-xl bg-white/15 text-white/80 text-sm hover:bg-white/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              保存当前笔记
            </button>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {savedNotes.length === 0 ? (
              <p className="text-white/40 text-xs text-center py-8">暂无便签</p>
            ) : (
              savedNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-white/10 border border-white/20 rounded-xl cursor-pointer hover:bg-white/15 transition-all group"
                  onClick={() => handleLoadNote(note)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white/90 text-sm font-medium truncate">{note.title}</p>
                      <p className="text-white/40 text-xs mt-1 line-clamp-2">{note.content.slice(0, 60)}{note.content.length > 60 ? '...' : ''}</p>
                      <p className="text-white/30 text-xs mt-2">{note.time}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                      className="w-6 h-6 rounded-full bg-white/10 text-white/40 flex items-center justify-center hover:bg-red-500/50 hover:text-white transition-all opacity-0 group-hover:opacity-100 ml-2 shrink-0"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Glass editor - centered */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-8">
        <GlassEditor value={noteContent} onChange={setNoteContent} mode={mode} setMode={setMode} />
      </div>
    </main>
  );
}

// Vibe mixer panel component
function VibeMixerPanel({
  rainIntensity,
  setRainIntensity,
  snowIntensity,
  setSnowIntensity,
  blurIntensity,
  setBlurIntensity,
  whiteNoiseVolume,
  setWhiteNoiseVolume,
  musicBlend,
  setMusicBlend,
  isHovered,
}: {
  rainIntensity: number;
  setRainIntensity: (v: number) => void;
  snowIntensity: number;
  setSnowIntensity: (v: number) => void;
  blurIntensity: number;
  setBlurIntensity: (v: number) => void;
  whiteNoiseVolume: number;
  setWhiteNoiseVolume: (v: number) => void;
  musicBlend: number;
  setMusicBlend: (v: number) => void;
  isHovered: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button - bottom left, above export */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 left-6 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-300"
        style={{
          opacity: isHovered || isOpen ? 1 : 0.15,
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* Panel - right side of button, bottom-aligned */}
      {isOpen && (
        <div
          className="fixed z-50 w-72 backdrop-blur-2xl bg-white/10 border border-white/20 rounded-2xl p-5 shadow-2xl"
          style={{
            left: '84px',
            bottom: '96px',
          }}
        >
          <h2 className="text-white/90 font-medium mb-5 text-sm">氛围控制台</h2>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/60 mb-2">
              <span>雨量</span>
              <span>{Math.round(rainIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={rainIntensity}
              onChange={(e) => setRainIntensity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/60 mb-2">
              <span>雪量</span>
              <span>{Math.round(snowIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={snowIntensity}
              onChange={(e) => setSnowIntensity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/60 mb-2">
              <span>模糊度</span>
              <span>{Math.round(blurIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={blurIntensity}
              onChange={(e) => setBlurIntensity(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            />
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/60 mb-2">
              <span>白噪音</span>
              <span>{Math.round(whiteNoiseVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={whiteNoiseVolume}
              onChange={(e) => setWhiteNoiseVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-white/60 mb-2">
              <span>音乐融合</span>
              <span>{Math.round(musicBlend * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicBlend}
              onChange={(e) => setMusicBlend(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}
