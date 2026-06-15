import React, { useEffect, useState } from "react";
import { KUFIC_CHARACTERS_MAP, TRANSLATIONS } from "../data";
import { Language } from "../types";

interface LoadingScreenProps {
  language: Language;
  onFinished: () => void;
}

export default function LoadingScreen({ language, onFinished }: LoadingScreenProps) {
  const [fading, setFading] = useState(false);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    // Show for 2 seconds, then start fading
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2000);

    // Call onFinished after fade animation completes (500ms)
    const finishTimer = setTimeout(() => {
      onFinished();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinished]);

  // Arabic letters for "محسن" (Mohsen) in right-to-left order when rendered
  // "ن" (leftmost), "س", "ح", "م" (rightmost)
  const letters = ["ن", "س", "ح", "م"];

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-obsidian transition-opacity duration-500 ease-in-out ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      id="loading-screen-container"
    >
      {/* Background blueprint grid */}
      <div className="absolute inset-0 animated-grid-overlay opacity-15" />

      <div className="relative z-10 flex flex-col items-center space-y-8 max-w-md px-4 text-center animate-slide-up">
        {/* Monogram Monolith Container */}
        <div className="p-6 rounded-xl glass-panel-gold border border-gold/20 shadow-2xl relative overflow-hidden">
          <div className="absolute -inset-full gold-shimmer opacity-20 pointer-events-none" />
          
          {/* 4 letters rendered side by side */}
          <div className="flex gap-3 sm:gap-4 justify-center" dir="ltr">
            {letters.map((char, charIdx) => {
              const matrix = KUFIC_CHARACTERS_MAP[char] || KUFIC_CHARACTERS_MAP.default;
              return (
                <div key={charIdx} className="grid grid-cols-4 gap-[2px] sm:gap-[3px] bg-black/40 p-2 rounded-md border border-white/5 shadow-inner">
                  {matrix.map((row, rowIdx) =>
                    row.map((cell, cellIdx) => (
                      <div
                        key={`${rowIdx}-${cellIdx}`}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-xs transition-all duration-700 ${
                          cell
                            ? "bg-gradient-to-br from-gold to-[#f0d070] shadow-[0_0_8px_rgba(212,175,55,0.6)] scale-100"
                            : "bg-white/[0.01] border border-white/[0.03] scale-95"
                        }`}
                        style={{
                          transitionDelay: `${(3 - charIdx) * 150 + (rowIdx * 4 + cellIdx) * 20}ms`,
                        }}
                      />
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <h1 className="font-serif text-3xl font-extrabold text-[#efebe3] tracking-wide">
            {t.brandName}
          </h1>
          <p className="font-sans text-[10px] tracking-[0.25em] font-medium text-gold uppercase">
            {t.brandTitle}
          </p>
        </div>

        {/* Progress Bar / Pulse */}
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-gold/50 via-gold to-gold/50 w-full animate-[shimmer_1.5s_infinite_linear]" style={{ backgroundSize: "200% 100%" }} />
        </div>

        <p className="font-sans text-xs text-zinc-500 animate-pulse mt-2">
          {t.loadingText}
        </p>
      </div>
    </div>
  );
}
