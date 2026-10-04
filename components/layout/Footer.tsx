import Link from "next/link";
import { Hexagon, ArrowUpRight, Code2, MessageCircle } from "lucide-react";
import { games } from "@/data/games";
import { services } from "@/data/services";
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div>
          <Link href="/" className="logo">
            <Hexagon />
            <span>ASCEND®</span>
          </Link>
          <p>
            A higher standard of play.
            <br />
            Built for your next chapter.
          </p>
          <div className="socials">
            <a href="https://github.com" aria-label="GitHub">
              <Code2 size={18} />
            </a>
            <Link href="/support" aria-label="Support">
              <MessageCircle size={18} />
            </Link>
          </div>
        </div>
        <div>
          <h3>Games</h3>
          {games.slice(0, 4).map((g) => (
            <Link href={`/games/${g.slug}`} key={g.slug}>
              {g.name}
            </Link>
          ))}
        </div>
        <div>
          <h3>Services</h3>
          {services.map((s) => (
            <Link href={`/services/${s.slug}`} key={s.slug}>
              {s.name}
            </Link>
          ))}
        </div>
        <div>
          <h3>Company</h3>
          <Link href="/boosters">Meet the pros</Link>
          <Link href="/reviews">Our community</Link>
          <Link href="/blog">
            Insights <ArrowUpRight size={12} />
          </Link>
        </div>
        <div>
          <h3>Support & legal</h3>
          <Link href="/support">Help center</Link>
          <Link href="/#faq">FAQs</Link>
          <Link href="/legal/privacy">Privacy policy</Link>
          <Link href="/legal/terms">Terms of service</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Ascend. An independent concept platform.
        </span>
        <span>
          Game names belong to their respective owners. Not affiliated or
          endorsed.
        </span>
        <span className="payment-label">DEMO · NO PAYMENTS</span>
      </div>
    </footer>
  );
}
