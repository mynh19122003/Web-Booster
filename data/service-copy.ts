import { services } from "@/data/services";
import { localizedContent } from "@/data/locales";
import type { LanguageCode } from "@/lib/i18n";
import type { ServiceSlug } from "@/lib/service-options";

type ServiceCopy = { name: string; description: string };

const translations: Partial<Record<LanguageCode, Partial<Record<ServiceSlug, ServiceCopy>>>> = {
  vi: {
    "rank-boost": { name: "Leo hạng", description: "Chọn đích đến và lập kế hoạch leo hạng phù hợp với ước tính rõ ràng." },
    "duo-boost": { name: "Chơi đôi", description: "Xếp hàng cùng nhau, học hỏi trực tiếp và tận dụng từng trận đấu." },
    coaching: { name: "Huấn luyện cá nhân", description: "Biến các trận đã chơi thành kế hoạch cải thiện thực tế cùng huấn luyện viên riêng." },
    placements: { name: "Trận phân hạng", description: "Bắt đầu mùa giải mới với kế hoạch tập trung và hướng dẫn từ chuyên gia." },
  },
  zh: {
    "rank-boost": { name: "段位提升", description: "选择目标，制定个性化的段位提升计划，并查看清晰的预估。" },
    "duo-boost": { name: "双排服务", description: "一起组队，实时学习，让每场比赛更有价值。" },
    coaching: { name: "个人指导", description: "与专属教练一起复盘，制定实用的提升计划。" },
    placements: { name: "定位赛", description: "通过明确的计划和专家指导开启新赛季。" },
  },
  ko: {
    "rank-boost": { name: "랭크 부스트", description: "목표를 정하고 명확한 예상치와 함께 맞춤 랭크 성장 계획을 세우세요." },
    "duo-boost": { name: "듀오 부스트", description: "함께 대기열에 참여하고 실시간으로 배우며 매 경기를 활용하세요." },
    coaching: { name: "개인 코칭", description: "전담 코치와 리플레이를 검토하고 실용적인 개선 계획을 만드세요." },
    placements: { name: "배치 경기", description: "집중적인 계획과 전문가의 지도와 함께 새 시즌을 시작하세요." },
  },
};

export function serviceCopyFor(language: LanguageCode, slug: ServiceSlug): ServiceCopy {
  const localized = localizedContent[language as keyof typeof localizedContent];
  if (localized) return localized.services[slug] as ServiceCopy;
  return translations[language]?.[slug] ?? services.find((service) => service.slug === slug)!;
}
