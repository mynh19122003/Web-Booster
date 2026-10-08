import type { LanguageCode } from "@/lib/i18n";
import { localizedContent } from "@/data/locales";

type PageCopy = { eyebrow: string; title: string; description: string };

const english = {
  about: { eyebrow: "ABOUT ASCEND", title: "A concept for your next level", description: "An independent gaming-services concept exploring a clearer way to plan a competitive climb." },
  careers: { eyebrow: "CAREERS AT ASCEND", title: "Bring your best game", description: "We welcome skilled players and thoughtful coaches. Tell us who you are and where you excel." },
  support: { eyebrow: "WE’RE IN YOUR CORNER", title: "A little guidance", description: "Start with our answers below, or draft a question using the demonstration form." },
  contact: { eyebrow: "CONTACT", title: "We’re here to help", description: "Support-channel information for the current ASCEND preview." },
  boosters: { eyebrow: "THE ASCEND ROSTER", title: "Talent meets ambition", description: "Meet our concept roster. These original profiles illustrate the future player selection experience." },
  reviews: { eyebrow: "COMMUNITY FIRST", title: "The player perspective", description: "Fictional stories that show the kind of thoughtful experience we aim to build. These are not verified customer reviews." },
  services: { eyebrow: "FIND YOUR NEXT STEP", title: "Gaming services", description: "Choose your game and the support that fits your next goal." },
  blog: { eyebrow: "INSIGHTS / THE PLAYBOOK", title: "Play with intention", description: "Small ideas for a better climb. Original articles on focus, practice, and teamplay." },
} satisfies Record<string, PageCopy>;

export type PageCopyKey = keyof typeof english;

const translations: Partial<Record<LanguageCode, Partial<Record<PageCopyKey, PageCopy>>>> = {
  vi: {
    about: { eyebrow: "VỀ ASCEND", title: "Ý tưởng cho cấp độ tiếp theo", description: "Mô hình dịch vụ trò chơi độc lập hướng đến cách lập kế hoạch leo hạng rõ ràng hơn." },
    careers: { eyebrow: "TUYỂN DỤNG TẠI ASCEND", title: "Thể hiện khả năng của bạn", description: "Chúng tôi chào đón người chơi giỏi và huấn luyện viên tận tâm. Hãy giới thiệu bản thân và thế mạnh của bạn." },
    support: { eyebrow: "LUÔN ĐỒNG HÀNH CÙNG BẠN", title: "Hướng dẫn dành cho bạn", description: "Xem câu trả lời bên dưới hoặc soạn câu hỏi bằng biểu mẫu minh họa." },
    contact: { eyebrow: "LIÊN HỆ", title: "Chúng tôi sẵn sàng hỗ trợ", description: "Thông tin kênh hỗ trợ cho bản xem trước ASCEND hiện tại." },
    boosters: { eyebrow: "ĐỘI NGŨ ASCEND", title: "Tài năng gặp tham vọng", description: "Gặp đội ngũ mẫu của chúng tôi. Các hồ sơ minh họa trải nghiệm lựa chọn người chơi trong tương lai." },
    reviews: { eyebrow: "CỘNG ĐỒNG LÀ TRÊN HẾT", title: "Góc nhìn người chơi", description: "Những câu chuyện hư cấu minh họa trải nghiệm chúng tôi hướng đến. Đây không phải đánh giá đã xác minh." },
    services: { eyebrow: "TÌM BƯỚC TIẾP THEO", title: "Dịch vụ trò chơi", description: "Chọn trò chơi và hình thức hỗ trợ phù hợp với mục tiêu tiếp theo của bạn." },
    blog: { eyebrow: "GÓC NHÌN / CẨM NANG", title: "Chơi có mục tiêu", description: "Những ý tưởng nhỏ cho hành trình tốt hơn. Bài viết về tập trung, luyện tập và phối hợp đội nhóm." },
  },
  zh: {
    about: { eyebrow: "关于 ASCEND", title: "迈向下一等级的构想", description: "一个独立的游戏服务概念，探索更清晰的竞技进阶规划方式。" },
    careers: { eyebrow: "加入 ASCEND", title: "展现最佳实力", description: "欢迎优秀玩家和认真负责的教练。告诉我们你的经历与特长。" },
    support: { eyebrow: "与你并肩", title: "获取帮助", description: "查看下方解答，或使用演示表单拟写问题。" },
    contact: { eyebrow: "联系我们", title: "我们随时提供帮助", description: "当前 ASCEND 预览版的支持渠道信息。" },
    boosters: { eyebrow: "ASCEND 阵容", title: "实力与抱负相遇", description: "了解概念阵容。这些原创资料展示未来的玩家选择体验。" },
    reviews: { eyebrow: "社区优先", title: "玩家视角", description: "虚构故事展示我们希望打造的体验，并非经过验证的真实评价。" },
    services: { eyebrow: "迈出下一步", title: "游戏服务", description: "选择游戏，以及符合下一目标的支持方式。" },
    blog: { eyebrow: "资讯 / 攻略", title: "有目标地游戏", description: "提升游戏体验的小建议。涵盖专注、练习和团队配合的原创文章。" },
  },
  ko: {
    about: { eyebrow: "ASCEND 소개", title: "다음 레벨을 위한 구상", description: "경쟁 게임의 성장 계획을 더 명확하게 만드는 독립적인 게임 서비스 콘셉트입니다." },
    careers: { eyebrow: "ASCEND 채용", title: "최고의 실력을 보여주세요", description: "실력 있는 플레이어와 성실한 코치를 기다립니다. 자신과 강점을 소개해 주세요." },
    support: { eyebrow: "언제나 함께합니다", title: "도움말", description: "아래 답변을 확인하거나 데모 양식으로 질문을 작성해 보세요." },
    contact: { eyebrow: "문의", title: "도와드리겠습니다", description: "현재 ASCEND 미리보기의 지원 채널 정보입니다." },
    boosters: { eyebrow: "ASCEND 팀", title: "재능과 열정의 만남", description: "콘셉트 팀을 만나보세요. 이 프로필은 향후 플레이어 선택 경험을 보여줍니다." },
    reviews: { eyebrow: "커뮤니티 우선", title: "플레이어의 관점", description: "우리가 지향하는 경험을 보여주는 가상의 이야기이며 검증된 고객 리뷰는 아닙니다." },
    services: { eyebrow: "다음 단계 찾기", title: "게임 서비스", description: "게임과 다음 목표에 맞는 지원을 선택하세요." },
    blog: { eyebrow: "인사이트 / 플레이북", title: "목표를 갖고 플레이", description: "더 나은 성장을 위한 작은 아이디어. 집중, 연습, 팀플레이에 관한 글입니다." },
  },
};

export function pageCopyFor(language: LanguageCode, key: PageCopyKey): PageCopy {
  const localized = localizedContent[language as keyof typeof localizedContent];
  if (localized) return localized.pages[key] as PageCopy;
  return translations[language]?.[key] ?? english[key];
}
