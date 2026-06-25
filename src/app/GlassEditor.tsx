"use client";

import React, { useState, useEffect, useRef } from "react";

const fonts = [
  { name: "系统", value: "system-ui, sans-serif" },
  { name: "黑体", value: '"SimHei", "Microsoft YaHei", sans-serif' },
  { name: "楷体", value: "KaiTi, STKaiti, serif" },
  { name: "宋体", value: "SimSun, STSong, serif" },
  { name: "小篆", value: "STXinwei, serif" },
  { name: "Times", value: '"Times New Roman", Times, serif' },
  { name: "等线", value: '"DengXian", "PingFang SC", sans-serif' },
  { name: "雅黑", value: '"Microsoft YaHei", "Segoe UI", sans-serif' },
  { name: "幼圆", value: '"YouYuan", cursive' },
  { name: "隶书", value: '"LiSu", "STLiti", sans-serif' },
  { name: "华文行楷", value: '"STXingkai", cursive' },
  { name: "华文彩云", value: '"STCaitong", cursive' },
];

// 段落格式选项
const paragraphFormats = [
  { label: "首行缩进", value: "textIndent", options: [
    { label: "无", value: "0em" },
    { label: "2字符", value: "2em" },
    { label: "4字符", value: "4em" },
  ]},
  { label: "行间距", value: "lineHeight", options: [
    { label: "1.0", value: "1.0" },
    { label: "1.5", value: "1.5" },
    { label: "2.0", value: "2.0" },
    { label: "2.5", value: "2.5" },
  ]},
  { label: "段前距", value: "marginTop", options: [
    { label: "0", value: "0" },
    { label: "0.5行", value: "0.5em" },
    { label: "1行", value: "1em" },
    { label: "2行", value: "2em" },
  ]},
  { label: "段后距", value: "marginBottom", options: [
    { label: "0", value: "0" },
    { label: "0.5行", value: "0.5em" },
    { label: "1行", value: "1em" },
    { label: "2行", value: "2em" },
  ]},
  { label: "对齐", value: "textAlign", options: [
    { label: "左", value: "left" },
    { label: "居中", value: "center" },
    { label: "右", value: "right" },
    { label: "两端", value: "justify" },
  ]},
];

interface GlassEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mode: number;
  setMode: (mode: number) => void;
}

const modeNames = ["rain", "snow", "wave"];

// 模式图标
function ModeIcon({ mode, size = 5 }: { mode: number; size?: number }) {
  if (mode === 0) {
    return (
      <svg className={`w-${size} h-${size}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    );
  } else if (mode === 1) {
    return (
      <svg className={`w-${size} h-${size}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" />
      </svg>
    );
  } else {
    return (
      <svg className={`w-${size} h-${size}`} fill="currentColor" viewBox="0 0 24 24">
        <path d="M2 12c1.5-1.5 3-2 4.5-2s3 .5 4.5 2c1.5 1.5 3 2 4.5 2s3-.5 4.5-2M2 17c1.5-1.5 3-2 4.5-2s3 .5 4.5 2c1.5 1.5 3 2 4.5 2s3-.5 4.5-2M2 7c1.5-1.5 3-2 4.5-2s3 .5 4.5 2c1.5 1.5 3 2 4.5 2s3-.5 4.5-2" />
      </svg>
    );
  }
}

// 字体图标
function FontIcon() {
  return (
    <span className="text-xs font-medium" style={{ fontFamily: 'Times New Roman, serif' }}>Aa</span>
  );
}

// 段落格式图标
function FormatIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h10M4 14h12M4 18h8" />
    </svg>
  );
}

// 沙漏图标
function HourglassIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  );
}

// 段落格式类型
interface ParagraphFormat {
  textIndent: string;
  lineHeight: string;
  marginTop: string;
  marginBottom: string;
  textAlign: string;
}

// 文字蒸发覆盖层 - 绝对定位，原地蒸发
function TextEvaporateOverlay({ text, font, paragraphFormat }: { text: string; font: string; paragraphFormat: ParagraphFormat }) {
  const lines = text.split('\n');
  const fontSize = 18;

  return (
    <div
      className="absolute inset-0 p-8 pointer-events-none overflow-hidden"
      style={{ fontFamily: font, fontSize: `${fontSize}px`, lineHeight: paragraphFormat.lineHeight }}
    >
      {lines.map((line, lineIndex) => (
        <div
          key={lineIndex}
          className="whitespace-pre-wrap"
          style={{ height: fontSize * parseFloat(paragraphFormat.lineHeight) }}
        >
          {line.split('').map((char, charIndex) => (
            <span
              key={charIndex}
              className="inline-block animate-char-evaporate"
              style={{
                animationDelay: `${(lineIndex * 0.08) + (charIndex * 0.015)}s`,
                color: 'white',
              }}
            >
              {char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function GlassEditor({ value, onChange, placeholder = "小喧 is watching you...", mode, setMode }: GlassEditorProps) {
  const [font, setFont] = useState(fonts[0].value);
  const [paragraphFormat, setParagraphFormat] = useState<ParagraphFormat>({
    textIndent: "0em",
    lineHeight: "1.8",
    marginTop: "0",
    marginBottom: "0",
    textAlign: "left",
  });
  const [isHovered, setIsHovered] = useState(false);
  const [showModes, setShowModes] = useState(false);
  const [showFonts, setShowFonts] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [pomodoroOpen, setPomodoroOpen] = useState(false);
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroPreset, setPomodoroPreset] = useState(25);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);
  const [deletedText, setDeletedText] = useState("");
  const [isEvaporating, setIsEvaporating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pomodoroPresets = [
    { label: "15", minutes: 15 },
    { label: "25", minutes: 25 },
    { label: "30", minutes: 30 },
    { label: "45", minutes: 45 },
    { label: "60", minutes: 60 },
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.fontFamily = font;
      Object.entries(paragraphFormat).forEach(([prop, val]) => {
        (textareaRef.current!.style as any)[prop] = val;
      });
    }
  }, [font, paragraphFormat]);

  // Mouse wheel to change font using capture phase
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentIndex = fonts.findIndex((f) => f.value === font);
      const delta = e.deltaY > 0 ? 1 : -1;
      const newIndex = (currentIndex + delta + fonts.length) % fonts.length;
      setFont(fonts[newIndex].value);
    };

    textarea.addEventListener('wheel', handleWheel, { passive: false });
    return () => textarea.removeEventListener('wheel', handleWheel);
  }, [font]);

  useEffect(() => {
    setPomodoroTimeLeft(pomodoroPreset * 60);
  }, [pomodoroPreset]);

  useEffect(() => {
    if (pomodoroRunning && pomodoroTimeLeft > 0) {
      pomodoroIntervalRef.current = setInterval(() => {
        setPomodoroTimeLeft((prev) => {
          if (prev <= 1) {
            setPomodoroRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current);
    };
  }, [pomodoroRunning]);

  const formatPomodoroTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const pomodoroProgress = 1 - pomodoroTimeLeft / (pomodoroPreset * 60);

  return (
    <div
      className="relative z-10 w-3/5 mx-auto p-4 sm:p-8"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowModes(false);
        setShowFonts(false);
        setShowFormat(false);
      }}
    >
      {/* Main glass frame */}
      <div
        className="w-full backdrop-blur-2xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl transition-all duration-700 overflow-hidden"
        style={{
          opacity: isHovered ? 1 : 0.25,
          transform: isHovered ? 'scale(1)' : 'scale(0.98)',
        }}
      >
        {/* Editor area */}
        <div className="p-8 relative">
          {isEvaporating && (
            <TextEvaporateOverlay text={value} font={font} paragraphFormat={paragraphFormat} />
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full h-[50vh] bg-transparent border-none text-white placeholder-white/30 resize-none focus:outline-none ${isEvaporating ? 'opacity-0' : ''}`}
            style={{ fontFamily: font, fontSize: "18px", textIndent: paragraphFormat.textIndent, lineHeight: paragraphFormat.lineHeight, marginTop: paragraphFormat.marginTop, marginBottom: paragraphFormat.marginBottom, textAlign: paragraphFormat.textAlign as React.CSSProperties['textAlign'] }}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 relative">
          {/* Bottom controls row */}
          <div className="flex items-center justify-between">
            {/* Left: char count */}
            <span className="text-xs text-white/40">{value.length} 字</span>

            {/* Center: mode switcher + format + font + pomodoro */}
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
              {/* Mode switcher - single button */}
              <div className="relative">
                <button
                  onClick={() => { setShowModes(!showModes); setShowFonts(false); setShowFormat(false); }}
                  className="w-8 h-8 rounded-full bg-white/10 text-white/70 flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <ModeIcon mode={mode} size={4} />
                </button>
                {showModes && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 p-1.5 rounded-xl bg-black/40 backdrop-blur-xl border border-white/20">
                    {modeNames.map((name, i) => (
                      <button
                        key={i}
                        onClick={() => { setMode(i); setShowModes(false); }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          mode === i ? 'bg-white/25 text-white' : 'text-white/60 hover:bg-white/15 hover:text-white'
                        }`}
                      >
                        <ModeIcon mode={i} size={4} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Font selector */}
              <div className="relative">
                <button
                  onClick={() => { setShowFonts(!showFonts); setShowModes(false); setShowFormat(false); }}
                  className="w-8 h-8 rounded-full bg-white/10 text-white/70 flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <FontIcon />
                </button>
                {showFonts && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-3 px-3 rounded-xl bg-black/40 backdrop-blur-xl border border-white/20 flex flex-wrap gap-1 max-w-48">
                    {fonts.map((f) => (
                      <button
                        key={f.value}
                        onClick={() => { setFont(f.value); setShowFonts(false); }}
                        className={`px-3 py-2 rounded-lg text-xs transition-all ${
                          font === f.value ? 'bg-white/25 text-white' : 'text-white/60 hover:bg-white/15 hover:text-white'
                        }`}
                        style={{ fontFamily: f.value }}
                        title={f.name}
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Paragraph format */}
              <div className="relative">
                <button
                  onClick={() => { setShowFormat(!showFormat); setShowModes(false); setShowFonts(false); }}
                  className="w-8 h-8 rounded-full bg-white/10 text-white/70 flex items-center justify-center hover:bg-white/20 transition-all"
                >
                  <FormatIcon />
                </button>
                {showFormat && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 py-3 px-3 rounded-xl bg-black/40 backdrop-blur-xl border border-white/20 w-64">
                    {paragraphFormats.map((fmt) => (
                      <div key={fmt.value} className="mb-3 last:mb-0">
                        <div className="text-xs text-white/60 mb-1.5">{fmt.label}</div>
                        <div className="flex flex-wrap gap-1">
                          {fmt.options.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => {
                                setParagraphFormat((prev) => ({ ...prev, [fmt.value]: opt.value }));
                              }}
                              className={`px-2 py-1 rounded text-xs transition-all ${
                                paragraphFormat[fmt.value as keyof ParagraphFormat] === opt.value
                                  ? 'bg-white/25 text-white'
                                  : 'text-white/60 hover:bg-white/15 hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pomodoro toggle */}
              <button
                onClick={() => setPomodoroOpen(!pomodoroOpen)}
                className="w-8 h-8 rounded-full bg-white/10 text-white/70 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <HourglassIcon />
              </button>
            </div>

            {/* Right: SAVE and RELEASE buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('openNotes');
                    window.dispatchEvent(event);
                  }
                }}
                className="px-2 py-1 rounded-md text-xs text-white/60 hover:bg-white/15 hover:text-white transition-all"
              >
                SAVE
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (!value.trim()) return;
                    setDeletedText(value);
                    setIsEvaporating(true);
                    setTimeout(() => {
                      onChange("");
                      setIsEvaporating(false);
                    }, 1200);
                  }}
                  disabled={!value.trim()}
                  className="px-2 py-1 rounded-md text-xs text-white/60 hover:bg-white/15 hover:text-white transition-all disabled:opacity-30"
                >
                  RELEASE
                </button>
                {deletedText && (
                  <button
                    onClick={() => {
                      onChange(deletedText);
                      setDeletedText("");
                    }}
                    className="w-5 h-5 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all flex items-center justify-center"
                    title="撤销"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Pomodoro panel */}
          {pomodoroOpen && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between gap-4">
                {/* Presets */}
                <div className="flex gap-1">
                  {pomodoroPresets.map((p) => (
                    <button
                      key={p.minutes}
                      onClick={() => { setPomodoroPreset(p.minutes); setPomodoroTimeLeft(p.minutes * 60); setPomodoroRunning(false); }}
                      className={`px-2 py-1 rounded-md text-xs transition-all ${
                        pomodoroPreset === p.minutes
                          ? 'bg-white/20 text-white'
                          : 'text-white/50 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {p.label}m
                    </button>
                  ))}
                </div>

                {/* Timer display + controls */}
                <div className="flex items-center gap-3">
                  {/* Ring timer */}
                  <div className="relative w-10 h-10">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                      <circle
                        cx="18" cy="18" r="15"
                        fill="none"
                        stroke="rgba(255,255,255,0.6)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeDasharray={`${pomodoroProgress * 94.2} 94.2`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-white/80 font-light">{formatPomodoroTime(pomodoroTimeLeft)}</span>
                    </div>
                  </div>

                  {/* Start/Pause */}
                  <button
                    onClick={() => setPomodoroRunning(!pomodoroRunning)}
                    className="w-7 h-7 rounded-full bg-white/15 text-white/80 flex items-center justify-center hover:bg-white/25 transition-all"
                  >
                    {pomodoroRunning ? (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Reset */}
                  <button
                    onClick={() => { setPomodoroRunning(false); setPomodoroTimeLeft(pomodoroPreset * 60); }}
                    className="w-7 h-7 rounded-full bg-white/10 text-white/50 flex items-center justify-center hover:bg-white/15 hover:text-white/80 transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
