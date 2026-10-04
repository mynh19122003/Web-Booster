"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Menu,
  Search,
  X,
  UserRound,
  Hexagon,
} from "lucide-react";
import { games } from "@/data/games";
import { CurrencySwitch } from "@/components/ui/Currency";
export function Header() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 30);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-shell">
        <Link href="/" className="logo" aria-label="Ascend home">
          <Hexagon size={29} />
          <span>
            ASCEND<span className="logo-dot">®</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="/services">Services</Link>
          <button
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls="games-menu"
          >
            Games <ChevronDown size={13} />
          </button>
          <Link href="/boosters">Our pros</Link>
          <Link href="/reviews">Reviews</Link>
          <Link href="/blog">Insights</Link>
          <Link href="/careers">Careers</Link>
        </nav>
        <div className="nav-actions">
          <button
            className="icon-button"
            aria-label="Search games"
            onClick={() => {
              setSearch(!search);
              setOpen(false);
            }}
          >
            <Search size={18} />
          </button>
          <CurrencySwitch compact />
          <Link
            className="login"
            aria-label="Sign in or create an account"
            href="/login"
          >
            <UserRound size={16} />
            <span>Sign in</span>
          </Link>
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <div className="mega-menu" id="games-menu">
          <div className="mobile-links">
            <Link href="/services" onClick={() => setOpen(false)}>
              Services
            </Link>
            <Link href="/boosters" onClick={() => setOpen(false)}>
              Our pros
            </Link>
            <Link href="/reviews" onClick={() => setOpen(false)}>
              Reviews
            </Link>
            <Link href="/blog" onClick={() => setOpen(false)}>
              Insights
            </Link>
            <Link href="/careers" onClick={() => setOpen(false)}>
              Careers
            </Link>
          </div>
          <p className="eyebrow">YOUR GAME. YOUR NEXT LEVEL.</p>
          <div className="mega-grid">
            {games.map((g) => (
              <Link
                key={g.slug}
                href={`/games/${g.slug}`}
                onClick={() => setOpen(false)}
              >
                <span className="game-symbol" aria-hidden="true">
                  <Image src={g.logo} alt="" fill sizes="60px" />
                </span>
                <span>
                  {g.name}
                  <small>{g.services.join(" · ")}</small>
                </span>
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </div>
        </div>
      )}
      {search && (
        <div className="search-panel">
          <label htmlFor="game-search">Find your game</label>
          <input
            autoFocus
            id="game-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games…"
          />
          <div>
            {games
              .filter((g) => g.name.toLowerCase().includes(query.toLowerCase()))
              .map((g) => (
                <Link
                  key={g.slug}
                  href={`/games/${g.slug}`}
                  onClick={() => setSearch(false)}
                >
                  {g.name}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            {!games.some((g) =>
              g.name.toLowerCase().includes(query.toLowerCase()),
            ) && <p>No games found. Try another title.</p>}
          </div>
        </div>
      )}
    </header>
  );
}
