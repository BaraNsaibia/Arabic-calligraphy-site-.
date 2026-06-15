import React from "react";
import { Language } from "../types";
import { TRANSLATIONS } from "../data";

interface WhatsAppFloatProps {
  language: Language;
}

export default function WhatsAppFloat({ language }: WhatsAppFloatProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === "ar";
  
  const phoneNumber = "21697816225";
  const message = isRtl
    ? encodeURIComponent("مرحباً أستاذ محسن، أود الاستفسار عن لوحاتك الفنية الكوفية التربيعية المعروضة في المعرض.")
    : encodeURIComponent("Hello Mr. Mohsen, I am interested in inquiring about your Square Kufic artworks.");
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-40 p-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 cursor-pointer group flex items-center justify-center border border-white/10"
      title={t.whatsappTooltip}
      id="whatsapp-float-btn"
    >
      {/* Official WhatsApp SVG Logo */}
      <svg
        className="w-6 h-6 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 0 0 1.333 4.982L2 22l5.202-1.364a9.92 9.92 0 0 0 4.804 1.24c5.507 0 9.99-4.477 9.99-9.983A9.99 9.99 0 0 0 12.012 2zm0 1.637c4.603 0 8.35 3.746 8.351 8.35 0 2.228-.88 4.323-2.479 5.922a8.307 8.307 0 0 1-5.872 2.43c-2.008 0-3.978-.574-5.69-1.658l-.408-.24-3.09.81.824-3.011-.264-.42a8.314 8.314 0 0 1-1.373-4.631c0-4.604 3.747-8.352 8.351-8.352zm-3.642 2.923c-.198 0-.41.05-.595.144-.316.162-.647.531-.647 1.157 0 .584.28 1.187.536 1.542.062.086 1.057 1.688 2.656 2.316.592.233 1.054.385 1.41.492.628.193 1.205.166 1.662.098.508-.076 1.565-.637 1.787-1.25.223-.615.223-1.14.156-1.25-.067-.11-.247-.17-.52-.307-.272-.136-1.614-.794-1.863-.884-.249-.091-.43-.136-.612.136-.182.272-.705.884-.863 1.066-.158.18-.317.204-.59.068-.272-.136-1.15-.424-2.19-1.352-.809-.72-1.356-1.612-1.515-1.884-.158-.272-.017-.42.12-.556.123-.122.272-.317.408-.475.137-.159.182-.272.273-.453.09-.18.046-.34-.023-.476-.068-.136-.612-1.474-.839-2.02-.222-.533-.448-.46-.613-.469-.158-.008-.34-.01-.52-.01z" />
      </svg>
      {/* Tooltip on Hover */}
      <span className={`absolute bg-[#0a0a0a] text-[#efebe3] border border-white/10 px-3 py-1.5 rounded-md text-[10px] font-sans tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none shadow-2xl -top-12 ${isRtl ? "left-0" : "right-0"}`}>
        {t.whatsappTooltip}
      </span>
    </a>
  );
}
