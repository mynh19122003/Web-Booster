"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  Search,
  X,
  UserRound,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { games } from "@/data/games";
import { CurrencySwitch } from "@/components/ui/Currency";
import { AscendLogo } from "@/components/ui/AscendLogo";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [userMenu, setUserMenu] = useState(false);

  const headerRef = useRef<HTMLElement | null>(null);
  const gamesButtonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const mobileButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchButtonRef = useRef<HTMLButtonElement | null>(null);
  const searchPanelRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [theme, setTheme] = useState<"dark" | "light">(() =>
    typeof window !== "undefined" &&
    window.localStorage.getItem("ascend-theme") === "light"
      ? "light"
      : "dark",
  );

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
    const savedTheme = window.localStorage.getItem("ascend-theme");
    const initialTheme = savedTheme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("ascend-theme", nextTheme);
  }

  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 30);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearch(false);
    setUserMenu(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch(false);
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
      if (
        userMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(target)
      ) {
        setUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, search, userMenu]);

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
      <div className="max-w-7xl mx-auto h-full px-6 md:px-8 flex items-center justify-between gap-3 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:gap-6">
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
          className="hidden xl:flex h-9 items-center justify-self-center gap-8 text-xs font-semibold tracking-wider text-zinc-300 uppercase whitespace-nowrap"
          aria-label="Main navigation"
        >
          <Link
            href="/services"
            className="hover:text-[#FF9F3C] transition-colors py-2 relative group"
          >
            Services
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
              <span>Games</span>
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
            Our pros
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#FF9F3C] transition-all duration-200 group-hover:w-full" />
          </Link>
          <Link
            href="/reviews"
            className="hover:text-[#FF9F3C] transition-colors py-2 relative group"
          >
            Reviews
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#FF9F3C] transition-all duration-200 group-hover:w-full" />
          </Link>
          <Link
            href="/blog"
            className="hover:text-[#FF9F3C] transition-colors py-2 relative group"
          >
            Insights
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#FF9F3C] transition-all duration-200 group-hover:w-full" />
          </Link>
          <Link
            href="/careers"
            className="hover:text-[#FF9F3C] transition-colors py-2 relative group"
          >
            Careers
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#FF9F3C] transition-all duration-200 group-hover:w-full" />
          </Link>
        </nav>

        {/* Action buttons */}
        <div className="flex h-9 items-center gap-2 sm:gap-4 justify-self-end shrink-0">
          <button
            ref={searchButtonRef}
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all shrink-0"
            aria-label="Search games"
            onClick={() => {
              setSearch(!search);
              setOpen(false);
            }}
          >
            <Search size={18} />
          </button>

          <CurrencySwitch compact />

          {user ? (
            <div ref={userMenuRef} className="relative">
              <button
                className="h-9 pl-1 pr-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-[#FF9F3C]/40 rounded-full flex items-center gap-2.5 backdrop-blur-md transition-all cursor-pointer"
                type="button"
                aria-haspopup="menu"
                aria-expanded={userMenu}
                aria-label={`Open account menu for ${user.name}`}
                title={user.name}
                onClick={() => setUserMenu(!userMenu)}
              >
                <span
                  className="w-7 h-7 rounded-full bg-[#FF9F3C] text-black font-bold text-xs flex items-center justify-center flex-shrink-0"
                  aria-hidden="true"
                >
                  {user.name.trim().charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:block text-xs font-medium text-zinc-200 max-w-[100px] md:max-w-[120px] truncate">{user.name}</span>
              </button>

              {userMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#121316]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-1.5 z-50 text-xs flex flex-col gap-1 backdrop-blur-xl"
                  role="menu"
                >
                  <Link
                    href="/account"
                    role="menuitem"
                    onClick={() => setUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <UserRound size={15} /> Account
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={toggleTheme}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                  >
                    {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      setUser(null);
                      setUserMenu(false);
                      router.push("/login");
                      router.refresh();
                    }}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              className="h-9 flex items-center gap-2 px-3 rounded-full bg-[#FF9F3C]/10 hover:bg-[#FF9F3C]/20 border border-[#FF9F3C]/30 text-xs font-semibold text-[#FF9F3C] transition-all hover:shadow-[0_0_15px_rgba(255,159,60,0.2)]"
              aria-label="Sign in or create an account"
              href="/login"
            >
              <UserRound size={15} />
              <span>Sign in</span>
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
        <div className="max-w-[1360px] mx-auto px-6 lg:px-12 py-7">
          {/* Mobile navigation links */}
          <div className="flex xl:hidden flex-col gap-2 pb-5 mb-5 border-b border-white/10 text-sm font-semibold uppercase text-zinc-300">
            <Link
              href="/services"
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-[#FF9F3C] transition-colors"
            >
              Services
            </Link>
            <Link
              href="/boosters"
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-[#FF9F3C] transition-colors"
            >
              Our pros
            </Link>
            <Link
              href="/reviews"
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-[#FF9F3C] transition-colors"
            >
              Reviews
            </Link>
            <Link
              href="/blog"
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-[#FF9F3C] transition-colors"
            >
              Insights
            </Link>
            <Link
              href="/careers"
              onClick={() => setOpen(false)}
              className="py-1.5 hover:text-[#FF9F3C] transition-colors"
            >
              Careers
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
            Find your game
          </label>
          <input
            autoFocus
            id="game-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games (e.g. League of Legends, Valorant)…"
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
