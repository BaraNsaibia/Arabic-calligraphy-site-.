import React, { useState } from "react";
import { X, Trash2, CheckCircle, CreditCard, ShieldCheck, Smartphone, Landmark, Loader2, HandCoins, Store, FileText } from "lucide-react";
import { Language, CartItem, Order } from "../types";
import { ARTWORKS, TRANSLATIONS } from "../data";
import PriceTag from "./PriceTag";
import { createOrder, isApiEnabled } from "../utils/api";

interface CartSidebarProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onRemoveFromCart: (artworkId: string, selectedFrame: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
}

export default function CartSidebar({
  language,
  isOpen,
  onClose,
  cart,
  onRemoveFromCart,
  onClearCart,
  onOrderPlaced,
}: CartSidebarProps) {
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "form" | "payment" | "success" | "error">("cart");
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingEmail, setShippingEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderError, setOrderError] = useState("");

  // Payment states
  const [payMethod, setPayMethod] = useState<"cash_on_delivery">("cash_on_delivery");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [d17Ref, setD17Ref] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const t = TRANSLATIONS[language];
  const isRtl = language === "ar";

  if (!isOpen) return null;

  const getFramePriceModifier = (frame: string) => {
    return 0;
  };

  const getCurrentArtworkPrice = (artworkId: string, fallbackPrice: number) => {
    return ARTWORKS.find((artwork) => artwork.id === artworkId)?.price ?? fallbackPrice;
  };

  const getFrameLabel = (frame: string) => {
    return isRtl ? "الإطار الفاخر باللون الذهبي البراق" : "Luxury Gold-Bordered Frame";
  };

  // Compute values
  const totalValue = cart.reduce((acc, item) => {
    const framePrice = getFramePriceModifier(item.selectedFrame);
    const currentPrice = getCurrentArtworkPrice(item.artwork.id, item.artwork.price);
    return acc + (currentPrice + framePrice) * item.quantity;
  }, 0);

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    let formatted = "";
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += " ";
      formatted += value[i];
    }
    setCardNumber(formatted.slice(0, 19)); // 16 digits + 3 spaces
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (value.length >= 2) {
      setCardExpiry(value.slice(0, 2) + "/" + value.slice(2, 4));
    } else {
      setCardExpiry(value);
    }
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, "");
    if (clean.startsWith("4")) return "Visa";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "Mastercard";
    if (clean.startsWith("9") || clean.startsWith("60")) return "e-Dinar";
    return "";
  };

  // Step transitions
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingName || !shippingPhone || !shippingAddress) return;
    setCheckoutStep("payment");
  };



  const startD17PaymentSim = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = d17Ref.trim();
    if (cleanRef.length !== 8 || !/^\d+$/.test(cleanRef)) return;

    setIsProcessing(true);
    setProcessingStatus(
      isRtl
        ? "جاري التحقق من إرسال الحوالة إلى الرقم 97 816 225 عبر خوادم البريد..."
        : "Verifying mobile transfer reference on La Poste Tunisienne servers..."
    );

    setTimeout(() => {
      handlePlaceOrder("d17_mobile", cleanRef);
    }, 2500);
  };

  // Submit actual order to API & Local storage
  const isOrderError = (result: Awaited<ReturnType<typeof createOrder>>): result is { ok: false; error?: string; message?: string } => {
    return result.ok === false;
  };

  const handlePlaceOrder = async (finalMethod: string, finalReference: string) => {
    setOrderError("");
    setIsProcessing(true);
    setProcessingStatus(isRtl ? "جاري تسجيل طلبك..." : "Registering your order...");

    let orderIdStr = "";

    if (!isApiEnabled()) {
      setIsProcessing(false);
      setOrderError("Order API is not enabled.");
      setCheckoutStep("error");
      return;
    }

    const result = await createOrder({
      customerName: shippingName,
      customerPhone: shippingPhone,
      customerEmail: shippingEmail,
      shippingAddress,
      paymentMethod: finalMethod,
      paymentReference: finalReference,
      cart,
    });

    if (isOrderError(result)) {
      setIsProcessing(false);
      const detail = result.message || result.error || "";
      setOrderError(`The order was not saved in the database. ${detail}`);
      setCheckoutStep("error");
      return;
    }

    const successResult = result;
    orderIdStr = successResult.orderNumber || `ORD-${successResult.orderId}`;


    const newOrder: Order = {
      id: orderIdStr,
      items: cart.map((item) => ({
        artworkId: item.artwork.id,
        titleAr: item.artwork.titleAr,
        titleEn: item.artwork.titleEn,
        image: item.artwork.image,
        quantity: item.quantity,
        frameType: item.selectedFrame,
        unitPrice: item.artwork.price,
      })),
      totalPrice: totalValue,
      customerName: shippingName,
      customerPhone: shippingPhone,
      customerEmail: shippingEmail,
      shippingAddress: shippingAddress,
      status: "pending",
      createdAt: new Date().toISOString(),
      paymentMethod: finalMethod,
      paymentReference: finalReference,
    };

    setPlacedOrder(newOrder);
    onOrderPlaced(newOrder);
    setIsProcessing(false);
    setCheckoutStep("success");
    // Removed auto-close timeout so the collector has to manually confirm on WhatsApp
  };

  // Formats the order summary into a clean WhatsApp text API link
  const buildWhatsAppUrl = (order: Order) => {
    const isAr = language === "ar";
    const methodLabel =
      order.paymentMethod === "carte_bancaire"
        ? (isAr ? "بطاقة بنكية" : "Bank Card")
        : order.paymentMethod === "carte_postale"
        ? (isAr ? "بطاقة بريدية (e-Dinar)" : "Postal Card (e-Dinar)")
        : order.paymentMethod === "d17_mobile"
        ? (isAr ? "تحويل D17" : "D17 Mobile Transfer")
        : order.paymentMethod === "check_on_delivery"
        ? (isAr ? "الدفع بالصك البنكي عند الاستلام" : "Check on Delivery")
        : order.paymentMethod === "gallery_pickup"
        ? (isAr ? "الاستلام والدفع في المعرض" : "Gallery Showroom Pickup & Payment")
        : (isAr ? "الدفع نقداً عند الاستلام" : "Cash on Delivery");

    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "";

    const text = isAr
      ? `مرحباً أستاذ محسن، لقد قمت بتقديم طلب اقتناء لوحة فنية من معرضكم الإلكتروني:
- رقم الطلب: ${order.id}
- الاسم الكامل: ${order.customerName}
- رقم الهاتف: ${order.customerPhone}
- عنوان التوصيل: ${order.shippingAddress}
- طريقة الدفع: ${methodLabel}
${order.paymentReference && !order.paymentReference.includes("PENDING") ? `- مرجع الدفع: ${order.paymentReference}\n` : ""}
يرجى مراجعة وتأكيد الطلب بإرسال كلمة "ok" رداً على هذه الرسالة أو النقر على الرابط التالي لتأكيد حجز اللوحة:
${siteOrigin}/?verifyOrder=${order.id}`
      : `Hello Mr. Mohsen, I have placed an order in your online calligraphy gallery:
- Order ID: ${order.id}
- Collector: ${order.customerName}
- Phone: ${order.customerPhone}
- Delivery Address: ${order.shippingAddress}
- Payment Method: ${methodLabel}
${order.paymentReference && !order.paymentReference.includes("PENDING") ? `- Payment Reference: ${order.paymentReference}\n` : ""}
Please verify and confirm my order by replying with "ok" or clicking the verification link:
${siteOrigin}/?verifyOrder=${order.id}`;

    return `https://wa.me/21697816225?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-obsidian/90 backdrop-blur-md" id="cart-sidebar-overlay">
      {/* Click outside to close */}
      <div className="flex-1" onClick={checkoutStep !== "success" ? onClose : undefined} />

      <div
        className="w-full max-w-md bg-[#070707] border-l border-white/5 h-full flex flex-col shadow-2xl relative p-6 sm:p-8 overflow-hidden"
        dir={isRtl ? "rtl" : "ltr"}
        id="cart-sidebar-panel"
      >
        {/* Loader Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-gold animate-spin" />
            <p className="font-serif text-sm text-[#efebe3] max-w-xs leading-relaxed animate-pulse">
              {processingStatus}
            </p>
          </div>
        )}

        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <h3 className="font-serif text-lg font-extrabold text-[#efebe3] flex items-center gap-2">
            <span>{t.cartTitle}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors"
            id="close-cart-sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress tracker */}
        {checkoutStep !== "success" && checkoutStep !== "error" && cart.length > 0 && (
          <div className="flex items-center justify-between text-[9px] font-sans uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-4 mb-6">
            <span className={checkoutStep === "cart" ? "text-gold font-bold" : "text-zinc-400"}>
              1. {isRtl ? "حقيبة الفن" : "Art Cart"}
            </span>
            <span className="text-zinc-700">➔</span>
            <span className={checkoutStep === "form" ? "text-gold font-bold" : "text-zinc-400"}>
              2. {isRtl ? "بيانات التوصيل" : "Address"}
            </span>
            <span className="text-zinc-700">➔</span>
            <span className={checkoutStep === "payment" ? "text-gold font-bold" : "text-zinc-400"}>
              3. {isRtl ? "الدفع والتحقق" : "Secure Pay"}
            </span>
          </div>
        )}

        {/* Content routing */}
        {checkoutStep === "cart" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <span className="p-4 rounded-full bg-white/[0.01] border border-white/5 text-zinc-500">
                  <X className="w-6 h-6" />
                </span>
                <p className="font-sans text-xs text-zinc-400 max-w-xs leading-relaxed">
                  {t.cartEmpty}
                </p>
              </div>
            ) : (
              <>
                {/* List of items */}
                <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
                  {cart.map((item, idx) => {
                    const singlePrice =
                      getCurrentArtworkPrice(item.artwork.id, item.artwork.price) +
                      getFramePriceModifier(item.selectedFrame);
                    const isArtworkRtl = isRtl;

                    return (
                      <div
                        key={`${item.artwork.id}-${item.selectedFrame}-${idx}`}
                        className="flex items-start gap-4 p-4 rounded-md bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors relative"
                        id={`cart-item-${item.artwork.id}`}
                      >
                        {/* Artwork square thumb */}
                        <div className="w-14 h-14 bg-black rounded-sm overflow-hidden p-[2px] border border-white/10 shrink-0">
                          <img
                            src={item.artwork.image}
                            alt={item.artwork.titleAr}
                            className="w-full h-full object-cover rounded-xs"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Mid Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="font-serif text-[#efebe3] text-sm font-bold truncate">
                            {isArtworkRtl ? item.artwork.titleAr : item.artwork.titleEn}
                          </h4>
                          <span className="text-[10px] text-gold/80 block uppercase tracking-wide">
                            {t.cartFrameSelect} {getFrameLabel(item.selectedFrame)}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-sans">
                            {item.quantity} x <PriceTag price={singlePrice} currency={t.currency} layout="inline" />
                          </span>
                        </div>

                        {/* Remove CTA */}
                        <button
                          onClick={() => onRemoveFromCart(item.artwork.id, item.selectedFrame)}
                          className="p-1.5 text-zinc-650 hover:text-red-400 transition-colors self-start"
                          title="Remove from Cart"
                          id={`remove-cart-${item.artwork.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal + Next step buttons */}
                <div className="border-t border-white/5 pt-6 mt-4 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-sans text-xs text-zinc-400 uppercase tracking-widest">
                      {t.cartTotal}
                    </span>
                    <PriceTag price={totalValue} currency={t.currency} />
                  </div>

                  <button
                    onClick={() => setCheckoutStep("form")}
                    className="w-full py-4 bg-gold hover:bg-gold-hover text-obsidian text-xs font-serif font-extrabold uppercase tracking-widest rounded-[2px]"
                    id="cart-proceed-checkout"
                  >
                    {t.cartCheckoutBtn}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {checkoutStep === "form" && (
          <form onSubmit={handleProceedToPayment} className="flex-1 flex flex-col h-full justify-between">
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <span className="text-[11px] font-sans text-zinc-400 uppercase tracking-wider block border-b border-white/5 pb-2 mb-4">
                {isRtl ? "مراجعة نموذج التوصيل والاستلام الشخصي" : "Provide Shipping Credentials"}
              </span>

              {/* Name */}
              <div className="space-y-1">
                <label className="font-serif text-[10px] font-black uppercase tracking-wider text-gold block">
                  {isRtl ? "الاسم الكامل للمقتني:" : "Collector's Noble Full Name:"}
                </label>
                <input
                  type="text"
                  required
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  placeholder={isRtl ? "الاسم بالكامل..." : "E.g., Dr. Salim..."}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors"
                  id="checkout-name-field"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="font-serif text-[10px] font-black uppercase tracking-wider text-gold block">
                  {isRtl ? "رقم الهاتف الشخصي المباشر للتنسيق:" : "Direct Shipping Mobile/Phone:"}
                </label>
                <input
                  type="tel"
                  required
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                  placeholder="E.g., +216 90 000 000"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors font-mono"
                  id="checkout-phone-field"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="font-serif text-[10px] font-black uppercase tracking-wider text-gold block">
                  {isRtl ? "البريد الإلكتروني للتوثيق:" : "Noble Email Address:"}
                </label>
                <input
                  type="email"
                  value={shippingEmail}
                  onChange={(e) => setShippingEmail(e.target.value)}
                  placeholder="service@mail.com"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors font-sans"
                  id="checkout-email-field"
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="font-serif text-[10px] font-black uppercase tracking-wider text-gold block">
                  {isRtl ? "عنوان التسليم والتركيب الفني بالتفصيل:" : "Luxury Installation & Shipping Destination:"}
                </label>
                <textarea
                  required
                  rows={3}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder={isRtl ? "المدينة، الشارع، المعرض المقصود لتزيينه بالذهب..." : "Detail apartment, villa, palace or corporate lounge address..."}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-sm text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors"
                  id="checkout-address-field"
                />
              </div>
            </div>

            {/* Price summary & Confirmation trigger */}
            <div className="border-t border-white/5 pt-6 mt-4 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setCheckoutStep("cart")}
                  className="text-zinc-500 hover:text-white transition-colors uppercase font-bold tracking-widest text-[10px]"
                >
                  {isRtl ? "العودة للحقيبة" : "Return to Cart"}
                </button>
                <div className="text-right">
                  <span className="font-sans text-[9px] text-zinc-500 uppercase tracking-widest block">
                    {isRtl ? "القيمة الكلية للاقتناء:" : "Total Premium Allocation"}
                  </span>
                  <PriceTag price={totalValue} currency={t.currency} />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gold hover:bg-gold-hover text-obsidian text-xs font-serif font-extrabold uppercase tracking-widest rounded-[2px]"
                id="checkout-confirm-booking"
              >
                {isRtl ? "متابعة للدفع" : "Proceed to Payment"}
              </button>
            </div>
          </form>
        )}

        {checkoutStep === "payment" && (
          <div className="flex-1 flex flex-col h-full justify-between">
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              <span className="text-[11px] font-sans text-zinc-400 uppercase tracking-wider block border-b border-white/5 pb-2 mb-4">
                {isRtl ? "اختيار طريقة الدفع" : "Select Payment Method"}
              </span>

              <div className="space-y-3">


                <label className="flex items-center gap-3 p-3 border border-white/10 rounded cursor-pointer hover:bg-white/5 transition-colors">
                  <input
                    type="radio"
                    name="payment_method"
                    value="cash_on_delivery"
                    checked={payMethod === "cash_on_delivery" as any}
                    onChange={() => setPayMethod("cash_on_delivery" as any)}
                    className="w-4 h-4 text-gold bg-black border-white/20 focus:ring-gold focus:ring-2"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-serif text-[#efebe3] font-bold">
                      {isRtl ? "الدفع نقداً عند الاستلام" : "Cash on Delivery"}
                    </span>
                    <span className="text-xs text-zinc-500 font-sans">
                      {isRtl ? "الدفع عند استلام اللوحة" : "Pay when you receive the artwork"}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 mt-4 space-y-4">
              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setCheckoutStep("form")}
                  className="text-zinc-500 hover:text-white transition-colors uppercase font-bold tracking-widest text-[10px]"
                >
                  {isRtl ? "العودة للبيانات" : "Return to Details"}
                </button>
                <div className="text-right">
                  <span className="font-sans text-[9px] text-zinc-500 uppercase tracking-widest block">
                    {isRtl ? "القيمة الكلية:" : "Total Price:"}
                  </span>
                  <PriceTag price={totalValue} currency={t.currency} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handlePlaceOrder("cash_on_delivery", "COD-PENDING");
                }}
                className="w-full py-4 bg-gold hover:bg-gold-hover text-obsidian text-xs font-serif font-extrabold uppercase tracking-widest rounded-[2px]"
              >
                {isRtl ? "إتمام الدفع" : "Complete Payment"}
              </button>
            </div>
          </div>
        )}

        {checkoutStep === "success" && placedOrder && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 overflow-y-auto py-4">
            <span className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-bounce">
              <CheckCircle className="w-12 h-12" />
            </span>

            <div className="space-y-2 max-w-sm">
              <h4 className="font-serif text-xl font-black text-[#efebe3]">
                {isRtl ? "تم تسجيل طلبك بنجاح!" : "Order Placed Successfully!"}
              </h4>
              <p className="font-sans text-xs text-zinc-400 leading-relaxed px-2">
                {isRtl
                  ? `لقد تم تسجيل طلبك بنجاح وهو قيد الانتظار للتحقق والموافقة من قبل الإدارة. سيتم الاتصال بكم هاتفياً فور تأكيده. يمكنكم متابعة حالة الطلب في أي وقت بالضغط على أيقونة "طلباتي" في الأعلى.`
                  : `Your order has been registered successfully and is pending verification and approval by the administration. You will be contacted by phone once confirmed. You can track your order status at any time under "My Orders" at the top.`}
              </p>
            </div>

            <div className="w-48 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />

            <div className="w-full p-4 rounded bg-white/[0.02] border border-white/5 text-left text-xs space-y-2 max-w-sm" dir={isRtl ? "rtl" : "ltr"}>
              <div className="flex justify-between">
                <span className="text-zinc-500">{isRtl ? "رقم الطلب:" : "Order ID:"}</span>
                <span className="font-mono text-gold font-bold">{placedOrder.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{isRtl ? "المقتني:" : "Collector:"}</span>
                <span className="text-[#efebe3]">{placedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{isRtl ? "المبلغ الكلي:" : "Total Price:"}</span>
                <span className="text-[#efebe3] font-bold">{placedOrder.totalPrice} {t.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{isRtl ? "طريقة الدفع:" : "Payment Method:"}</span>
                <span className="text-gold">{isRtl ? "الدفع عند الاستلام" : "Cash on Delivery"}</span>
              </div>
            </div>

            {/* WhatsApp CTA — send order to Master Mohsen */}
            <a
              href={buildWhatsAppUrl(placedOrder)}
              target="_blank"
              rel="noopener noreferrer"
              id="whatsapp-send-order-btn"
              className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-[3px] font-serif font-extrabold text-[13px] uppercase tracking-widest transition-all duration-300 shadow-lg hover:shadow-gold/30 hover:scale-[1.02] active:scale-95"
              style={{
                background: "linear-gradient(135deg, #c9a84c 0%, #f0d080 50%, #c9a84c 100%)",
                color: "#0a0a0a",
                border: "1px solid #e8c85a",
                boxShadow: "0 0 18px rgba(201,168,76,0.3)",
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {isRtl ? "إرسال تفاصيل الطلب إلى الأستاذ محسن عبر واتساب" : "Send Order Details to Master Mohsen via WhatsApp"}
            </a>

            <button
              onClick={() => {
                onClearCart();
                setCheckoutStep("cart");
                setPlacedOrder(null);
                onClose();
                // Reset form fields
                setShippingName("");
                setShippingPhone("");
                setShippingEmail("");
                setShippingAddress("");
                setCardHolder("");
                setCardNumber("");
                setCardExpiry("");
                setCardCvv("");
                setD17Ref("");
                setOtpCode("");
                setShowOtp(false);
                setOrderError("");
              }}
              className="text-zinc-500 hover:text-white text-[11px] uppercase font-bold tracking-widest transition-colors pt-2"
            >
              {isRtl ? "العودة للمتجر" : "Back to Gallery"}
            </button>
          </div>
        )}

        {checkoutStep === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <span className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
              <X className="w-12 h-12" />
            </span>

            <div className="space-y-2 max-w-sm">
              <h4 className="font-serif text-2xl font-black text-red-300">
                {isRtl ? "فشلت المعاملة" : "Payment Failed"}
              </h4>
              <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                {orderError}
              </p>
            </div>

            <button
              onClick={() => {
                setCheckoutStep("payment");
                setOrderError("");
              }}
              className="px-6 py-2 bg-gold hover:bg-gold-hover text-obsidian text-xs font-bold uppercase tracking-wider rounded-[2px]"
            >
              {isRtl ? "حاول مرة أخرى" : "Try Again"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
