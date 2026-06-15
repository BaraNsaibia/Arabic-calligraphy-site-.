import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, CheckCheck, Smartphone, Bell, Loader2, Sparkles } from "lucide-react";
import { Order, Language } from "../types";
import { verifyOrderWithWebhook } from "../utils/api";

interface WhatsAppSandboxProps {
  language: Language;
  orders: Order[];
  onVerifyOrderLocal: (orderId: string) => void;
}

interface Message {
  id: string;
  sender: "customer" | "mohsen";
  text: string;
  timestamp: string;
}

export default function WhatsAppSandbox({ language, orders, onVerifyOrderLocal }: WhatsAppSandboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [chatLogs, setChatLogs] = useState<Record<string, Message[]>>({});
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [lastNotificationText, setLastNotificationText] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Monitor pending orders to trigger mock WhatsApp notifications
  useEffect(() => {
    const pendingOrders = orders.filter((o) => o.status === "pending");
    if (pendingOrders.length > 0) {
      const latestPending = pendingOrders[0];
      
      // If we haven't created a chat log for this order, initialize it
      if (!chatLogs[latestPending.id]) {
        const isAr = language === "ar";
        const methodLabel =
          latestPending.paymentMethod === "carte_bancaire"
            ? (isAr ? "بطاقة بنكية" : "Bank Card")
            : latestPending.paymentMethod === "carte_postale"
            ? (isAr ? "بطاقة بريدية (e-Dinar)" : "Postal Card (e-Dinar)")
            : latestPending.paymentMethod === "d17_mobile"
            ? (isAr ? "تحويل D17" : "D17 Mobile Transfer")
            : latestPending.paymentMethod === "check_on_delivery"
            ? (isAr ? "الدفع بالصك البنكي عند الاستلام" : "Check on Delivery")
            : latestPending.paymentMethod === "gallery_pickup"
            ? (isAr ? "الاستلام والدفع في المعرض" : "Gallery Showroom Pickup & Payment")
            : (isAr ? "الدفع نقداً عند الاستلام" : "Cash on Delivery");

        const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

        const text = isAr
          ? `مرحباً أستاذ محسن، لقد قمت بتقديم طلب اقتناء لوحة فنية من معرضكم الإلكتروني:
- رقم الطلب: ${latestPending.id}
- الاسم الكامل: ${latestPending.customerName}
- رقم الهاتف: ${latestPending.customerPhone}
- عنوان التوصيل: ${latestPending.shippingAddress}
- طريقة الدفع: ${methodLabel}
${latestPending.paymentReference && !latestPending.paymentReference.includes("PENDING") ? `- مرجع الدفع: ${latestPending.paymentReference}\n` : ""}
يرجى مراجعة وتأكيد الطلب بإرسال كلمة "ok" رداً على هذه الرسالة أو النقر على الرابط التالي لتأكيد حجز اللوحة:
${siteOrigin}/?verifyOrder=${latestPending.id}`
          : `Hello Mr. Mohsen, I have placed an order in your online calligraphy gallery:
- Order ID: ${latestPending.id}
- Collector: ${latestPending.customerName}
- Phone: ${latestPending.customerPhone}
- Delivery Address: ${latestPending.shippingAddress}
- Payment Method: ${methodLabel}
${latestPending.paymentReference && !latestPending.paymentReference.includes("PENDING") ? `- Payment Reference: ${latestPending.paymentReference}\n` : ""}
Please verify and confirm my order by replying with "ok" or clicking the verification link:
${siteOrigin}/?verifyOrder=${latestPending.id}`;

        const initialMsg: Message = {
          id: `msg-${Date.now()}-1`,
          sender: "customer",
          text: text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setChatLogs((prev) => ({
          ...prev,
          [latestPending.id]: [initialMsg],
        }));

        setActiveOrder(latestPending);

        if (!isOpen) {
          setNewMessageCount((c) => c + 1);
          setLastNotificationText(
            isAr
              ? `رسالة جديدة من المقتني ${latestPending.customerName} لتأكيد طلب ${latestPending.id}`
              : `New message from collector ${latestPending.customerName} for order ${latestPending.id}`
          );
          setShowNotification(true);
          // Auto hide banner after 6 seconds
          const timer = setTimeout(() => setShowNotification(false), 6000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [orders, chatLogs, isOpen, language]);

  // Scroll to chat bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatLogs, activeOrder, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !activeOrder) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}-2`,
      sender: "mohsen",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Update UI chat log
    setChatLogs((prev) => ({
      ...prev,
      [activeOrder.id]: [...(prev[activeOrder.id] || []), newMsg],
    }));

    setInputValue("");
    setIsSending(true);

    // Call Webhook and verify
    try {
      // Backend verification
      const result = await verifyOrderWithWebhook(textToSend);
      
      // Local storage sync (Frontend state)
      const isApprovedText = textToSend.toLowerCase().includes("ok") || textToSend.toLowerCase().includes("confirm") || textToSend.includes("نعم") || textToSend.includes("موافق");
      
      if (isApprovedText) {
        setTimeout(() => {
          onVerifyOrderLocal(activeOrder.id);
          
          const systemMsg: Message = {
            id: `msg-${Date.now()}-3`,
            sender: "customer",
            text: language === "ar" 
              ? `✅ نظام المعرض: تم التحقق وتأكيد الطلب ${activeOrder.id} بنجاح عبر الواتساب!` 
              : `✅ Gallery System: Order ${activeOrder.id} verified and confirmed successfully via WhatsApp!`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          setChatLogs((prev) => ({
            ...prev,
            [activeOrder.id]: [...(prev[activeOrder.id] || []), systemMsg],
          }));
          setIsSending(false);
        }, 1200);
      } else {
        setIsSending(false);
      }
    } catch (err) {
      console.error(err);
      setIsSending(false);
    }
  };

  const currentChatMessages = activeOrder ? chatLogs[activeOrder.id] || [] : [];

  return (
    <>
      {/* Toast banner notification */}
      {showNotification && (
        <div
          onClick={() => {
            setIsOpen(true);
            setShowNotification(false);
            setNewMessageCount(0);
          }}
          className="fixed top-20 right-4 z-50 max-w-sm w-full bg-[#0d1b15] border border-emerald-500/30 text-[#efebe3] rounded-lg shadow-2xl p-4 flex gap-3 cursor-pointer hover:border-emerald-500/50 transition-all duration-300 animate-bounce"
        >
          <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-400 shrink-0 self-center">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 tracking-wider">WhatsApp Sandbox</span>
              <span className="text-[10px] text-zinc-500">Just now</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed truncate font-sans text-zinc-300">
              {lastNotificationText}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotification(false);
            }}
            className="text-zinc-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Device Pill Button */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {newMessageCount > 0 && !isOpen && (
          <span className="bg-red-500 text-white font-sans font-bold text-[9px] px-2 py-0.5 rounded-full absolute -top-1.5 -left-1.5 animate-pulse z-50">
            {newMessageCount}
          </span>
        )}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setNewMessageCount(0);
          }}
          className={`p-3.5 rounded-full shadow-2xl transition-all duration-500 scale-100 hover:scale-105 flex items-center justify-center gap-2 border ${
            isOpen
              ? "bg-[#070707] border-white/10 text-white"
              : "bg-[#25D366] hover:bg-[#20ba5a] border-emerald-600 text-white"
          }`}
          title="WhatsApp Order Verification Sandbox"
          id="whatsapp-sandbox-trigger"
        >
          {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
          {!isOpen && (
            <span className="font-serif text-[10px] font-bold tracking-widest hidden sm:inline uppercase">
              {language === "ar" ? "محاكي الواتساب" : "WhatsApp Simulator"}
            </span>
          )}
        </button>
      </div>

      {/* WhatsApp Device Mockup Drawer */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-4 z-40 w-full max-w-[360px] h-[520px] bg-[#0b141a] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden font-sans text-zinc-200"
          id="whatsapp-sandbox-device"
        >
          {/* Header bar */}
          <div className="bg-[#075e54] p-3 flex items-center gap-3 border-b border-[#128c7e]/20">
            <div className="w-10 h-10 rounded-full bg-[#128c7e] text-[#efebe3] font-serif font-bold text-center flex items-center justify-center border border-white/10 shadow-inner">
              MN
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white tracking-wide truncate">
                {language === "ar" ? "أستاذ محسن نصائيبة (الفنان)" : "Master Mohsen (Artist Phone)"}
              </h4>
              <span className="text-[10px] text-emerald-300 block flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                {language === "ar" ? "متصل الآن (محاكي الويب)" : "Online (Sandbox Webhook)"}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-emerald-200 hover:text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Header for Order Switching */}
          <div className="bg-[#128c7e]/10 px-3 py-2 border-b border-white/5 flex items-center justify-between text-[10.5px]">
            <span className="text-zinc-400">
              {language === "ar" ? "الحجز النشط للتحقق:" : "Verify Active Order:"}
            </span>
            {activeOrder ? (
              <select
                value={activeOrder.id}
                onChange={(e) => {
                  const selected = orders.find((o) => o.id === e.target.value);
                  if (selected) setActiveOrder(selected);
                }}
                className="bg-black/30 border border-white/10 rounded-sm text-gold font-mono px-1.5 py-0.5 focus:outline-none"
              >
                {orders
                  .filter((o) => o.status === "pending")
                  .map((o) => (
                    <option key={o.id} value={o.id} className="bg-[#0b141a]">
                      {o.id} ({o.customerName})
                    </option>
                  ))}
              </select>
            ) : (
              <span className="text-zinc-500 font-serif font-semibold">
                {language === "ar" ? "لا توجد حجوزات معلقة" : "No pending orders"}
              </span>
            )}
          </div>

          {/* Chat Messages Log */}
          <div
            className="flex-1 overflow-y-auto p-3.5 space-y-4 bg-repeat"
            style={{
              backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
              backgroundBlendMode: "overlay",
              backgroundColor: "#0b141a",
            }}
          >
            {activeOrder ? (
              currentChatMessages.map((msg) => {
                const isMohsen = msg.sender === "mohsen";
                const isSystem = msg.text.startsWith("✅") || msg.text.startsWith("❌");
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <div className="bg-[#1d272c] border border-emerald-500/20 rounded-md px-3 py-1.5 max-w-[90%] text-center text-[10.5px] font-sans text-emerald-300">
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMohsen ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-2.5 shadow-md relative text-xs leading-relaxed font-sans ${
                        isMohsen
                          ? "bg-[#056162] text-white rounded-tr-none"
                          : "bg-[#262d31] text-zinc-100 rounded-tl-none border border-white/5"
                      }`}
                    >
                      <p className="whitespace-pre-line pr-6 pb-2 break-words font-sans">
                        {msg.text}
                      </p>
                      <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[8.5px] text-zinc-400">
                        <span>{msg.timestamp}</span>
                        {isMohsen && <CheckCheck className="w-3.5 h-3.5 text-sky-400" />}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
                <Smartphone className="w-10 h-10 text-zinc-650" />
                <p className="font-serif text-xs text-zinc-550 max-w-[200px] leading-relaxed">
                  {language === "ar"
                    ? "بمجرد تقديم طلب جديد في المعرض، ستتلقى هنا رسالة واتساب للتحقق منها وتأكيدها."
                    : "Once you place a pending order in the cart, a simulated WhatsApp verification text will arrive here."}
                </p>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Approval Action Toolbar */}
          {activeOrder && activeOrder.status === "pending" && (
            <div className="bg-[#1e2428] px-3.5 py-2 border-t border-white/5 flex items-center justify-between gap-2">
              <span className="text-[10px] text-zinc-400 flex items-center gap-1 font-serif">
                <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
                {language === "ar" ? "التحقق السريع:" : "Quick Actions:"}
              </span>
              <button
                onClick={() => handleSendMessage("ok")}
                disabled={isSending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-serif font-black uppercase text-[10px] px-3 py-1.5 rounded-sm flex items-center gap-1.5 shadow transition-all duration-300 disabled:opacity-50"
              >
                {isSending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>{language === "ar" ? "تأكيد الطلب (إرسال ok)" : "Approve (Reply ok)"}</span>
                )}
              </button>
            </div>
          )}

          {/* Input text box bar */}
          <div className="bg-[#1e2428] p-2 flex items-center gap-2 border-t border-white/5">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                activeOrder
                  ? (language === "ar" ? "اكتب رسالة (مثال: ok)" : "Type message (e.g. ok)...")
                  : (language === "ar" ? "لا توجد محادثة نشطة" : "No active chat")
              }
              disabled={!activeOrder || isSending}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage(inputValue);
              }}
              className="flex-1 bg-[#2a2f32] border border-white/5 rounded-full px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-600 transition-colors"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || !activeOrder || isSending}
              className="p-2 bg-[#00a884] hover:bg-[#008f72] text-white rounded-full disabled:opacity-40 transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
