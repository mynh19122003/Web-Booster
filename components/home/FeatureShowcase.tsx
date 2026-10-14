"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Activity, Check, EyeOff, Gift, Headphones } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";

const chatTiming = [1300, 1600, 900, 5800];
const privacyTiming = [4200, 1800];
const progressTiming = [800, 800, 800, 800, 800, 2200];
const rewardTiming = [2400, 2400, 2400];
const progressValues = [0, 24, 48, 68, 84, 100];

function usePreviewCycle(timing: number[], ref: RefObject<HTMLElement | null>) {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const update = () => {
      setRunning(inView && !document.hidden && !motion.matches);
      if (motion.matches) setStep(timing.length - 1);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    }, { threshold: 0.35 });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
    };
  }, [timing, ref]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => setStep((current) => (current + 1) % timing.length), timing[step]);
    return () => window.clearTimeout(timer);
  }, [running, step, timing]);

  return step;
}

export function FeatureShowcase() {
  const { t, text } = useLanguage();
  const chatRef = useRef<HTMLElement>(null);
  const privacyRef = useRef<HTMLElement>(null);
  const trackingRef = useRef<HTMLElement>(null);
  const rewardsRef = useRef<HTMLElement>(null);
  const chatStep = usePreviewCycle(chatTiming, chatRef);
  const privacyStep = usePreviewCycle(privacyTiming, privacyRef);
  const trackingStep = usePreviewCycle(progressTiming, trackingRef);
  const reward = usePreviewCycle(rewardTiming, rewardsRef);
  const offline = privacyStep === 0;
  const progress = progressValues[trackingStep];

  return (
    <section className="section feature-showcase relative isolate overflow-hidden">
      <div className="pointer-events-none absolute -top-10 left-1/3 -z-10 h-[300px] w-[600px] rounded-full bg-[#D97706]/15 blur-[160px]" aria-hidden="true" />
      <div className="site-container relative z-10">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow text-[#FF9F3C]">{t("featureEyebrow")}</p>
            <h2>{t("featureLead")} <span className="muted">{t("featureFinish")}</span></h2>
          </div>
          <p>{t("featureDescription")}<br />{t("featureDescriptionEnd")}</p>
        </div>

        <div className="feature-grid">
          <article ref={chatRef} data-reveal className="feature-card feature-card--support">
            <div className="feature-card-head"><span className="feature-card-icon"><Headphones size={20} /></span><span className="feature-card-index">01 / 04</span></div>
            <h3>{t("liveSupport")}</h3>
            <div className="feature-card-panel feature-chat-panel" aria-label={t("liveSupport")}>
              <div className="feature-panel-heading"><span className="feature-online-dot" />{text("Support conversation", "Trò chuyện hỗ trợ")}</div>
              <div className="feature-chat">
                <div className="feature-chat-bubble feature-chat-bubble--support">{t("chatGreeting")}</div>
                {chatStep >= 1 && <div className="feature-chat-bubble feature-chat-bubble--customer">{t("chatQuestion")}</div>}
                {chatStep === 2 && <div className="feature-chat-bubble feature-chat-bubble--support feature-chat-typing" role="status" aria-label={t("chatTyping")}><span /><span /><span /></div>}
                {chatStep >= 3 && <div className="feature-chat-bubble feature-chat-bubble--support">{t("chatReply")}</div>}
              </div>
            </div>
            <div className="feature-card-foot"><Headphones size={15} />{text("Here when you need us", "Luôn sẵn sàng hỗ trợ bạn")}</div>
          </article>

          <article ref={privacyRef} data-reveal className="feature-card feature-card--privacy">
            <div className="feature-card-head"><span className="feature-card-icon"><EyeOff size={20} /></span><span className="feature-card-index">02 / 04</span></div>
            <h3>{t("privacy")}</h3>
            <div className="feature-card-panel feature-privacy-panel">
              <div className="feature-panel-heading">{text("PRESENCE CONTROL", "KIỂM SOÁT HIỂN THỊ")}</div>
              <div className="feature-privacy-row"><span className={`feature-online-dot ${offline ? "" : "feature-online-dot--green"}`} /><strong>{offline ? t("invisibleMode") : t("visibleMode")}</strong><div aria-hidden="true" className={`feature-switch ${offline ? "is-active" : ""}`}><span /></div></div>
              <p>{offline ? t("privacyDescription") : text("Visible mode shows your activity to friends in this preview.", "Chế độ hiển thị cho phép bạn bè thấy hoạt động trong bản xem trước này.")}</p>
            </div>
            <div className="feature-card-foot"><Check size={15} />{text("You control your visibility", "Bạn kiểm soát trạng thái hiển thị")}</div>
          </article>

          <article ref={trackingRef} data-reveal className="feature-card feature-card--tracking">
            <div className="feature-card-head"><span className="feature-card-icon"><Activity size={20} /></span><span className="feature-card-index">03 / 04</span></div>
            <h3>{t("liveTracking")}</h3>
            <div className="feature-card-panel feature-progress-panel">
              <div className="feature-panel-heading"><span className="feature-online-dot" />{text("ORDER PROGRESS", "TIẾN ĐỘ ĐƠN HÀNG")}</div>
              <div className="feature-progress-dial">
                <svg viewBox="0 0 120 120" aria-hidden="true"><circle className="feature-dial-track" cx="60" cy="60" r="51" /><circle className="feature-dial-fill" cx="60" cy="60" r="51" pathLength="100" strokeDasharray="100" strokeDashoffset={100 - progress} /></svg>
                <div><strong>{progress}<span>%</span></strong><span>{progress === 100 ? <Check size={14} /> : <Activity size={14} />}{text("Live progress", "Tiến độ trực tiếp")}</span></div>
              </div>
            </div>
            <div className="feature-card-foot"><Activity size={15} />{progress === 100 ? text("Order complete", "Đơn hàng hoàn tất") : text("Every match. Every milestone.", "Từng trận đấu. Từng cột mốc.")}</div>
          </article>

          <article ref={rewardsRef} data-reveal className="feature-card feature-card--rewards">
            <div className="feature-card-head"><span className="feature-card-icon"><Gift size={20} /></span><span className="feature-card-index">04 / 04</span></div>
            <h3>{t("rewards")}</h3>
            <div className="feature-card-panel feature-rewards-panel">
              <div className="feature-panel-heading">{text("YOUR REWARD TIER", "HẠNG THƯỞNG CỦA BẠN")}</div>
              <div className="feature-reward-value"><strong>{[3, 7, 10][reward]}<span>%</span></strong><span>{t("cashback")}</span></div>
              <div className="feature-reward-tiers" aria-label={text("Reward tiers", "Các hạng thưởng")}>{["BRONZE", "GOLD", "ELITE"].map((tier, index) => <span key={tier} className={index === reward ? "is-active" : ""}>{tier}</span>)}</div>
            </div>
            <div className="feature-card-foot"><Gift size={15} />{text("Rewards on every order", "Phần thưởng trên mỗi đơn hàng")}</div>
          </article>
        </div>
      </div>
    </section>
  );
}
