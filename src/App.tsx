import { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Philosophy from "./components/Philosophy";
import TheCraft from "./components/TheCraft";
import Gallery from "./components/Gallery";
import CartSidebar from "./components/CartSidebar";
import Footer from "./components/Footer";
import OrdersModal from "./components/OrdersModal";
import AdminDashboardModal from "./components/AdminDashboardModal";
import LoadingScreen from "./components/LoadingScreen";
import BackToTop from "./components/BackToTop";
import WhatsAppFloat from "./components/WhatsAppFloat";
import { AuthSession, Language, CartItem, Artwork, Order } from "./types";
import { ARTWORKS } from "./data";
import { getSession } from "./utils/auth";
import { updateOrderStatus, getMyOrders } from "./utils/api";

export default function App() {
  // Ensure guest token exists
  if (typeof window !== "undefined" && !localStorage.getItem("gallery_guest_token")) {
    const newToken = typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "g-" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("gallery_guest_token", newToken);
  }
  if (typeof window !== "undefined") {
    localStorage.removeItem("gallery_guest_orders");
  }

  // Primary states
  const [language, setLanguage] = useState<Language>("ar");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [user, setUser] = useState<AuthSession | null>(null);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);

  // Auto-verify flow state
  const [pendingVerifyOrderId, setPendingVerifyOrderId] = useState<string | null>(null);
  const [verifyToast, setVerifyToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  const showVerifyToast = (message: string, type: "success" | "info" | "error" = "success") => {
    setVerifyToast({ message, type });
    setTimeout(() => setVerifyToast(null), 5000);
  };

  // Execute order verification via API and update local state
  const executeVerification = useCallback(async (orderId: string) => {
    const numericId = orderId.replace(/^ORD-/, "");
    try {
      const result = await updateOrderStatus(numericId, "confirmed");
      if (result.ok) {
        handleVerifyOrderLocal(orderId);
        showVerifyToast(
          `✅ Order ${orderId} has been confirmed and verified successfully!`,
          "success"
        );
      } else {
        showVerifyToast(`⚠️ Could not verify order ${orderId}. Please check the admin dashboard.`, "error");
      }
    } catch {
      showVerifyToast(`⚠️ Network error while verifying order ${orderId}.`, "error");
    }
    // Clean up the URL
    const url = new URL(window.location.href);
    url.searchParams.delete("verifyOrder");
    window.history.replaceState({}, "", url.toString());
    setPendingVerifyOrderId(null);
  }, []);

  const handleRefreshOrders = useCallback(() => {
    if (user && !user.isAdmin) {
      getMyOrders().then((res) => {
        if (res.ok && res.orders) {
          setOrders(res.orders);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && !user.isAdmin) {
      getMyOrders().then((res) => {
        if (res.ok && res.orders) {
          setOrders(res.orders);
        }
      });
    } else if (!user) {
      getMyOrders().then((res) => {
        if (res.ok && res.orders) {
          setOrders(res.orders);
        } else {
          setOrders([]);
        }
      });
    }
  }, [user]);

  const ordersActiveCount = orders.filter((o) => o.status !== "delivered").length;

  useEffect(() => {
    getSession().then((session) => {
      setUser(session);
      
      // Check ?verifyOrder= param on initial load
      const params = new URLSearchParams(window.location.search);
      const verifyOrderParam = params.get("verifyOrder");
      if (!verifyOrderParam) return;

      if (session && session.isAdmin) {
        // Admin already logged in — auto-verify immediately
        executeVerification(verifyOrderParam);
      } else {
        // Not logged in or not admin — store param and prompt login
        setPendingVerifyOrderId(verifyOrderParam);
        showVerifyToast(
          `🔐 Please sign in as admin to approve order ${verifyOrderParam}.`,
          "info"
        );
      }
    });
  }, []);

  // Poll backend for pending orders status to sync automatically
  useEffect(() => {
    const pendingOrders = orders.filter((o) => o.status === "pending");
    if (pendingOrders.length === 0) return;

    const interval = setInterval(async () => {
      let updatedAny = false;
      const nextOrders = await Promise.all(
        orders.map(async (ord) => {
          if (ord.status !== "pending") return ord;
          const matches = ord.id.match(/^ORD-(\d+)$/);
          if (!matches) return ord; // Only poll orders created in the database

          try {
            const { getOrderDetails } = await import("./utils/api");
            const res = await getOrderDetails(matches[1]);
            if (res.ok && res.order && res.order.status === "confirmed") {
              updatedAny = true;
              return {
                ...ord,
                status: "confirmed" as const,
                paymentStatus: res.order.payment_status || "verified",
              };
            }
          } catch (err) {
            console.error("Error polling order status:", err);
          }
          return ord;
        })
      );

      if (updatedAny) {
        setOrders(nextOrders);
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [orders, user]);

  const handleVerifyOrderLocal = (orderId: string) => {
    setOrders((prev) => {
      const next = prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: "confirmed" as const,
              paymentStatus:
                ord.paymentMethod === "carte_bancaire" || ord.paymentMethod === "carte_postale"
                  ? "paid"
                  : "verified",
            }
          : ord
      );
      return next;
    });
  };

  // Track scroll position to update active nav section elegantly
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "philosophy", "craft", "gallery"];
      const scrollPosition = window.scrollY + 150;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync document title and direction with language selection
  useEffect(() => {
    const isRtl = language === "ar";
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.title = isRtl
      ? "محسن نصائيبة — معرض الخط الكوفي التربيعى المعاصر"
      : "Mohsen Nsaibia — Contemporary Square Kufic Gallery";
  }, [language]);

  // Cart Management
  const handleAddToCart = (artwork: Artwork, selectedFrame: "classic_wood" | "museum_gold" | "obsidian_minimal") => {
    const currentArtwork = ARTWORKS.find((item) => item.id === artwork.id) ?? artwork;

    setCart((prevCart) => {
      // Check if entry with same artwork and same frame option already exists
      const existingIdx = prevCart.findIndex(
        (item) => item.artwork.id === currentArtwork.id && item.selectedFrame === selectedFrame
      );

      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += 1;
        updated[existingIdx].artwork = currentArtwork;
        return updated;
      } else {
        return [...prevCart, { artwork: currentArtwork, quantity: 1, selectedFrame }];
      }
    });
  };

  const handleRemoveFromCart = (artworkId: string, selectedFrame: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.artwork.id === artworkId && item.selectedFrame === selectedFrame))
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleNavigate = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col text-[#efebe3]">
      {/* Loading Screen */}
      {loading && (
        <LoadingScreen
          language={language}
          onFinished={() => setLoading(false)}
        />
      )}

      {/* Sticky Premium Navigation Header */}
      <Navbar
        language={language}
        setLanguage={setLanguage}
        cart={cart}
        setCartOpen={setCartOpen}
        onNavigate={handleNavigate}
        activeSection={activeSection}
        user={user}
        onAuthChange={(newUser) => {
          setUser(newUser);
          // If admin just logged in with a pending verification, auto-execute it
          if (newUser && newUser.isAdmin && pendingVerifyOrderId) {
            executeVerification(pendingVerifyOrderId);
          }
        }}
        onOrdersOpen={() => setOrdersModalOpen(true)}
        ordersActiveCount={ordersActiveCount}
        onAdminDashboardOpen={() => setAdminDashboardOpen(true)}
        pendingVerifyOrderId={pendingVerifyOrderId}
      />

      <main className="flex-1">
        {/* Dynamic Interactive Entrance Hero */}
        <Hero
          language={language}
          onExploreClick={() => handleNavigate("gallery")}
          onBioClick={() => handleNavigate("craft")}
        />

        {/* Artistic Mission statement & Metrics */}
        <Philosophy language={language} />

        {/* Traditional Tools & Physical hot-spots analysis */}
        <TheCraft language={language} />

        {/* Curated original gallery cards & Checkout booking trigger */}
        <Gallery
          language={language}
          onAddToCart={handleAddToCart}
        />
      </main>

      {/* Floating sliding Shopping Cart details */}
      {/* Floating sliding Shopping Cart details */}
      <CartSidebar
        language={language}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderPlaced={(newOrder) => {
          setOrders((prev) => {
            return [newOrder, ...prev];
          });
        }}
      />

      {/* Orders Modal */}
      <OrdersModal
        language={language}
        isOpen={ordersModalOpen}
        onClose={() => setOrdersModalOpen(false)}
        orders={orders}
        onClearAll={() => {
          setOrders([]);
        }}
      />

      {/* Admin Dashboard Modal */}
      <AdminDashboardModal
        language={language}
        isOpen={adminDashboardOpen}
        onClose={() => setAdminDashboardOpen(false)}
        onRefreshOrders={handleRefreshOrders}
      />

      {/* Footer copyright columns and direct mobile links */}
      <Footer language={language} />

      {/* Floating widgets */}
      <BackToTop language={language} />
      <WhatsAppFloat language={language} />

      {/* Auto-verify order toast notification */}
      {verifyToast && (
        <div
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[90vw] px-5 py-4 rounded-lg shadow-2xl flex items-start gap-3 text-sm font-sans animate-bounce border ${
            verifyToast.type === "success"
              ? "bg-emerald-950/95 border-emerald-500/40 text-emerald-200"
              : verifyToast.type === "error"
              ? "bg-red-950/95 border-red-500/40 text-red-200"
              : "bg-[#1a1500]/95 border-gold/40 text-gold"
          }`}
          id="verify-order-toast"
          role="alert"
        >
          <span className="text-xl shrink-0 leading-none mt-0.5">
            {verifyToast.type === "success" ? "✅" : verifyToast.type === "error" ? "⚠️" : "🔐"}
          </span>
          <p className="leading-relaxed flex-1">{verifyToast.message}</p>
          <button
            onClick={() => setVerifyToast(null)}
            className="text-current opacity-50 hover:opacity-100 shrink-0 text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
