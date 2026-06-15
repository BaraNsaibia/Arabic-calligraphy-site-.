import { ArrowDown } from "lucide-react";
import { Language } from "../types";
import { TRANSLATIONS } from "../data";

interface HeroProps {
  language: Language;
  onExploreClick: () => void;
  onBioClick: () => void;
}

export default function Hero({ language, onExploreClick, onBioClick }: HeroProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === "ar";

  return (
    <section id="home" className="relative min-h-[70vh] sm:min-h-[92vh] flex flex-col justify-center items-center py-10 sm:py-16 overflow-hidden">
      {/* Dynamic Animated Grid Pattern background */}
      <div className="absolute inset-0 z-0 animated-grid-overlay pointer-events-none" />

      {/* Radiant ambient gold light spotlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/10 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl w-full px-4 mx-auto text-center flex flex-col items-center">
        
        {/* Master Calligraphy Gold Frame Section */}
        <div id="hero-artwork-frame" className="w-full max-w-4xl p-1 bg-[#1c1a16] border-[6px] border-[#c09d3c] rounded-[4px] shadow-2xl transition-transform duration-700 hover:scale-[1.01] overflow-hidden group mb-8 sm:mb-12">
          <div className="relative aspect-[4/5] sm:aspect-[16/9] w-full bg-[#030302] overflow-hidden border border-black/50">
            {/* The hot-linked high fidelity generated artist piece */}
            <img
              src="/images/real_calligraphic_architecture.jpeg"
              alt="Mohsen Nsaibia Masterpiece Calligraphy"
              className="w-full h-full object-cover opacity-90 transition-all duration-1000 group-hover:scale-105 group-hover:opacity-100"
              referrerPolicy="no-referrer"
            />
            {/* Subtle ambient shadow vignetting */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/70 pointer-events-none" />

            {/* Inner Title Overlays echoing the original visual mockup */}
            <div className="absolute inset-0 flex flex-col justify-center items-center px-6">
              <span className="font-sans text-[10px] sm:text-xs tracking-[0.4em] font-black text-gold/80 uppercase mb-2">
                MASTER CALLIGRAPHY
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#efebe3] font-extrabold tracking-wide drop-shadow-lg text-center leading-relaxed">
                {isRtl ? "الفنان محسن نصائيبة — روائع الخط العربي" : "Master Artist Mohsen Nsaibia — Arabic Treasures"}
              </h2>
              <div className="w-16 h-[2px] bg-gold my-4" />
              <p className="max-w-xl text-[11px] sm:text-xs text-zinc-300 font-sans tracking-wide leading-relaxed drop-shadow-md text-center">
                {t.heroDsc}
              </p>

              {/* Action overlays mimicking the layout */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                <button
                  onClick={onExploreClick}
                  className="px-5 py-2.5 bg-gold hover:bg-gold-hover text-obsidian text-[11px] font-bold uppercase tracking-wider rounded-[2px] transition-all duration-350 shadow-md transform active:scale-95"
                  id="hero-explore-btn"
                >
                  {t.btnExplore}
                </button>
                <button
                  onClick={onBioClick}
                  className="px-5 py-2.5 bg-transparent border border-white/40 hover:border-gold hover:text-gold text-white text-[11px] font-bold uppercase tracking-wider rounded-[2px] transition-all duration-350 shadow-md backdrop-blur-sm"
                  id="hero-bio-btn"
                >
                  {t.btnBio}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Indicator element mirroring the golden chevron */}
        <button
          onClick={onExploreClick}
          className="flex flex-col items-center gap-2 cursor-pointer text-gold/60 hover:text-gold transition-colors duration-300 animate-bounce"
          title="Proceed Deeper"
          id="hero-chevron"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
}
