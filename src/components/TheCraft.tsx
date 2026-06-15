import { useState } from "react";
import { Compass, ShieldCheck, PenTool } from "lucide-react";
import { Language } from "../types";
import { TRANSLATIONS } from "../data";

interface TheCraftProps {
  language: Language;
}

export default function TheCraft({ language }: TheCraftProps) {
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);

  const t = TRANSLATIONS[language];
  const isRtl = language === "ar";

  const features = [
    {
      id: "wood_gold",
      icon: Compass,
      title: t.craftFeature1Title,
      dsc: t.craftFeature1Dsc,
      hotspotClass: "border-4 border-gold bg-gold/10 scale-105",
      hotspotStyles: { top: "10%", left: "10%", width: "80%", height: "80%" },
      highlightMsg: isRtl ? "ملمس خشب الساج مصقول يدوياً مع تفتيح ذهبي" : "Hand-polished rustic wood with beautiful gold lacquer highlights"
    },
    {
      id: "glass",
      icon: ShieldCheck,
      title: t.craftFeature2Title,
      dsc: t.craftFeature2Dsc,
      hotspotClass: "border-2 border-emerald-400/70 bg-emerald-400/5 rotate-1",
      hotspotStyles: { top: "2%", left: "2%", width: "96%", height: "96%" },
      highlightMsg: isRtl ? "درع بلوري نقي مضاد للانعكاس والأشعة البنفسجية" : "Ultra-thick, zero-reflection glass shield protection"
    },
    {
      id: "geometry",
      icon: PenTool,
      title: t.craftFeature3Title,
      dsc: t.craftFeature3Dsc,
      hotspotClass: "border border-cyan-400/50 animated-grid-overlay",
      hotspotStyles: { top: "15%", left: "15%", width: "70%", height: "70%" },
      highlightMsg: isRtl ? "تطابق هندسي ١:١ على شبكات كوفية مشغولة يدوياً" : "Flawless mathematical alignment on hand-traced grids"
    }
  ];

  return (
    <section id="craft" className="py-24 bg-obsidian text-white relative overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-6xl px-4 mx-auto sm:px-6">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-2">
          <span className="font-serif text-[11px] uppercase tracking-[0.4em] text-gold block">
            {t.craftTitle}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#efebe3]">
            {t.craftSubtitle}
          </h2>
          <div className="w-12 h-[2px] bg-gold/40 mx-auto mt-4" />
        </div>

        {/* Media Block Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Frame Display with interactive overlays */}
          <div className="md:col-span-6 relative flex justify-center">
            <div className="relative aspect-[4/5] w-full max-w-md bg-[#000] p-1.5 border border-white/10 rounded-md overflow-hidden group">
              <img
                src="/src/assets/images/real_wa_jaalna_muttaqin.jpeg"
                alt="Artist workshop craft details"
                className="w-full h-full object-cover rounded-sm filter brightness-95 opacity-90 transition-all duration-500 group-hover:brightness-100"
                referrerPolicy="no-referrer"
              />
              {/* Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

              {/* Dynamic hotspot visuals corresponding to active hovered item */}
              {features.map((feat) => {
                const isActive = activeHighlight === feat.id;
                return (
                  <div
                    key={feat.id}
                    className={`absolute rounded-sm transition-all duration-500 flex items-center justify-center ${
                      isActive ? feat.hotspotClass + " opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                    style={feat.hotspotStyles}
                  >
                    {isActive && (
                      <div className="p-3 bg-obsidian/95 border border-gold/30 rounded text-[10px] text-zinc-100 font-mono tracking-wide absolute bottom-4 shadow-xl z-20 flex flex-col items-center">
                        <span className="text-gold uppercase font-bold text-[8px] tracking-wider mb-1">
                          {isRtl ? "منظور فني" : "Technique Visualized"}
                        </span>
                        <span>{feat.highlightMsg}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Highlights Lists */}
          <div className="md:col-span-6 space-y-6">
            {features.map((feat) => {
              const IconComp = feat.icon;
              const isActive = activeHighlight === feat.id;

              return (
                <div
                  key={feat.id}
                  onMouseEnter={() => setActiveHighlight(feat.id)}
                  onMouseLeave={() => setActiveHighlight(null)}
                  className={`p-6 rounded-md border transition-all duration-300 cursor-pointer flex items-start gap-4 ${
                    isActive
                      ? "border-gold/30 bg-gold/[0.02]"
                      : "border-white/5 bg-white/[0.01] hover:border-white/10"
                  }`}
                  id={`craft-feature-${feat.id}`}
                >
                  <span className={`p-3 rounded-md border transition-colors ${
                    isActive ? "bg-gold/10 text-gold border-gold/20" : "bg-white/5 text-zinc-400 border-white/5"
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </span>

                  <div className="space-y-1">
                    <h3 className={`font-serif text-lg font-bold transition-colors ${
                      isActive ? "text-gold" : "text-[#efebe3]"
                    }`}>
                      {feat.title}
                    </h3>
                    <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                      {feat.dsc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
