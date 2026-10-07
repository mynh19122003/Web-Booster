import type { LanguageCode } from "@/lib/i18n";
import { localizedContent } from "@/data/locales";

export const faqs = [
  {
    q: "How does boosting work?",
    a: "Select your game, specify your current and desired rank, and complete checkout. A verified elite booster is assigned immediately to begin your order.",
  },
  {
    q: "Is my account safe?",
    a: "Yes. All boosters use dedicated VPNs matching your region and play in offline presence mode. Your login credentials are encrypted and never shared.",
  },
  {
    q: "Can I play with the booster (Duo Boost)?",
    a: "Yes. Choose Duo Boost to queue alongside a pro player on your own account, with zero account sharing required.",
  },
  {
    q: "How long does delivery take?",
    a: "Most orders begin within 5–15 minutes of checkout and finish within 12–48 hours depending on division distance.",
  },
  {
    q: "Can I choose my booster or role?",
    a: "Yes. You can select specific roles, champions, and agents during configuration, or request a preferred booster.",
  },
  {
    q: "How can I track my order progress?",
    a: "Access your real-time client dashboard to view live match history, chat with your booster, and track LP gains round-by-round.",
  },
  {
    q: "What payment methods are supported?",
    a: "We accept Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, Revolut, and major cryptocurrencies (BTC, USDT).",
  },
];

const translatedFaqs: Partial<Record<Exclude<LanguageCode, "en">, typeof faqs>> = {
  vi: [
    { q: "Dịch vụ leo hạng hoạt động thế nào?", a: "Chọn trò chơi, hạng hiện tại và hạng mong muốn rồi hoàn tất thanh toán. Một người chơi trình độ cao đã xác minh sẽ được phân công ngay để bắt đầu đơn hàng." },
    { q: "Tài khoản của tôi có an toàn không?", a: "Có. Người hỗ trợ dùng VPN theo khu vực và chơi ở chế độ ngoại tuyến. Thông tin đăng nhập được mã hóa và không chia sẻ với bên khác." },
    { q: "Tôi có thể chơi cùng người hỗ trợ không?", a: "Có. Chọn dịch vụ chơi đôi để cùng xếp hàng với người chơi chuyên nghiệp bằng tài khoản của bạn, không cần chia sẻ tài khoản." },
    { q: "Thời gian hoàn thành là bao lâu?", a: "Phần lớn đơn hàng bắt đầu trong 5–15 phút sau khi thanh toán và hoàn tất trong 12–48 giờ tùy khoảng cách giữa các hạng." },
    { q: "Tôi có thể chọn người hỗ trợ hoặc vai trò không?", a: "Có. Bạn có thể chọn vai trò, tướng và đặc vụ khi cấu hình hoặc yêu cầu người hỗ trợ cụ thể." },
    { q: "Tôi theo dõi tiến độ bằng cách nào?", a: "Truy cập bảng điều khiển thời gian thực để xem lịch sử trận, trao đổi với người hỗ trợ và theo dõi điểm hạng sau từng vòng." },
    { q: "Có những phương thức thanh toán nào?", a: "Chúng tôi chấp nhận Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, Revolut và các đồng tiền mã hóa phổ biến (BTC, USDT)." },
  ],
  zh: [
    { q: "段位提升服务如何运作？", a: "选择游戏、当前段位和目标段位，然后完成结账。经过验证的高水平玩家会立即获派订单并开始。" },
    { q: "我的账号安全吗？", a: "是的。玩家使用与你所在地区匹配的 VPN，并以隐身状态游戏。登录信息会加密处理，不会与其他方共享。" },
    { q: "我可以和玩家一起双排吗？", a: "可以。选择双排服务，即可使用自己的账号与专业玩家组队，无须共享账号。" },
    { q: "完成需要多长时间？", a: "大多数订单在结账后 5–15 分钟内开始，并根据段位差距在 12–48 小时内完成。" },
    { q: "可以选择玩家或角色吗？", a: "可以。配置时可选择位置、英雄和特工，也可指定偏好的玩家。" },
    { q: "如何查看进度？", a: "在实时控制面板中查看比赛记录、与玩家聊天，并逐轮跟踪段位分数。" },
    { q: "支持哪些支付方式？", a: "我们接受 Visa、Mastercard、American Express、PayPal、Apple Pay、Google Pay、Revolut 和主要加密货币（BTC、USDT）。" },
  ],
  ko: [
    { q: "랭크 부스트는 어떻게 진행되나요?", a: "게임과 현재 랭크, 목표 랭크를 선택하고 결제를 완료하세요. 검증된 상위 티어 플레이어가 즉시 배정되어 주문을 시작합니다." },
    { q: "계정은 안전한가요?", a: "네. 지역에 맞는 VPN과 오프라인 상태를 사용합니다. 로그인 정보는 암호화되고 다른 곳에 공유되지 않습니다." },
    { q: "도우미와 함께 듀오로 플레이할 수 있나요?", a: "네. 듀오 서비스를 선택하면 계정을 공유하지 않고 자신의 계정으로 함께 플레이할 수 있습니다." },
    { q: "완료까지 얼마나 걸리나요?", a: "대부분의 주문은 결제 후 5–15분 이내에 시작되며 랭크 차이에 따라 12–48시간 내에 완료됩니다." },
    { q: "도우미나 역할을 선택할 수 있나요?", a: "네. 설정 중 역할, 챔피언, 요원을 선택하거나 선호하는 도우미를 요청할 수 있습니다." },
    { q: "진행 상황은 어떻게 확인하나요?", a: "실시간 대시보드에서 경기 기록을 보고 도우미와 채팅하며 라운드별 랭크 점수를 확인할 수 있습니다." },
    { q: "어떤 결제 수단이 지원되나요?", a: "Visa, Mastercard, American Express, PayPal, Apple Pay, Google Pay, Revolut 및 주요 암호화폐(BTC, USDT)를 지원합니다." },
  ],
};

export function faqsFor(language: LanguageCode) {
  const localized = localizedContent[language as keyof typeof localizedContent];
  if (localized) return localized.faqs.map(({ q, a }) => ({ q, a }));
  return language === "en" ? faqs : translatedFaqs[language] ?? faqs;
}
