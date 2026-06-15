import React, { useState, useEffect } from "react";
import { X, ShieldAlert, CheckCircle, Clock, Trash2, User, Phone, MapPin, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { Language, Order } from "../types";
import { TRANSLATIONS } from "../data";
import PriceTag from "./PriceTag";
import { getAllOrders, updateOrderStatus, isApiEnabled } from "../utils/api";

interface AdminDashboardModalProps {
  language: Language;
  isOpen: boolean;
  onClose: () => void;
  onRefreshOrders?: () => void; // Optional callback to refresh orders on client side
}

export default function AdminDashboardModal({
  language,
  isOpen,
  onClose,
  onRefreshOrders,
}: AdminDashboardModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  const t = TRANSLATIONS[language];
  const isRtl = language === "ar";

  const loadOrders = async () => {
    setLoading(true);
    setErrorMsg("");
    if (isApiEnabled()) {
      try {
        const res = await getAllOrders();
        if (res.ok && res.orders) {
          // Map backend orders to frontend Order type
          const mapped: Order[] = res.orders.map((ord: any) => ({
            id: `ORD-${ord.id}`,
            customerName: ord.customer_name,
            customerPhone: ord.customer_phone,
            customerEmail: ord.customer_email || "",
            shippingAddress: ord.shipping_address,
            totalPrice: parseFloat(ord.total_amount),
            status: ord.status,
            createdAt: ord.created_at,
            paymentMethod: ord.payment_method || "cash_on_delivery",
            paymentReference: ord.payment_reference || "",
            items: (ord.items || []).map((it: any) => ({
              artworkId: it.product_id,
              titleAr: it.product_title_ar || it.product_id,
              titleEn: it.product_title_en || it.product_id,
              image: it.image || "",
              quantity: parseInt(it.quantity),
              frameType: it.frame_type || "museum_gold",
              unitPrice: parseFloat(it.unit_price),
            })),
          }));
          setOrders(mapped);
        } else {
          setErrorMsg(isRtl ? "فشل تحميل الطلبات من الخادم." : "Failed to load orders from server.");
        }
      } catch (err) {
        setErrorMsg(String(err));
      } finally {
        setLoading(false);
      }
    } else {
      // Local fallback mode
      try {
        const raw = localStorage.getItem("mohsen_calligraphy_all_orders");
        const parsed = raw ? JSON.parse(raw) : [];
        setOrders(parsed);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen]);

  const handleVerify = async (orderId: string) => {
    setActioningId(orderId);
    if (isApiEnabled()) {
      try {
        const numericId = orderId.replace(/^ORD-/, "");
        const res = await updateOrderStatus(numericId, "confirmed");
        if (res.ok) {
          // Success
          await loadOrders();
          if (onRefreshOrders) onRefreshOrders();
        } else {
          alert(isRtl ? "فشل تحديث الطلب" : "Failed to update order status");
        }
      } catch (err) {
        alert(String(err));
      } finally {
        setActioningId(null);
      }
    } else {
      // Local mode confirmation
      try {
        // 1. Update in mohsen_calligraphy_all_orders
        const rawAll = localStorage.getItem("mohsen_calligraphy_all_orders");
        if (rawAll) {
          const parsedAll = JSON.parse(rawAll) as Order[];
          const updatedAll = parsedAll.map((o) =>
            o.id === orderId ? { ...o, status: "confirmed" as const } : o
          );
          localStorage.setItem("mohsen_calligraphy_all_orders", JSON.stringify(updatedAll));
          setOrders(updatedAll);
        }


        if (onRefreshOrders) onRefreshOrders();
      } catch (err) {
        console.error(err);
      } finally {
        setActioningId(null);
      }
    }
  };

  const handleClearLocalDB = () => {
    if (window.confirm(isRtl ? "هل أنت متأكد من مسح جميع الطلبات المحلية؟" : "Are you sure you want to clear all local orders?")) {
      localStorage.removeItem("mohsen_calligraphy_all_orders");
      setOrders([]);
      if (onRefreshOrders) onRefreshOrders();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/90 backdrop-blur-md overflow-y-auto">
      <div
        className="relative w-full max-w-5xl rounded-xl border border-gold/30 bg-[#070707] shadow-2xl p-6 sm:p-8 my-8 flex flex-col max-h-[90vh]"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-white transition-colors"
          id="close-admin-modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{isRtl ? "لوحة الإدارة الفنية" : "Curator Administration Panel"}</span>
            </span>
            <h2 className="font-serif text-2xl font-black text-[#efebe3]">
              {isRtl ? "إدارة وتأكيد طلبات الاقتناء" : "Manage and Confirm Acquisitions"}
            </h2>
            <p className="font-sans text-xs text-zinc-450 max-w-xl leading-relaxed">
              {isRtl
                ? "قائمة بجميع الطلبات الواردة للموقع من قاعدة البيانات. يمكنك مراجعة البيانات وتأكيد الحجز ليظهر للعميل فوراً."
                : "Comprehensive database record of incoming client acquisitions. Review shipping credentials and verify orders to confirm booking."}
            </p>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              onClick={loadOrders}
              className="p-2.5 rounded-md border border-white/10 text-zinc-450 hover:text-gold hover:border-gold/20 transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              title="Refresh Orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-gold" : ""}`} />
              <span>{isRtl ? "تحديث" : "Refresh"}</span>
            </button>
            {!isApiEnabled() && orders.length > 0 && (
              <button
                onClick={handleClearLocalDB}
                className="p-2.5 rounded-md border border-red-500/10 text-red-400 hover:bg-red-500/5 transition-all flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isRtl ? "حذف الجميع" : "Clear All"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Error Messaging */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Table Body Area */}
        <div className="flex-1 overflow-auto pr-1 custom-scrollbar">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-gold animate-spin" />
              <p className="text-xs text-zinc-450 animate-pulse">
                {isRtl ? "جاري تحميل الطلبات..." : "Fetching order entries..."}
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-20 rounded bg-white/[0.01] border border-white/5 text-center text-zinc-500 space-y-2">
              <Clock className="w-10 h-10 mx-auto opacity-40 text-gold" />
              <p className="font-serif font-bold text-white text-sm">
                {isRtl ? "لا توجد أي طلبات مسجلة" : "No orders found"}
              </p>
              <p className="text-xs">
                {isRtl ? "لم يتم إرسال أي طلبات بعد في هذا النظام." : "No client acquisitions have been logged yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Responsive custom order card row (fits dark gold museum theme) */}
              {orders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-lg bg-black/40 border border-white/5 hover:border-gold/20 transition-all space-y-4"
                  id={`admin-order-row-${ord.id}`}
                >
                  {/* Row Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-gold font-bold text-xs uppercase tracking-wider">{ord.id}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(ord.createdAt).toLocaleString(isRtl ? "ar-TN" : "en-US")}
                      </span>
                      {isApiEnabled() ? (
                        <span className="px-2 py-0.5 rounded-[2px] bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[9px] font-sans font-medium uppercase tracking-wider">
                          {isRtl ? "قاعدة البيانات" : "Database MySQL"}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[2px] bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-sans font-medium uppercase tracking-wider">
                          {isRtl ? "محلي" : "Local Sandbox"}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] uppercase font-bold tracking-wide ${
                          ord.status === "confirmed"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-gold/15 border-gold/30 text-gold"
                        }`}
                      >
                        {ord.status === "confirmed" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {ord.status === "confirmed"
                          ? (isRtl ? "مؤكد" : "Confirmed")
                          : (isRtl ? "معلق بالانتظار" : "Pending Curator Approval")}
                      </span>

                      {ord.status !== "confirmed" && (
                        <button
                          onClick={() => handleVerify(ord.id)}
                          disabled={actioningId === ord.id}
                          className="px-3.5 py-1.5 bg-emerald-555 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-[2px] text-xs font-serif font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                        >
                          {actioningId === ord.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{isRtl ? "تأكيد الطلب" : "Approve Order"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Customer & Totals Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Column 1: Client Metadata */}
                    <div className="space-y-2 p-3 bg-white/[0.01] border border-white/5 rounded">
                      <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gold/80" />
                        <span>{isRtl ? "بيانات العميل:" : "Client Identity:"}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-serif font-bold text-[#efebe3] text-sm">{ord.customerName}</div>
                        {ord.customerEmail && (
                          <div className="text-zinc-400 font-mono text-[11px] truncate">{ord.customerEmail}</div>
                        )}
                        <div className="text-zinc-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{ord.customerPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Column 2: Shipping address */}
                    <div className="space-y-2 p-3 bg-white/[0.01] border border-white/5 rounded">
                      <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gold/80" />
                        <span>{isRtl ? "عنوان التسليم:" : "Shipping Destination:"}</span>
                      </div>
                      <div className="text-zinc-350 leading-relaxed text-[11px]">{ord.shippingAddress}</div>
                    </div>

                    {/* Column 3: Payment details */}
                    <div className="space-y-2 p-3 bg-white/[0.01] border border-white/5 rounded">
                      <div className="text-[10px] text-zinc-500 font-sans uppercase tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-gold/80" />
                        <span>{isRtl ? "الدفع والمالية:" : "Finance & Allocation:"}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="font-sans font-semibold text-[#efebe3]">
                          {isRtl ? "المجموع الكلي:" : "Total Price:"}{" "}
                          <span className="text-gold font-serif text-sm font-extrabold">{ord.totalPrice} د.ت</span>
                        </div>
                        <div className="text-zinc-450 text-[11px]">
                          {isRtl ? "طريقة الدفع:" : "Method:"}{" "}
                          <span className="text-zinc-300 font-semibold">
                            {ord.paymentMethod === "cash_on_delivery"
                              ? (isRtl ? "الدفع نقداً عند التسليم" : "Cash on Delivery")
                              : ord.paymentMethod}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-sans">
                      {isRtl ? "الأعمال الفنية المحجوزة:" : "Acquired Calligraphy Works:"}
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(ord.items || []).map((it, index) => {
                        const title = isRtl ? it.titleAr : it.titleEn;
                        return (
                          <div
                            key={`${it.artworkId}-${index}`}
                            className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-white/5 rounded-[2px]"
                          >
                            {it.image && (
                              <div className="w-10 h-10 bg-black rounded p-[2px] border border-white/10 shrink-0">
                                <img
                                  src={it.image}
                                  alt={title}
                                  className="w-full h-full object-cover rounded-xs"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-serif font-bold text-white text-xs truncate" title={title}>
                                {title}
                              </h4>
                              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                                {isRtl ? "كمية:" : "Qty:"} {it.quantity} <span className="text-zinc-650 mx-1.5">•</span>{" "}
                                {it.unitPrice} د.ت
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
