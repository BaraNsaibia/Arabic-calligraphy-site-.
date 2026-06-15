import React, { useState, useEffect } from "react";
import { ShoppingBag, User, Languages, Menu, X, LogOut, ClipboardList, ShieldCheck } from "lucide-react";

import { AuthSession, Language, CartItem } from "../types";
import { TRANSLATIONS } from "../data";
import { signIn, signOut, signUp } from "../utils/auth";

interface NavbarProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  cart: CartItem[];
  setCartOpen: (open: boolean) => void;
  onNavigate: (sectionId: string) => void;
  activeSection: string;
  user: AuthSession | null;
  onAuthChange: (user: AuthSession | null) => void;

  onOrdersOpen: () => void;
  ordersActiveCount: number;
  onAdminDashboardOpen: () => void;
  pendingVerifyOrderId?: string | null;
}


type AuthMode = "signin" | "signup";

export default function Navbar({
  language,
  setLanguage,
  cart,
  setCartOpen,
  onNavigate,
  activeSection,
  user,
  onAuthChange,
  onOrdersOpen,
  ordersActiveCount,
  onAdminDashboardOpen,
  pendingVerifyOrderId,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState(false);

  const t = TRANSLATIONS[language];
  const isRtl = language === "ar";
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const navItems = [
    { id: "home", label: t.navHome },
    { id: "philosophy", label: t.philosophyTitle },
    { id: "craft", label: t.navSira },
    { id: "gallery", label: t.navGallery },
  ];

  const resetAuthForm = () => {
    setNameInput("");
    setEmailInput("");
    setPasswordInput("");
    setAuthMessage("");
    setAuthError(false);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    resetAuthForm();
    setAuthMode("signin");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = (await signIn(emailInput, passwordInput)) as any;

    if (!result.ok) {
      setAuthError(true);
      setAuthMessage(result.error === "invalid" ? t.authErrorInvalid : t.authErrorServer);
      return;
    }

    onAuthChange(result.user);
    setAuthError(false);
    setAuthMessage(t.authSuccessLogin);
    setTimeout(closeAuthModal, 1500);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = (await signUp(nameInput, emailInput, passwordInput)) as any;

    if (!result.ok) {
      setAuthError(true);
      setAuthMessage(result.error === "email_exists" ? t.authErrorEmailExists : t.authErrorServer);
      return;
    }

    onAuthChange(result.user);
    setAuthError(false);
    setAuthMessage(t.authSuccessSignup);
    setTimeout(closeAuthModal, 1500);
  };

  // Auto-open login modal with pre-filled admin email when a verifyOrder param is pending
  useEffect(() => {
    if (pendingVerifyOrderId && !user) {
      setEmailInput("admin@nsaibia.com");
      setAuthMode("signin");
      setAuthMessage(
        `Sign in as admin to approve order ${pendingVerifyOrderId}.`
      );
      setAuthError(false);
      setAuthModalOpen(true);
    }
  }, [pendingVerifyOrderId]);

  const handleLogout = async () => {
    await signOut();
    onAuthChange(null);
    resetAuthForm();
    setAuthMode("signin");
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full transition-all duration-300 border-b border-white/5 bg-obsidian/90 backdrop-blur-md">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Left Icons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAuthModalOpen(true)}
                className={`relative p-2.5 transition-colors duration-200 rounded-md hover:bg-white/5 ${
                  user ? "text-gold" : "text-zinc-400 hover:text-gold"
                }`}
                title={t.authBtnTitle}
                id="auth-account-btn"
              >
                <User className="w-5 h-5" />
                {user && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-gold" />
                )}
              </button>

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2.5 text-zinc-400 hover:text-gold transition-colors duration-200 rounded-md hover:bg-white/5"
                title="Your Art Bag"
                id="cart-btn"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-obsidian px-1">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={onOrdersOpen}
                className="relative p-2.5 text-zinc-400 hover:text-gold transition-colors duration-200 rounded-md hover:bg-white/5"
                title={t.ordersTitle}
                id="orders-btn"
              >
                <ClipboardList className="w-5 h-5" />
                {ordersActiveCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-obsidian px-1" id="orders-badge">
                    {ordersActiveCount}
                  </span>
                )}
              </button>

              {user && user.isAdmin && (
                <button
                  onClick={onAdminDashboardOpen}
                  className="relative p-2.5 text-gold hover:text-white transition-colors duration-200 rounded-md hover:bg-white/5 border border-gold/30 bg-gold/10 animate-pulse"
                  title={isRtl ? "لوحة الإدارة الفنية" : "Curator Admin Panel"}
                  id="admin-dashboard-btn"
                >
                  <ShieldCheck className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-gold hover:bg-white/5 rounded-md border border-white/10 transition-colors"
                title="Change Language"
                id="lang-toggle-btn"
              >
                <Languages className="w-3.5 h-3.5" />
                <span className="font-sans uppercase font-semibold">
                  {language === "ar" ? "English" : "عربي"}
                </span>
              </button>
            </div>

            {/* Center Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8" dir={isRtl ? "rtl" : "ltr"}>
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-sm px-1 py-2 font-medium tracking-wide transition-all duration-300 relative ${
                    activeSection === item.id
                      ? "text-gold font-bold font-serif"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  id={`nav-item-${item.id}`}
                >
                  {item.label}
                  {activeSection === item.id && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gold rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Right Brand Logo */}
            <div className={`flex flex-col text-right ${isRtl ? "text-right" : "text-left"}`}>
              <span className="font-serif text-xl sm:text-2xl tracking-wide font-extrabold text-white">
                {t.brandName}
              </span>
              <span className="font-sans text-[9px] tracking-[0.2em] font-medium text-gold/80 uppercase">
                {t.brandTitle}
              </span>
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-zinc-400 hover:text-white p-2"
                id="mobile-menu-btn"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-obsidian py-4 px-6 space-y-3" dir={isRtl ? "rtl" : "ltr"}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-right py-2 text-sm font-medium ${
                  activeSection === item.id ? "text-gold font-bold font-serif" : "text-zinc-400 hover:text-white"
                }`}
                id={`mobile-nav-${item.id}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Account Identification Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg p-8 rounded-lg glass-panel border border-gold/20" dir={isRtl ? "rtl" : "ltr"}>
            <button
              onClick={closeAuthModal}
              className="absolute top-4 left-4 p-2 text-zinc-400 hover:text-white transition-colors"
              id="close-auth-modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-4">
              <span className="inline-block p-3.5 rounded-full bg-gold/10 text-gold mb-2 border border-gold/10">
                <User className="w-8 h-8" />
              </span>

              <h3 className="font-serif text-2xl font-bold tracking-tight text-white">
                {t.authTitle}
              </h3>

              <p className="font-sans text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
                {t.authSub}
              </p>

              {authMessage && (
                <div
                  className={`p-4 rounded-md text-xs font-semibold border ${
                    authError
                      ? "bg-red-500/10 text-red-300 border-red-500/20"
                      : "bg-gold/10 text-gold border-gold/20"
                  }`}
                >
                  {authMessage}
                </div>
              )}

              {user ? (
                <div className="mt-6 space-y-5 text-left">
                  <div className="p-5 rounded-md bg-white/[0.03] border border-white/10 space-y-2">
                    <p className="font-serif text-sm text-gold">{t.authWelcome}, {user.name}</p>
                    <p className="font-sans text-xs text-zinc-400">{t.authLoggedInAs}</p>
                    <p className="font-mono text-sm text-[#efebe3]">{user.email}</p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full py-3 bg-transparent hover:bg-red-500/10 text-red-300 hover:text-red-200 border border-red-500/20 text-xs font-bold uppercase tracking-wider rounded-md transition-colors flex items-center justify-center gap-2"
                    id="auth-logout-btn"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t.authLogoutBtn}</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mt-6 border-b border-white/5 pb-4">
                    <button
                      onClick={() => {
                        setAuthMode("signin");
                        setAuthMessage("");
                        setAuthError(false);
                      }}
                      className={`flex-1 pb-2 text-xs font-semibold tracking-wide border-b-2 transition-all ${
                        authMode === "signin"
                          ? "border-gold text-gold font-bold"
                          : "border-transparent text-zinc-500 hover:text-zinc-300"
                      }`}
                      id="auth-tab-signin"
                    >
                      {t.authSignIn}
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode("signup");
                        setAuthMessage("");
                        setAuthError(false);
                      }}
                      className={`flex-1 pb-2 text-xs font-semibold tracking-wide border-b-2 transition-all ${
                        authMode === "signup"
                          ? "border-gold text-gold font-bold"
                          : "border-transparent text-zinc-500 hover:text-zinc-300"
                      }`}
                      id="auth-tab-signup"
                    >
                      {t.authSignUp}
                    </button>
                  </div>

                  {authMode === "signin" ? (
                    <form onSubmit={handleSignIn} className="space-y-4 text-left">
                      <div className="space-y-1">
                        <label className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold block">
                          {t.authEmail}
                        </label>
                        <input
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder={t.authEmail}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors"
                          id="auth-signin-email"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold block">
                          {t.authPassword}
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder={t.authPassword}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors"
                          id="auth-signin-password"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 bg-gold hover:bg-gold-hover text-obsidian text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
                        id="auth-login-btn"
                      >
                        {t.authLoginBtn}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignUp} className="space-y-4 text-left">
                      <div className="space-y-1">
                        <label className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold block">
                          {t.authName}
                        </label>
                        <input
                          type="text"
                          required
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder={t.authName}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors"
                          id="auth-signup-name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold block">
                          {t.authEmail}
                        </label>
                        <input
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder={t.authEmail}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors"
                          id="auth-signup-email"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-serif text-[10px] font-bold uppercase tracking-wider text-gold block">
                          {t.authPassword}
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder={t.authPassword}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-md text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-gold transition-colors"
                          id="auth-signup-password"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 bg-gold hover:bg-gold-hover text-obsidian text-xs font-bold uppercase tracking-wider rounded-md transition-colors"
                        id="auth-register-btn"
                      >
                        {t.authRegisterBtn}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
