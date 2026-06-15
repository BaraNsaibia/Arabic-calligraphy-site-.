import { Language } from "../types";
import { TRANSLATIONS } from "../data";

interface PhilosophyProps {
  language: Language;
}

export default function Philosophy({ language }: PhilosophyProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === "ar";

  return (
    <section id="philosophy" className="py-24 bg-charcoal border-y border-white/5 relative overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(212,175,55,0.03),transparent_50%)] pointer-events-none" />
      
      <div className="max-w-5xl px-4 mx-auto sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          
          {/* Left / Info side */}
          <div className="md:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="font-sans text-xs tracking-[0.2em] font-bold text-gold uppercase block">
                {t.philosophyTitle}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                {t.philosophySub}
              </h2>
            </div>

            {/* Geometric luxury divider line */}
            <div className="w-full h-[1px] bg-gradient-to-r from-gold/50 via-zinc-800 to-transparent" />

            <p className="font-sans text-sm sm:text-base text-zinc-300 leading-relaxed font-light">
              {t.philosophyDsc}
            </p>
          </div>

          {/* Right Metrics Cards */}
          <div className="md:col-span-5 grid grid-cols-2 gap-4">
            {/* Metric 1 */}
            <div className="p-6 rounded-md glass-panel text-center flex flex-col items-center justify-center space-y-2 group hover:border-gold/20 transition-colors duration-300">
              <span className="font-serif text-4xl sm:text-5xl font-extrabold text-gold tracking-tight" id="metric-exp">
                +25
              </span>
              <span className="font-sans text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t.metricExp}
              </span>
            </div>

            {/* Metric 2 */}
            <div className="p-6 rounded-md glass-panel text-center flex flex-col items-center justify-center space-y-2 group hover:border-gold/20 transition-colors duration-300">
              <span className="font-serif text-4xl sm:text-5xl font-extrabold text-gold tracking-tight" id="metric-collected">
                +20
              </span>
              <span className="font-sans text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t.metricCollected}
              </span>
            </div>
          </div>

        </div>

        {/* Decorative architectural layout detail line */}
        <div className="mt-16 w-full h-[1px] bg-white/5" />
      </div>
    </section>
  );
}
