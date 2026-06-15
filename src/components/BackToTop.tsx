import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Language } from "../types";
import { TRANSLATIONS } from "../data";

interface BackToTopProps {
  language: Language;
}

export default function BackToTop({ language }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-40 p-3 bg-black/80 hover:bg-black rounded-full border border-gold/40 text-gold hover:text-white shadow-lg shadow-gold/10 hover:shadow-gold/30 hover:scale-110 active:scale-95 transition-all duration-300 animate-fade-in group cursor-pointer"
      title={t.backToTop}
      id="back-to-top-btn"
    >
      <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-300" />
      <span className="sr-only">{t.backToTop}</span>
    </button>
  );
}
