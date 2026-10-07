"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Menu,
  Search,
  X,
  UserRound,
  LogOut,
} from "lucide-react";
import { DashboardMenu } from "@/components/account/DashboardMenu";
import { DashboardLanguage } from "@/components/account/DashboardLanguage";
import { games } from "@/data/games";
import { CurrencySwitch } from "@/components/ui/Currency";
import { AscendLogo } from "@/components/ui/AscendLogo";
import { useStore } from "@/store/useStore";
import { languages } from "@/lib/i18n";
import { setLanguage, useLanguage } from "@/components/ui/LanguageProvider";
import { LanguageFlag } from "@/components/ui/LanguageFlag";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [localeMenu, setLocaleMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [userMenu, setUserMenu] = useState(false);
  const setStore = useStore((state) => state.set);
  const currency = useStore((state) => state.currency);
  const { language: languageCode, t } = useLanguage();
  const reduceMotion = useReducedMotion();

  const headerRef = useRef<HTMLElement | null>(null);
  const gamesButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const mobileButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const localeMenuRef = useRef<HTMLDivElement | null>(null);
  const userTriggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerCloseRef = useRef<HTMLButtonElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const language = languages.find((option) => option.code === languageCode) ?? languages[0];

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (active) setUser(result.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    const previousTheme = document.documentElement.dataset.theme;
    document.documentElement.dataset.theme = "dark";
    try {
      window.localStorage.removeItem("ascend-theme");
    } catch {
      // The storefront remains dark when browser storage is unavailable.
    }
    return () => {
      if (previousTheme === undefined) delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = previousTheme;
    };
  }, []);

  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 30);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);

  useEffect(() => {
    if (!userMenu) return;
    const previousOverflow = document.body.style.overflow;
    const trigger = userTriggerRef.current;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => drawerCloseRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [userMenu]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch(false);
        setLocaleMenu(false);
        setUserMenu(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        open &&
        gamesButtonRef.current &&
        !gamesButtonRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        (!mobileButtonRef.current || !mobileButtonRef.current.contains(target))
      ) {
        setOpen(false);
      }
      if (
        search &&
        searchPanelRef.current &&
        !searchPanelRef.current.contains(target) &&
        !searchButtonRef.current?.contains(target)
      ) {
        setSearch(false);
      }
      if (localeMenu && localeMenuRef.current && !localeMenuRef.current.contains(target)) {
        setLocaleMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, search, localeMenu]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false);
    }, 180);
  };

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 h-20 w-full transition-all duration-300 backdrop-blur-2xl -webkit-backdrop-blur-2xl border-b ${
        scrolled
          ? "bg-black/40 border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.12)]"
          : "bg-black/20 border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]"
      }`}
    >
      <div className="site-container h-full flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex h-9 items-center text-white group transition-transform hover:scale-[1.02] shrink-0 justify-self-start"
          aria-label="Ascend home"
        >
          <span className="hidden sm:block"><AscendLogo variant="horizontal" size="md" /></span>
          <span className="sm:hidden"><AscendLogo variant="icon" size="md" /></span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden xl:flex h-9 items-center justify-self-center gap-6 text-xs font-semibold tracking-wider text-zinc-300 uppercase whitespace-nowrap"
          aria-label="Main navigation"
        >
          <Link
            href="/services"
            className="hover:text-[#FF9F3C] transition-colors py-2 relative group"
          >
            {t("services")}
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#FF9F3C] transition-all duration-200 group-hover:w-full" />
          </Link>

          {/* Games Nav Item with Hover & Click */}
          <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              ref={gamesButtonRef}
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              aria-controls="games-menu"
              type="button"
              className={`flex items-center gap-1.5 py-2 uppercase transition-colors group ${
                open ? "text-[#FF9F3C]" : "hover:text-[#FF9F3C]"
              }`}
            >
              <span>{t("games")}</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ease-out ${
                  open ? "rotate-180 text-[#FF9F3C]" : "text-zinc-400 group-hover:text-[#FF9F3C]"
                }`}
              />
              <span
                className={`absolute bottom-0 left-0 h-[2px] bg-[#FF9F3C] transition-all duration-200 ${
                  open ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </button>
          </div>

          <Link
            href="/boosters"
            className="hover:text-[#FF9F3C] transition-colors py-2 relative group"
          >
            {t("ourPros")}
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#FF9F3C] transition-all duration-200 group-hover:w-full" />
          </Link>
          <Link
            href="/reviews"
            className="hover:text-[#FF9F3C] transition-colors py-2 relative group"
          >
            {t("reviews")}
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#FF9F3C] transition-all duration-200 group-hover:w-full" />
          </Link>
          <Link
            href="/blog"
            className="hover:text-[#FF9F3C] transition-colors py-2 relative group"
          >
            {t("insights")}
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#FF9F3C] transition-all duration-200 group-hover:w-full" />
          </Link>
          <Link
            href="/careers"
            className="hover:text-[#FF9F3C] transition-colors py-2 relative group"
          >
            {t("careers")}
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#FF9F3C] transition-all duration-200 group-hover:w-full" />
          </Link>
        </nav>

        {/* Action buttons */}
        <div className="flex h-9 items-center gap-2 sm:gap-4 justify-self-end shrink-0">
          <button
            ref={searchButtonRef}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all shrink-0"
            aria-label={t("searchGames")}
            onClick={() => {
              setSearch(!search);
              setOpen(false);
              setLocaleMenu(false);
            }}
          >
            <Search size={18} />
          </button>

          <div ref={localeMenuRef} className="relative shrink-0">
            <button
              type="button"
              className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              aria-label={`Language: ${language.name}. Currency: ${currency}. Open preferences`}
              aria-expanded={localeMenu}
              aria-controls="header-locale-menu"
              onClick={() => {
                setLocaleMenu((current) => !current);
                setOpen(false);
                setSearch(false);
              }}
            >
              <LanguageFlag code={language.flagCode} />
              <span>{language.short}</span>
              <span className="text-zinc-600" aria-hidden="true">|</span>
              <span className="text-zinc-400">{currency}</span>
              <ChevronDown size={12} className={`text-zinc-500 transition-transform ${localeMenu ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {localeMenu && (
              <div
                id="header-locale-menu"
                className="locale-glass absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl border border-white/20 p-3 text-sm text-zinc-200 max-sm:fixed max-sm:left-4 max-sm:right-4 max-sm:top-20 max-sm:mt-2 max-sm:w-auto"
              >
                <div className="border-b border-white/10 pb-3">
                  <div className="mb-2 flex items-center justify-between px-2">
                    <span className="text-xs font-semibold text-zinc-400">{t("language")}</span>
                  </div>
                  <div className="locale-language-list grid max-h-72 gap-1 overflow-y-auto overscroll-contain pr-1">
                    {languages.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors ${languageCode === option.code ? "text-white" : "hover:bg-white/[0.06]"}`}
                        aria-pressed={languageCode === option.code}
                        onClick={() => setLanguage(option.code)}
                      >
                        <LanguageFlag code={option.flagCode} />
                        <span className="min-w-0 flex-1"><strong className="block text-xs font-semibold">{option.name}</strong>{option.country !== option.name && <span className="block text-[11px] text-zinc-400">{option.country}</span>}</span>
                        {languageCode === option.code && <Check size={15} className="text-[#ffb547]" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 px-2 pt-3">
                  <span className="font-semibold">{t("currency")}</span>
                  <CurrencySwitch compact />
                </div>
              </div>
            )}
          </div>

          {user ? (
            <div className="relative">
              <button
                ref={userTriggerRef}
                className="h-9 pl-1 pr-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#FF9F3C]/40 rounded-full flex items-center gap-2.5 backdrop-blur-md transition-all cursor-pointer"
                type="button"
                aria-haspopup="dialog"
                aria-expanded={userMenu}
                aria-controls="profile-dashboard-drawer"
                aria-label={`Open player dashboard for ${user.name}`}
                title={user.name}
                onClick={() => {
                  setUserMenu((current) => !current);
                  setOpen(false);
                  setSearch(false);
                  setLocaleMenu(false);
                }}
              >
                <span
                  className="w-7 h-7 rounded-full bg-[#FF9F3C] text-black font-bold text-xs flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:block text-xs font-medium text-zinc-200 max-w-[100px] md:max-w-[120px] truncate">{user.name}</span>
              </button>
            </div>
          ) : (
            <Link
              className="h-9 flex items-center gap-2 px-3 rounded-full bg-[#FF9F3C]/10 hover:bg-[#FF9F3C]/20 border border-[#FF9F3C]/30 text-xs font-semibold text-[#FF9F3C] transition-all hover:shadow-[0_0_15px_rgba(255,159,60,0.2)]"
              aria-label="Sign in or create an account"
              href="/login"
            >
              <UserRound size={15} />
              <span className="hidden sm:inline">{t("signIn")}</span>
            </Link>
          )}

          {/* Mobile hamburger button */}
          <button
            ref={mobileButtonRef}
            className="xl:hidden w-9 h-9 flex items-center justify-center rounded-full text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
        {user && userMenu && (
          <motion.div
            key="profile-dashboard"
            className="profile-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setUserMenu(false);
            }}
          >
            <motion.aside
              id="profile-dashboard-drawer"
              className="profile-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-dashboard-title"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: reduceMotion ? 0.01 : 0.34, ease: [0.22, 0.61, 0.36, 1] }}
              onKeyDown={(event) => {
                if (event.key !== "Tab") return;
                const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
                  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ));
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (!first || !last) return;
                if (event.shiftKey && document.activeElement === first) {
                  event.preventDefault();
                  last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                  event.preventDefault();
                  first.focus();
                }
              }}
            >
              <div className="profile-drawer-topline">
                <div className="profile-drawer-brand">
                  <AscendLogo size="sm" showTagline={false} />
                </div>
                <button
                  ref={drawerCloseRef}
                  type="button"
                  className="profile-drawer-close"
                  aria-label={t("closePlayerDashboard")}
                  onClick={() => setUserMenu(false)}
                >
                  <X size={19} />
                </button>
              </div>

              <Link href="/account" onClick={() => setUserMenu(false)} className="profile-drawer-profile">
                <span className="profile-drawer-avatar" aria-hidden="true">
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
                <div className="profile-drawer-identity">
                  <h2 id="profile-dashboard-title">{user.name}</h2>
                  <p>{user.email}</p>
                </div>
                <ChevronRight size={18} aria-hidden="true" />
              </Link>

              <DashboardMenu email={user.email} close={() => setUserMenu(false)} />

              <div className="profile-drawer-footer">
                <DashboardLanguage />
                <button
                  type="button"
                  className="profile-drawer-signout"
                  onClick={async () => {
                    await fetch("/api/auth/logout", { method: "POST" });
                    setUser(null);
                    setUserMenu(false);
                    router.replace("/");
                    router.refresh();
                  }}
                >
                  <LogOut size={16} /> {t("signOut")}
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
        </AnimatePresence>, document.body)}

      {/* GAMES DROPDOWN MENU WITH SMOOTH SLIDE-DOWN & FADE-IN ANIMATION */}
      <div
        ref={menuRef}
        id="games-menu"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`absolute left-0 right-0 top-full transition-all duration-200 ease-out transform bg-[#0F0F10]/95 backdrop-blur-2xl border-t border-b border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] max-h-[85vh] overflow-y-auto ${
          open
            ? "opacity-100 translate-y-0 visible pointer-events-auto"
            : "opacity-0 translate-y-2 invisible pointer-events-none"
        }`}
      >
        <div className="site-container py-7">
          {/* Mobile navigation links */}
          <div className="flex xl:hidden flex-col gap-2 pb-5 mb-5 border-b border-white/10 text-sm font-semibold uppercase text-zinc-300">
            <Link
              href="/services"
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-[#FF9F3C] transition-colors"
            >
              {t("services")}
            </Link>
            <Link
              href="/boosters"
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-[#FF9F3C] transition-colors"
            >
              {t("ourPros")}
            </Link>
            <Link
              href="/reviews"
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-[#FF9F3C] transition-colors"
            >
              {t("reviews")}
            </Link>
            <Link
              href="/blog"
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-[#FF9F3C] transition-colors"
            >
              {t("insights")}
            </Link>
            <Link
              href="/careers"
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-[#FF9F3C] transition-colors"
            >
              {t("careers")}
            </Link>
          </div>

          <p className="text-xs font-bold tracking-widest text-[#FF9F3C] uppercase mb-4">
            YOUR GAME. YOUR NEXT LEVEL.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {games.map((g) => (
              <Link
                key={g.slug}
                href={`/games/${g.slug}`}
                onClick={() => setOpen(false)}
                className="group/game relative flex items-center gap-3.5 p-3.5 rounded-xl bg-[#16161a]/70 hover:bg-[#1F1F23]/90 border border-white/5 hover:border-[#FF9F3C]/50 hover:shadow-[0_0_20px_rgba(255,159,60,0.15)] transition-all duration-200 backdrop-blur-md"
              >
                <div className="aspect-square w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center p-1.5 flex-shrink-0 group-hover/game:border-[#FF9F3C]/30 transition-colors">
                  <Image
                    src={g.logo}
                    alt={g.name}
                    width={48}
                    height={48}
                    className="object-contain w-full h-full drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-bold text-sm text-white group-hover/game:text-[#F5D7A1] transition-colors truncate">
                    {g.name}
                  </span>
                  <small className="block text-[11px] text-zinc-400 truncate mt-0.5">
                    {g.services.join(" · ")}
                  </small>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-zinc-500 group-hover/game:text-[#FF9F3C] group-hover/game:translate-x-0.5 group-hover/game:-translate-y-0.5 transition-all flex-shrink-0"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* SEARCH PANEL */}
      <div
        ref={searchPanelRef}
        className={`absolute left-0 right-0 top-full transition-all duration-200 ease-out transform bg-[#0F0F10]/95 backdrop-blur-2xl border-t border-b border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] ${
          search
            ? "opacity-100 translate-y-0 visible pointer-events-auto"
            : "opacity-0 translate-y-2 invisible pointer-events-none"
        }`}
      >
        <div className="max-w-[700px] mx-auto px-6 py-8">
          <label
            htmlFor="game-search"
            className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5"
          >
            {t("searchGamePrompt")}
          </label>
          <input
            autoFocus
            id="game-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchGameHint")}
            className="w-full h-12 px-4 rounded-xl bg-[#121316]/95 backdrop-blur-2xl border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF9F3C] focus:ring-1 focus:ring-[#FF9F3C] transition-all text-sm"
          />
          <div className="mt-4 flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
            {games
              .filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
              .map((g) => (
                <Link
                  key={g.slug}
                  href={`/games/${g.slug}`}
                  onClick={() => setSearch(false)}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-[#FF9F3C]/10 border border-white/5 hover:border-[#FF9F3C]/30 text-sm font-semibold text-white transition-all group"
                >
                  <span>{g.name}</span>
                  <ArrowUpRight
                    size={16}
                    className="text-zinc-500 group-hover:text-[#FF9F3C] transition-colors"
                  />
                </Link>
              ))}
            {!games.some((g) =>
              g.name.toLowerCase().includes(query.toLowerCase()),
            ) && (
              <p className="text-zinc-500 text-sm py-4 text-center">
                No games found. Try another title.
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
