import React, { useMemo } from "react";
import { X, Package, Clock, Truck, CheckCircle, RefreshCcw } from "lucide-react";
import { Language, Order, OrderItem } from "../types";
import { TRANSLATIONS } from "../data";

interface OrdersModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onClearAll: () => void;
}

function statusToStepIndex(status: Order["status"]): number {
  switch (status) {
    case "pending":
      return 0;
    case "confirmed":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}

function StatusBadge({ status, language }: { status: Order["status"]; language: Language }) {
  const t = TRANSLATIONS[language];
  const isRtl = language === "ar";

  const conf = useMemo(() => {
    switch (status) {
      case "pending":
        return {
          label: t.ordersStatusPending,
          cls: "bg-gold/10 border-gold/20 text-gold",
          icon: <RefreshCcw className="w-4 h-4" />,
        };
      case "confirmed":
        return {
          label: t.ordersStatusConfirmed,
          cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
          icon: <Clock className="w-4 h-4" />,
        };
      case "shipped":
        return {
          label: t.ordersStatusShipped,
          cls: "bg-sky-500/10 border-sky-500/20 text-sky-300",
          icon: <Truck className="w-4 h-4" />,
        };
      case "delivered":
        return {
          label: t.ordersStatusDelivered,
          cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300",
          icon: <CheckCircle className="w-4 h-4" />,
        };
      default:
        return {
          label: t.ordersStatusPending,
          cls: "bg-gold/10 border-gold/20 text-gold",
          icon: <Package className="w-4 h-4" />,
        };
    }
  }, [status, t]);

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-semibold ${conf.cls}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {conf.icon}
      {conf.label}
    </span>
  );
}

function OrderItemRow({ language, item }: { language: Language; item: OrderItem; key?: React.Key }) {
  const isRtl = language === "ar";
  const title = isRtl ? item.titleAr : item.titleEn;

  // frameType is optional in backend draft, but our types require selectedFrame; in local mode it may be absent.
  const frame = (item.frameType ?? "museum_gold") as string;

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-md bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
    >
      <div className="w-14 h-14 bg-black rounded-sm overflow-hidden p-[2px] border border-white/10 shrink-0">
        <img
          src={item.image}
          alt={title}
          className="w-full h-full object-cover rounded-xs"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-serif text-[#efebe3] text-sm font-bold truncate" title={title}>
            {title}
          </h4>
          <span className="text-[10px] text-zinc-500 font-mono shrink-0">{item.artworkId}</span>
        </div>

        <div className="mt-1 space-y-1">
          <div className="text-[10px] text-gold/80 uppercase tracking-wide">
            {isRtl ? "الكمية" : "Qty"}: {item.quantity}
            <span className="mx-2">•</span>
            {isRtl ? "الإطار" : "Frame"}: {frame}
          </div>

          <div className="text-[10px] text-zinc-500 font-sans">
            {isRtl ? "السعر" : "Price"}: {item.unitPrice}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersModal({ language, isOpen, onClose, orders, onClearAll }: OrdersModalProps) {
  const t = TRANSLATIONS[language];
  const isRtl = language === "ar";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl glass-panel-gold rounded-xl border border-gold/20 flex flex-col max-h-[90vh]" dir={isRtl ? "rtl" : "ltr"}>
        <button
          onClick={onClose}
          className="absolute top-3 left-3 p-2 text-zinc-200 hover:text-white transition-colors z-10"
          aria-label="Close orders modal"
          id="close-orders-modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
                <Package className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold tracking-wider text-gold">📋 {t.ordersTitle}</span>
              </div>
              <h3 className="mt-3 font-serif text-2xl font-extrabold text-white">{t.ordersBtnTitle}</h3>
              <p className="mt-2 text-xs text-zinc-300 leading-relaxed max-w-xl">
                {isRtl
                  ? "راجعوا حالة الطلبات وتفاصيل الأعمال المقتناة، مع تاريخ الحجز ومعلومات التوصيل."
                  : "Review your order status and acquired artworks details, including booking date and shipping information."}
              </p>
            </div>

            {orders.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-3 py-2 text-[11px] rounded-md border border-white/10 text-zinc-200 hover:text-white hover:border-white/20 transition-colors"
                id="orders-clear-all-btn"
              >
                {t.ordersClearAll}
              </button>
            )}
          </div>

          <div className="mt-6 space-y-4">
            {orders.length === 0 ? (
              <div className="p-6 rounded-md bg-white/[0.02] border border-white/5 text-center">
                <p className="font-serif font-bold text-white">{t.ordersEmpty}</p>
              </div>
            ) : (
              orders
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((ord) => {
                  const stepIndex = statusToStepIndex(ord.status);

                  const stepLabels = [
                    t.ordersStepReceived,
                    t.ordersStepConfirmed,
                    t.ordersStepShipped,
                    t.ordersStepDelivered,
                  ];

                  const steps = [
                    { key: "pending", icon: <Clock className="w-4 h-4" /> },
                    { key: "confirmed", icon: <CheckCircle className="w-4 h-4" /> },
                    { key: "shipped", icon: <Truck className="w-4 h-4" /> },
                    { key: "delivered", icon: <CheckCircle className="w-4 h-4" /> },
                  ];

                  return (
                    <div key={ord.id} className="p-4 sm:p-5 rounded-lg bg-black/20 border border-white/5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <StatusBadge status={ord.status} language={language} />
                            <span className="text-[11px] text-zinc-300 font-mono">
                              {t.ordersOrderId}: {ord.id}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
                              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                {t.ordersDate}
                              </div>
                              <div className="text-xs text-white font-mono mt-1">
                                {new Date(ord.createdAt).toLocaleString(language === "ar" ? "ar-TN" : "en-US")}
                              </div>
                            </div>
                            <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
                              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                {t.ordersShipping}
                              </div>
                              <div className="text-xs text-white mt-1">
                                <div className="font-semibold">{ord.customerName}</div>
                                <div className="text-[11px] text-zinc-200 font-mono">{ord.customerPhone}</div>
                                <div className="text-[11px] text-zinc-200">{ord.shippingAddress}</div>
                              </div>
                            </div>
                            <div className="p-3 rounded-md bg-white/[0.02] border border-white/5">
                              <div className="text-[10px] text-zinc-400 uppercase tracking-wider">
                                {t.ordersTotal}
                              </div>
                              <div className="text-xs text-white mt-1">
                                {ord.totalPrice}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Progress stepper */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-2">
                          {steps.map((s, idx) => {
                            const active = idx <= stepIndex;
                            return (
                              <div key={s.key} className="flex-1 flex items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-bold ${
                                    active ? "bg-gold/20 border-gold/40 text-gold" : "bg-white/[0.02] border-white/10 text-zinc-500"
                                  }`}
                                >
                                  {s.icon}
                                </div>
                                <div className="hidden sm:block">
                                  <div
                                    className={`text-[10px] font-semibold ${
                                      active ? "text-gold" : "text-zinc-500"
                                    }`}
                                  >
                                    {stepLabels[idx]}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mt-4 space-y-3">
                        <div className="text-xs text-zinc-200 font-bold">
                          {t.ordersItems}
                        </div>
                        <div className="space-y-3">
                          {ord.items.map((it, idx) => (
                            <OrderItemRow key={`${it.artworkId}-${idx}`} language={language} item={it} />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

