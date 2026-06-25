"use client";

import { useState, useEffect, useRef } from "react";

const presets = [
  { label: "15分钟", minutes: 15 },
  { label: "25分钟", minutes: 25 },
  { label: "30分钟", minutes: 30 },
  { label: "45分钟", minutes: 45 },
  { label: "1小时", minutes: 60 },
];

type TimerMode = "linear" | "ring";

interface FlowTimerProps {
  onTimerEnd?: () => void;
}

export default function FlowTimer({ onTimerEnd }: FlowTimerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mode, setMode] = useState<TimerMode>("ring");
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeLeft(selectedPreset * 60);
  }, [selectedPreset]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onTimerEnd?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimerEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = 1 - timeLeft / (selectedPreset * 60);

  const reset = () => {
    setIsRunning(false);
    setTimeLeft(selectedPreset * 60);
  };

  const skip = () => {
    setIsRunning(false);
    setTimeLeft(0);
    onTimerEnd?.();
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed top-6 left-6 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-500"
        style={{
          opacity: isHovered || isOpen ? 1 : 0.2,
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Timer panel */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-6 left-20 z-50 transition-all duration-500 ${
          isOpen ? "opacity-100 -translate-x-0 pointer-events-auto" : "opacity-0 -translate-x-4 pointer-events-none"
        }`}
        style={{
          opacity: (isOpen || isHovered) ? 1 : 0,
        }}
      >
        <div className="w-72 backdrop-blur-2xl bg-black/40 border border-white/20 rounded-2xl p-5 shadow-2xl transition-all duration-300 hover:bg-black/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/90 font-medium text-sm">心流计时器</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setMode("ring")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  mode === "ring" ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10"
                }`}
              >
                环形
              </button>
              <button
                onClick={() => setMode("linear")}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  mode === "linear" ? "bg-white/20 text-white" : "text-white/50 hover:bg-white/10"
                }`}
              >
                线性
              </button>
            </div>
          </div>

          {/* Time display */}
          <div className="flex flex-col items-center mb-4">
            {mode === "ring" ? (
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 283} 283`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-light text-white/90">{formatTime(timeLeft)}</span>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/60 rounded-full transition-all duration-1000"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div className="mt-2 text-center">
                  <span className="text-2xl font-light text-white/90">{formatTime(timeLeft)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {presets.map((p) => (
              <button
                key={p.minutes}
                onClick={() => {
                  setSelectedPreset(p.minutes);
                  setTimeLeft(p.minutes * 60);
                  setIsRunning(false);
                }}
                className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                  selectedPreset === p.minutes
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex-1 py-2 rounded-full bg-white/15 text-white/80 text-sm font-medium hover:bg-white/25 transition-all"
            >
              {isRunning ? "暂停" : "开始"}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-full bg-white/10 text-white/60 text-sm hover:bg-white/15 transition-all"
            >
              重置
            </button>
            <button
              onClick={skip}
              className="px-4 py-2 rounded-full bg-white/10 text-white/60 text-sm hover:bg-white/15 transition-all"
            >
              跳过
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
