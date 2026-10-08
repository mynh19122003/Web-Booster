"use client";
import { translateText } from "@/lib/i18n";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/store/useCart";
import { games } from "@/data/games";
import { useMoney } from "@/components/ui/Currency";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { serviceCopyFor } from "@/data/service-copy";
import { categoryKeys } from "@/lib/product-categories";
import type { ServiceSlug } from "@/lib/service-options";
import type { CartItem } from "@/store/useCart";

function CartItemTitle({ item }: { item: CartItem }) {
  const { language, t } = useLanguage();
  const params = new URLSearchParams(item.href.split("?")[1]);
  if (params.get("account")) return <>{translateText(language,"Account","Tài khoản")} #{params.get("account")}</>;
  if (params.get("type") === "coaching") return item.title.replace(/Coaching/gi, translateText(language, "Coaching"));
  const category = params.get("category");
  if (category && categoryKeys[category]) return t(categoryKeys[category] as Parameters<typeof t>[0]);
  const service = params.get("service");
  return service && ["rank-boost", "duo-boost", "placements", "coaching"].includes(service) ? serviceCopyFor(language, service as ServiceSlug).name : translateText(language, item.title);
}

export function CartIcon() {
  const count = useCart(state => state.items.length);
  const { language } = useLanguage();
  useEffect(() => { void useCart.persist.rehydrate(); }, []);
  return <Link href="/cart" className="site-cart-icon" aria-label={`${translateText(language, "Cart", "Giỏ hàng")}: ${count}`}><ShoppingCart size={20} /><span aria-live="polite">{count}</span></Link>;
}

export function CartPage() {
  const { items, remove } = useCart();
  const money = useMoney();
  const { language } = useLanguage();
  useEffect(() => { void useCart.persist.rehydrate(); }, []);
  return <div className="site-cart-page"><header><ShoppingCart size={28} /><div><h1>{translateText(language, "Your cart", "Giỏ hàng")}</h1><p>{items.length} {translateText(language, "items awaiting checkout", "món đang chờ thanh toán")}</p></div></header>
    {items.length ? <><div className="site-cart-list">{items.map(item => { const game = games.find(game => game.slug === item.game); return <article key={item.id}>{game && <Image src={game.logo} alt={game.name} width={44} height={44} />}<div><small>{game?.name}</small><h2><CartItemTitle item={item} /></h2><p>{item.detail}</p></div><strong>{money.format(item.price)}</strong><Link className="button" href={item.href}>{translateText(language, "Checkout", "Thanh toán")}<ArrowRight size={16} /></Link><button className="icon-button" type="button" onClick={() => remove(item.id)} aria-label={`${translateText(language, "Remove", "Xóa")} ${item.title}`}><Trash2 size={18} /></button></article>; })}</div><div className="site-cart-total"><span>{translateText(language, "Cart subtotal", "Tổng giá trị giỏ hàng")}</span><strong>{money.format(items.reduce((sum, item) => sum + item.price, 0))}</strong></div><p className="muted">{translateText(language, "Check out each item to review its service details.", "Thanh toán từng món để kiểm tra thông tin riêng của mỗi dịch vụ.")}</p></> : <div className="site-cart-empty"><ShoppingCart size={44} /><h2>{translateText(language, "Your cart is empty", "Giỏ hàng đang trống")}</h2><p>{translateText(language, "Your selected plans stay here when you leave checkout.", "Các gói bạn chọn sẽ được giữ tại đây khi rời trang thanh toán.")}</p></div>}
    <Link className="button ghost" href="/services">{translateText(language, "Continue shopping", "Tiếp tục chọn dịch vụ")}<ArrowRight size={16} /></Link></div>;
}
