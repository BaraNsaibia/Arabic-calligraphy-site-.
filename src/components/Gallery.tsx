import { useState } from "react";
import { ArrowLeft, ZoomIn, ShoppingBag, X, Check, BookOpen, Sparkles, Layers, Compass } from "lucide-react";
import { Language, Artwork } from "../types";
import { ARTWORKS, TRANSLATIONS } from "../data";
import PriceTag from "./PriceTag";

interface GalleryProps {
  language: Language;
  onAddToCart: (artwork: Artwork, selectedFrame: "classic_wood" | "museum_gold" | "obsidian_minimal") => void;
}

// Specialized localized strings for the premium articles system
const localization = {
  ar: {
    galleryTab: "المعرض الفني ومقتنيات الذهب",
    gallerySubtitle: "الأعمال الفنية الأصلية للفنان محسن نصائيبة شاملة الإطار والبلور الأثري المقاوم للانعكاس",
  },
  en: {
    galleryTab: "Art Portfolio & Collectibles",
    gallerySubtitle: "Bespoke Masterpieces and Original Canvas Art by Mohsen Nsaibia with Glare-Free Museum Glass",
  }
};

export default function Gallery({ language, onAddToCart }: GalleryProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "luxury" | "geometric" | "lettering">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<"classic_wood" | "museum_gold" | "obsidian_minimal">("museum_gold");
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const t = TRANSLATIONS[language];
  const l = localization[language];
  const isRtl = language === "ar";

  // Filter logic
  const filteredArtworks = ARTWORKS.filter((art) => {
    if (activeFilter === "all") return true;
    return art.category === activeFilter;
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredArtworks.length / itemsPerPage);

  // Highlight logic matching visual constraints
  const displayedArtworks = filteredArtworks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getFramePriceModifier = (frame: string) => {
    return 0;
  };

  const handleAcquire = (artwork: Artwork) => {
    onAddToCart(artwork, selectedFrame);
    setPurchaseSuccess(true);
    setTimeout(() => {
      setPurchaseSuccess(false);
      setSelectedArtwork(null);
    }, 2000);
  };

  return (
    <section id="gallery" className="py-24 bg-charcoal border-b border-white/5 relative" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl px-4 mx-auto sm:px-6 lg:px-8">
        
        {/* Dynamic Section Header Rows */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          
          <div className="space-y-2 max-w-2xl">
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-gold font-bold block">
              {t.curatedTitle}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#efebe3] leading-snug">
              {l.gallerySubtitle}
            </h2>
          </div>

          {totalPages > 1 && (
            <div className="text-xs font-sans text-zinc-400 uppercase tracking-widest self-start md:self-end">
              {isRtl
                ? `الصفحة ${currentPage} من ${totalPages}`
                : `Page ${currentPage} of ${totalPages}`}
            </div>
          )}
        </div>

        {/* Categories Tab selectors (shared seamlessly!) */}
        <div className="flex flex-wrap items-center gap-2 mb-10 border-b border-white/5 pb-4">
          {[
            { id: "all", label: t.galleryFilterAll },
            { id: "luxury", label: t.galleryFilterLuxury },
            { id: "geometric", label: t.galleryFilterGeometric },
            { id: "lettering", label: t.galleryFilterLettering }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveFilter(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-[2px] border transition-all duration-300 ${
                activeFilter === tab.id
                  ? "bg-gold text-obsidian border-gold"
                  : "bg-transparent text-zinc-400 border-white/10 hover:text-white hover:border-white/20"
              }`}
              id={`filter-tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ENHANCED SECTION RENDER BLOCK */}
        {/* STANDARD ART PORTFOLIO GRID */}
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedArtworks.map((art) => (
                <div
                  key={art.id}
                  onClick={() => {
                    setSelectedArtwork(art);
                    setSelectedFrame("museum_gold");
                  }}
                  className="group cursor-pointer flex flex-col items-center select-none"
                  id={`artwork-card-${art.id}`}
                >
                  <div className="relative aspect-square w-full bg-[#0a0a0a] rounded-[2px] overflow-hidden p-1.5 transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(212,175,55,0.15)] group-hover:border-gold/30 border border-white/5 flex items-center justify-center">
                    <img
                      src={art.image}
                      alt={isRtl ? art.titleAr : art.titleEn}
                      className="w-full h-full object-cover rounded-sm filter brightness-[0.85] contrast-105 group-hover:brightness-100 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
                      <span className="px-2 py-1 bg-obsidian/85 text-gold text-[9px] font-bold uppercase tracking-wider rounded-[2px] border border-gold/20">
                        {art.limitedEdition ? t.limitedTag : t.standardTag}
                      </span>
                    </div>

                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="p-3 rounded-full bg-gold/10 text-gold border border-gold/30">
                        <ZoomIn className="w-5 h-5" />
                      </span>
                    </span>
                  </div>

                  <div className="w-full mt-4 flex justify-between items-start gap-3">
                    <div className="space-y-1">
                      <h3 className="font-serif text-lg font-bold text-[#efebe3] transition-colors group-hover:text-gold block">
                        {isRtl ? art.titleAr : art.titleEn}
                      </h3>
                      <p className="font-sans text-[11px] text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>{isRtl ? art.subtitleAr : art.subtitleEn}</span>
                        <span className="text-zinc-600 font-normal hidden xs:inline">•</span>
                        <span className="text-gold/80 font-sans text-[11px] font-medium">{art.size}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <PriceTag price={art.price} currency={t.currency} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grey Pagination Buttons */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-16" id="gallery-pagination">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => {
                      setCurrentPage(pageNum);
                      document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border ${
                      currentPage === pageNum
                        ? "bg-gold border-gold text-obsidian shadow-lg shadow-gold/25 scale-105 font-serif"
                        : "bg-[#181818] border-white/5 text-zinc-400 hover:bg-[#282828] hover:text-[#efebe3] hover:border-white/10 font-sans"
                    }`}
                    id={`pagination-page-${pageNum}`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
            )}
          </div>

      </div>

      {/* High Fidelity Purchase & Reading Modal */}
      {selectedArtwork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/95 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl p-6 sm:p-8 rounded-lg glass-panel-gold border border-gold/30 my-8" dir={isRtl ? "rtl" : "ltr"}>
            
            <button
              onClick={() => setSelectedArtwork(null)}
              className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-white transition-colors"
              id="close-gallery-modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Content Controllers */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-4 items-start">
              
              {/* Left Column: Visual Representation (4 Cols) */}
              <div className="lg:col-span-5 relative aspect-square w-full max-w-md mx-auto bg-black p-1.5 border-2 border-gold/25 rounded shadow-xl shrink-0">
                <img
                  src={selectedArtwork.image}
                  alt={isRtl ? selectedArtwork.titleAr : selectedArtwork.titleEn}
                  className="w-full h-full object-cover rounded-[1px]"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Right Column: Switching tabs content (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* TAB CONTENT: BUYING CONFIGS */}
                <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-1.5">
                      <span className="px-2 py-1 bg-gold/10 text-gold text-[9px] font-bold uppercase tracking-wider rounded-[2px] border border-gold/20 inline-block">
                        {selectedArtwork.limitedEdition ? t.limitedTag : t.standardTag}
                      </span>
                      <h3 className="font-serif text-3xl font-extrabold text-[#efebe3]">
                        {isRtl ? selectedArtwork.titleAr : selectedArtwork.titleEn}
                      </h3>
                      <p className="font-sans text-xs text-zinc-400">
                        {isRtl ? selectedArtwork.subtitleAr : selectedArtwork.subtitleEn}
                      </p>
                    </div>

                    <div className="py-3 border-y border-white/5 space-y-3">
                      <p className="font-sans text-xs sm:text-sm text-[#efebe3] leading-relaxed">
                        {isRtl ? selectedArtwork.descriptionAr : selectedArtwork.descriptionEn}
                      </p>
                      
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span className="text-gold font-serif text-[11px] uppercase tracking-wider font-semibold">
                          {isRtl ? "المقاس الحقيقي:" : "Actual Frame Size:"}
                        </span>
                        <span className="font-mono bg-white/5 border border-white/10 px-2 py-0.5 rounded text-zinc-300 font-medium">
                          {selectedArtwork.size}
                        </span>
                      </div>
                    </div>

                    {/* Framing options */}
                    <div className="space-y-2">
                      <label className="font-serif text-xs font-bold uppercase tracking-wider text-gold block">
                        {isRtl ? "نوع الإطار" : "Frame Type"}
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: "museum_gold", label: isRtl ? "الإطار الفاخر باللون الذهبي البراق (مُشمل في سعر اللوحة الأصلي)" : "Luxury Gold-Bordered Frame (Included with original artwork)", extra: 0 }
                        ].map((frame) => (
                          <div
                            key={frame.id}
                            className="flex items-center justify-between p-3 border border-gold bg-gold/[0.03] text-gold rounded-[2px] text-xs"
                            id={`frame-select-${frame.id}`}
                          >
                            <span className="font-sans font-medium flex items-center gap-2">
                              <Check className="w-3.5 h-3.5" />
                              {frame.label}
                            </span>
                            <span className="font-serif font-bold text-gold">
                              {isRtl ? "مُشمل ومثبت" : "Included"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Final priced block */}
                    <div className="flex items-center justify-between p-4 bg-obsidian/40 border border-white/5 rounded-[2px]">
                      <span className="font-sans text-xs text-zinc-400 uppercase tracking-widest block">
                        {isRtl ? "قيمة حجز الاقتناء الكلية" : "Configured Acquisition Value"}
                      </span>
                      <PriceTag
                        price={selectedArtwork.price + getFramePriceModifier(selectedFrame)}
                        currency={t.currency}
                      />
                    </div>

                    {purchaseSuccess ? (
                      <div className="flex items-center justify-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-[2px]">
                        <Check className="w-4 h-4" />
                        <span>{isRtl ? "تمت الإضافة لحقيبة الاقتناء بنجاح!" : "Added to Art Bag successfully!"}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAcquire(selectedArtwork)}
                        className="w-full py-4 bg-gold hover:bg-gold-hover text-obsidian text-xs font-bold uppercase tracking-widest rounded-[2px] flex items-center justify-center gap-2 border border-gold/30 hover:shadow-lg hover:shadow-gold/15 transition-all duration-300"
                        id="acquire-now-btn"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{t.btnPurchase}</span>
                      </button>
                    )}
                  </div>
                </div>

            </div>

          </div>
        </div>
      )}
    </section>
  );
}
