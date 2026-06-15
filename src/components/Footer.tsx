import React, { useState } from "react";
import { Mail, Phone, ExternalLink, Globe, Facebook, Instagram } from "lucide-react";
import { Language } from "../types";
import { TRANSLATIONS } from "../data";
import { isApiEnabled, subscribeNewsletter } from "../utils/api";

interface FooterProps {
  language: Language;
}

export default function Footer({ language }: FooterProps) {
  const [emailInput, setEmailInput] = useState("");
  const [submittedNl, setSubmittedNl] = useState(false);

  const t = TRANSLATIONS[language];
  const isRtl = language === "ar";

  const handleNlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;

    if (isApiEnabled()) {
      await subscribeNewsletter(emailInput, language);
    }

    setSubmittedNl(true);
    setTimeout(() => {
      setSubmittedNl(false);
      setEmailInput("");
    }, 3500);
  };

  return (
    <footer className="bg-obsidian border-t border-white/5 pt-20 pb-8 text-zinc-400 relative" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-7xl px-4 mx-auto sm:px-6 lg:px-8 space-y-16">
        
        {/* Newsletter Subscription Box */}
        <div className="max-w-4xl mx-auto p-8 rounded-md glass-panel border border-gold/15 relative z-10 overflow-hidden text-center flex flex-col items-center">
          <span className="p-3.5 rounded-full bg-gold/15 text-gold mb-4 border border-gold/25 block">
            <Mail className="w-6 h-6 animate-pulse" />
          </span>

          <h3 className="font-serif text-2xl font-bold text-[#efebe3]">
            {t.newsletterTitle}
          </h3>

          <p className="font-sans text-xs text-zinc-400 max-w-lg mt-2 mb-6 leading-relaxed">
            {t.newsletterSub}
          </p>

          {submittedNl ? (
            <div className="p-4 rounded-[2px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold max-w-sm">
              {t.newsletterSuccess}
            </div>
          ) : (
            <form onSubmit={handleNlSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={t.newsletterPlaceholder}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-[2px] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors text-center sm:text-right"
                id="newsletter-email-field"
              />
              <button
                type="submit"
                className="py-3 px-6 bg-gold hover:bg-gold-hover text-obsidian text-xs font-serif font-extrabold uppercase tracking-wide rounded-[2px] transition-colors shrink-0"
                id="newsletter-subscribe-btn"
              >
                {t.newsletterBtn}
              </button>
            </form>
          )}
        </div>

        {/* Brand columns info */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pt-8 border-t border-white/5">
          
          {/* Col 1: Artist Brand */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-serif text-lg font-bold text-[#efebe3]">
              {t.brandName}
            </h4>
            <p className="font-sans text-xs text-zinc-400 leading-relaxed">
              {t.footerStory}
            </p>
            <div className="flex gap-3">
              <a href="https://facebook.com/mohsen.nsaibia" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-gold transition-colors border border-white/5">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/mohsen.nsaibia" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-gold transition-colors border border-white/5">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://behance.net/mohsen-nsaibia" target="_blank" rel="noreferrer" className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-gold transition-colors border border-white/5">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-gold">
              {t.footerLinks}
            </h4>
            <ul className="space-y-2 text-xs">
              {[
                { label: isRtl ? "بيان الخصوصية الفنية" : "Artist Privacy Guarantee", url: "#" },
                { label: isRtl ? "شروط الخدمة والاقتناء" : "Acquisition Policy Guidelines", url: "#" },
                { label: isRtl ? "الشحن الدولي والتركيب الخاص" : "Global Concierge Shipments", url: "#" },
                { label: isRtl ? "الملف الصحفي والإعلامي" : "Museum Press Portfolio", url: "#" }
              ].map((link, lIdx) => (
                <li key={lIdx}>
                  <a href={link.url} className="hover:text-gold transition-colors flex items-center gap-1">
                    <span>{link.label}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-zinc-650" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Direct Contact desk */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-gold">
              {t.footerContact}
            </h4>
            <div className="space-y-3 text-xs">
              <a href="tel:+21697816225" className="flex items-center gap-2.5 text-zinc-300 hover:text-gold transition-colors" id="contact-tel-link">
                <Phone className="w-4 h-4 text-gold/80" />
                <span className="font-mono">+216 97 816 225</span>
              </a>
              <a href="mailto:MohsenNsaibia-service@gmail.com" className="flex items-center gap-2.5 text-zinc-300 hover:text-gold transition-colors" id="contact-mail-link">
                <Mail className="w-4 h-4 text-gold/80" />
                <span className="font-serif">MohsenNsaibia-service@gmail.com</span>
              </a>
            </div>
          </div>

        </div>

        {/* Final Copyright */}
        <div className="text-center pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-4">
          <span>
            {isRtl ? "تأسس الإتقان والخط الكوفي المعاصر عام ٢٠٢٤. جميع الحقوق الفنية مرخصة." : "Precision and contemporary Kufic calligraphy established 2024. All Artworks Certified."}
          </span>
          <span className="font-serif text-gold font-bold">
            .Mohsen Nsaibia. Crafted with Precision & Gold Colors ©
          </span>
        </div>

      </div>
    </footer>
  );
}
