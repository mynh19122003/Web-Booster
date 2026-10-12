"use client";
import { translateText } from "@/lib/i18n";

import Image from "next/image";
import Link from "next/link";
import { CreditCard, ArrowUpRight, MessageCircle } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { AscendLogo } from "@/components/ui/AscendLogo";

import { paymentMethods } from "@/data/payment-methods";

export function Footer() {
  const { t, language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const groups = [
    { title: text("Games", "Trò chơi"), links: [["League of Legends", "/games/league-of-legends"], ["VALORANT", "/games/valorant"], ["Teamfight Tactics", "/games/teamfight-tactics"]] },
    { title: text("Services", "Dịch vụ"), links: [[text("Rank boost", "Tăng hạng"), "/services/rank-boost"], [text("Duo boost", "Chơi đôi"), "/services/duo-boost"], [text("Personal coaching", "Huấn luyện cá nhân"), "/services/coaching"], [text("Placement matches", "Trận phân hạng"), "/services/placements"], [text("All services", "Tất cả dịch vụ"), "/services"]] },
    { title: text("Resources", "Tài nguyên"), links: [[text("Guides & insights", "Hướng dẫn & bài viết"), "/blog"], [text("Our pros", "Chuyên gia"), "/boosters"], [text("Coaches", "Huấn luyện viên"), "/coaches"]] },
    { title: text("Company", "Về ASCEND"), links: [[text("About us", "Giới thiệu"), "/about"], [text("Reviews", "Đánh giá"), "/reviews"], [text("Join our team", "Gia nhập đội ngũ"), "/careers"], [text("Contact", "Liên hệ"), "/contact"], [text("Help center", "Trung tâm hỗ trợ"), "/support"]] },
    { title: text("Legal", "Chính sách"), links: [[text("Terms of service", "Điều khoản dịch vụ"), "/legal/terms"], [text("Privacy policy", "Chính sách bảo mật"), "/legal/privacy"], [text("Refund policy", "Chính sách hoàn tiền"), "/legal/refund"], [text("Delivery & service", "Giao hàng & dịch vụ"), "/legal/delivery-service"]] },
  ];
  return (
    <footer className="footer ascend-footer-expanded">
      <div className="site-container ascend-footer-content">
        <div className="ascend-footer-intro">
          <div className="ascend-footer-brand"><Link href="/" aria-label="ASCEND"><AscendLogo variant="horizontal" size="md" /></Link><p>{text("Explore gaming services, personal coaching and guides for your next step in League of Legends, VALORANT and TFT.", "Khám phá dịch vụ trò chơi, huấn luyện cá nhân và hướng dẫn cho hành trình tiếp theo trong League of Legends, VALORANT và TFT.")}</p></div>
          <div className="ascend-footer-help"><MessageCircle size={24} aria-hidden="true" /><div><h2>{text("Need a hand?", "Bạn cần trợ giúp?")}</h2><p>{text("Find answers and explore your support options.", "Tìm câu trả lời và các lựa chọn hỗ trợ.")}</p><Link href="/support">{text("Visit help center", "Đến trung tâm hỗ trợ")}<ArrowUpRight size={16} aria-hidden="true" /></Link></div></div>
        </div>
        <div className="ascend-footer-links">{groups.map((group) => <nav key={group.title} aria-label={group.title}><h3>{group.title}</h3><ul>{group.links.map(([label, href]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul></nav>)}</div>
      </div>
      <div className="site-container border-t border-white/[0.08] pt-6 pb-6 mt-12">
        <p className="text-xs font-mono uppercase tracking-widest text-[#FF9F3C] flex items-center gap-2 mb-4"><CreditCard size={14} aria-hidden="true" />{t("acceptedPayments")}</p>
        <div aria-label={t("acceptedPaymentMethods")} className="ascend-payment-strip w-full flex items-center justify-between gap-6 md:gap-8 overflow-x-auto scrollbar-none py-2">
          {paymentMethods.map(({name, file, width}) => (
            <div
              key={name}
              title={name}
              className="h-6 flex items-center justify-center flex-shrink-0 opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <Image
                src={`/images/payments/${file}`}
                alt={name}
                width={width}
                height={28}
                className="h-full object-contain"
                style={{ width: Math.round(width * 0.75), maxWidth: Math.round(width * 0.75) }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="site-container ascend-footer-bottom"><p>{text("ASCEND is an independent project and is not affiliated with Riot Games or other game publishers. All trademarks belong to their respective owners.", "ASCEND là dự án độc lập, không liên kết với Riot Games hay các nhà phát hành trò chơi khác. Các nhãn hiệu thuộc về chủ sở hữu tương ứng.")}</p><div><span>© 2026 ASCEND. {text("All rights reserved.", "Bảo lưu mọi quyền.")}</span><Link href="/legal/terms">{text("Website terms", "Điều khoản website")}</Link></div></div>
    </footer>
  );
}
