"use client";

import { useState } from "react";

interface VibeMixerProps {
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
}

export default function VibeMixer({
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
}: VibeMixerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-500"
        style={{
          opacity: isHovered || isOpen ? 1 : 0.2,
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      </button>

      {/* Panel */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-6 right-20 z-50 transition-all duration-500 ${
          isOpen ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-4 pointer-events-none"
        }`}
        style={{
          opacity: (isOpen || isHovered) ? 1 : 0,
        }}
      >
        <div className="w-72 backdrop-blur-2xl bg-black/40 border border-white/20 rounded-2xl p-5 shadow-2xl transition-all duration-300 hover:bg-black/50">
          <h2 className="text-white/90 font-medium mb-5 text-sm">氛围控制台</h2>

          {/* Rain */}
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

          {/* Snow */}
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

          {/* Blur */}
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

          {/* White noise */}
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

          {/* Music blend */}
          <div className="mb-2">
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
      </div>
    </>
  );
}
