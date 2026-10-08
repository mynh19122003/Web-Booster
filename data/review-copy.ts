import type { LanguageCode } from "@/lib/i18n";
import type { Review } from "@/types/review";
import { reviews } from "@/data/reviews";
import { localizedContent } from "@/data/locales";

const reviewTranslations: Partial<Record<LanguageCode, Record<string, string>>> = {
  vi: {
    "The match-by-match updates are exactly what I wanted. Everything is easy to follow.": "Cập nhật sau từng trận đúng là điều tôi cần. Mọi thứ đều dễ theo dõi.",
    "Clean experience from the first click. Having a clear plan made all the difference.": "Trải nghiệm rõ ràng ngay từ lần nhấp đầu tiên. Kế hoạch cụ thể tạo nên khác biệt.",
    "The coaching feedback helped me understand my mistakes, not just my score.": "Phản hồi từ huấn luyện viên giúp tôi hiểu lỗi sai, chứ không chỉ nhìn vào điểm số.",
    "Finally, a dashboard that keeps the useful information in one place.": "Cuối cùng cũng có bảng điều khiển tập hợp mọi thông tin hữu ích ở một nơi.",
    "The weekly goals feel manageable, and I can tell what to work on next.": "Mục tiêu hằng tuần vừa sức và tôi biết mình cần cải thiện điều gì tiếp theo.",
    "I liked being able to review each step and see how my progress changed.": "Tôi thích việc có thể xem lại từng bước và theo dõi tiến độ thay đổi ra sao.",
    "Simple to follow, with useful feedback that I could put into practice.": "Dễ theo dõi, kèm phản hồi hữu ích mà tôi có thể áp dụng ngay.",
    "The plan gave me a clearer routine and made each session more focused.": "Kế hoạch giúp tôi có lộ trình rõ ràng hơn và tập trung hơn trong mỗi buổi.",
    "I appreciate having the notes and next steps gathered in one place.": "Tôi thích việc ghi chú và các bước tiếp theo được tập hợp ở cùng một nơi.",
    "The feedback was clear and practical, so I knew what to try in my next match.": "Phản hồi rõ ràng và thiết thực, giúp tôi biết nên thử điều gì trong trận tiếp theo.",
    "The weekly plan helped me focus on a few changes instead of fixing everything at once.": "Kế hoạch hằng tuần giúp tôi tập trung sửa một vài điểm thay vì cố cải thiện mọi thứ cùng lúc.",
    "Clear notes after each session made it easy to track what I was improving.": "Ghi chú rõ ràng sau mỗi buổi giúp tôi dễ theo dõi những điểm đang tiến bộ.",
    "The comp suggestions were easy to understand and gave me a better game plan.": "Gợi ý đội hình dễ hiểu và giúp tôi có chiến thuật tốt hơn.",
    "I liked having practical feedback I could use right away in my next matches.": "Tôi thích những phản hồi thực tế có thể áp dụng ngay trong các trận tiếp theo.",
    "The progress updates were consistent, helpful, and simple to follow.": "Cập nhật tiến độ đều đặn, hữu ích và dễ theo dõi.",
    "The review helped me spot when to level and how to manage my economy.": "Phần đánh giá giúp tôi nhận biết thời điểm lên cấp và cách quản lý kinh tế.",
    "A straightforward experience with useful checkpoints along the way.": "Trải nghiệm đơn giản, với các mốc theo dõi hữu ích trong suốt quá trình.",
    "I could see steady progress and always knew what my next goal was.": "Tôi thấy tiến độ ổn định và luôn biết mục tiêu tiếp theo của mình.",
    "The advice was specific to my games and made my practice feel more focused.": "Lời khuyên phù hợp với các trận đấu của tôi và giúp buổi luyện tập tập trung hơn.",
    "The match summaries made it easier to notice patterns in my decision making.": "Tóm tắt trận đấu giúp tôi dễ nhận ra các khuôn mẫu trong cách đưa ra quyết định.",
  },
  zh: {
    "The match-by-match updates are exactly what I wanted. Everything is easy to follow.": "逐场更新正是我想要的，所有进度都一目了然。",
    "Clean experience from the first click. Having a clear plan made all the difference.": "从第一次点击开始，体验就很清晰。明确的计划带来了很大帮助。",
    "The coaching feedback helped me understand my mistakes, not just my score.": "教练的反馈让我看清自己的失误，而不只是关注分数。",
    "Finally, a dashboard that keeps the useful information in one place.": "终于有一个控制面板，把有用的信息都集中在一起。",
    "The weekly goals feel manageable, and I can tell what to work on next.": "每周目标切实可行，我也清楚接下来该练习什么。",
    "I liked being able to review each step and see how my progress changed.": "我喜欢逐步回顾过程并查看进度变化。",
    "Simple to follow, with useful feedback that I could put into practice.": "流程简单易懂，反馈也很实用，可以直接应用。",
    "The plan gave me a clearer routine and made each session more focused.": "计划让我有了更清晰的训练安排，也让每次练习更专注。",
    "I appreciate having the notes and next steps gathered in one place.": "我很喜欢把笔记和后续步骤集中在同一个地方。",
    "The feedback was clear and practical, so I knew what to try in my next match.": "反馈清晰且实用，让我知道下一场比赛该尝试什么。",
    "The weekly plan helped me focus on a few changes instead of fixing everything at once.": "每周计划让我专注改进几个方面，而不是一次解决所有问题。",
    "Clear notes after each session made it easy to track what I was improving.": "每次训练后的清晰记录让我轻松跟进自己的进步。",
    "The comp suggestions were easy to understand and gave me a better game plan.": "阵容建议简单易懂，也让我有了更好的对局计划。",
    "I liked having practical feedback I could use right away in my next matches.": "我喜欢这些实用反馈，可以马上用在接下来的比赛中。",
    "The progress updates were consistent, helpful, and simple to follow.": "进度更新稳定、实用，而且容易查看。",
    "The review helped me spot when to level and how to manage my economy.": "复盘帮我掌握了升级时机和经济管理方法。",
    "A straightforward experience with useful checkpoints along the way.": "体验简单直接，过程中还有实用的进度节点。",
    "I could see steady progress and always knew what my next goal was.": "我能看到稳定的进步，也始终清楚下一个目标是什么。",
    "The advice was specific to my games and made my practice feel more focused.": "建议结合了我的对局情况，让练习更有针对性。",
    "The match summaries made it easier to notice patterns in my decision making.": "比赛总结让我更容易发现自己决策中的规律。",
  },
  ko: {
    "The match-by-match updates are exactly what I wanted. Everything is easy to follow.": "경기별 업데이트가 딱 원하던 기능이에요. 모든 내용을 쉽게 확인할 수 있습니다.",
    "Clean experience from the first click. Having a clear plan made all the difference.": "첫 클릭부터 깔끔한 경험이었어요. 명확한 계획이 큰 차이를 만들었습니다.",
    "The coaching feedback helped me understand my mistakes, not just my score.": "코칭 피드백 덕분에 점수뿐 아니라 실수도 이해할 수 있었습니다.",
    "Finally, a dashboard that keeps the useful information in one place.": "유용한 정보를 한곳에 모아둔 대시보드가 드디어 생겼네요.",
    "The weekly goals feel manageable, and I can tell what to work on next.": "주간 목표가 부담스럽지 않고 다음에 연습할 부분도 알 수 있어요.",
    "I liked being able to review each step and see how my progress changed.": "단계별로 돌아보고 진행 상황이 어떻게 달라졌는지 볼 수 있어 좋았습니다.",
    "Simple to follow, with useful feedback that I could put into practice.": "따라 하기 쉽고 바로 적용할 수 있는 유용한 피드백이 있습니다.",
    "The plan gave me a clearer routine and made each session more focused.": "계획 덕분에 루틴이 명확해지고 매 세션에 더 집중할 수 있었습니다.",
    "I appreciate having the notes and next steps gathered in one place.": "메모와 다음 단계가 한곳에 정리되어 있어 편리합니다.",
    "The feedback was clear and practical, so I knew what to try in my next match.": "피드백이 명확하고 실용적이라 다음 경기에서 무엇을 시도할지 알 수 있었습니다.",
    "The weekly plan helped me focus on a few changes instead of fixing everything at once.": "주간 계획 덕분에 모든 것을 한 번에 고치려 하지 않고 몇 가지에 집중할 수 있었습니다.",
    "Clear notes after each session made it easy to track what I was improving.": "세션 후 정리된 메모 덕분에 어떤 점이 나아졌는지 쉽게 확인할 수 있었습니다.",
    "The comp suggestions were easy to understand and gave me a better game plan.": "조합 추천이 이해하기 쉽고 더 나은 게임 계획을 세우는 데 도움이 됐습니다.",
    "I liked having practical feedback I could use right away in my next matches.": "다음 경기에서 바로 활용할 수 있는 실용적인 피드백이 마음에 들었습니다.",
    "The progress updates were consistent, helpful, and simple to follow.": "진행 상황이 꾸준히 업데이트되고 유용하며 확인하기도 쉽습니다.",
    "The review helped me spot when to level and how to manage my economy.": "리뷰를 통해 레벨업 타이밍과 경제 관리 방법을 파악할 수 있었습니다.",
    "A straightforward experience with useful checkpoints along the way.": "간단한 경험과 함께 과정마다 유용한 확인 지점이 있습니다.",
    "I could see steady progress and always knew what my next goal was.": "꾸준한 성장을 확인할 수 있고 다음 목표도 항상 알 수 있었습니다.",
    "The advice was specific to my games and made my practice feel more focused.": "제 경기 상황에 맞춘 조언 덕분에 연습에 더 집중할 수 있었습니다.",
    "The match summaries made it easier to notice patterns in my decision making.": "경기 요약 덕분에 제 판단 방식의 패턴을 더 쉽게 파악할 수 있었습니다.",
  },
};

export function reviewTextFor(language: LanguageCode, review: Review) {
  const localized = localizedContent[language as keyof typeof localizedContent];
  if (localized) {
    const index = reviews.findIndex((item) => item.text === review.text);
    const reviewKey = `review${String(index + 1).padStart(2, "0")}` as keyof typeof localized.reviews;
    const translated = localized.reviews[reviewKey];
    if (translated) return translated;
  }
  return reviewTranslations[language]?.[review.text] ?? review.text;
}
