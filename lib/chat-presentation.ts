// Keep stored identifiers and existing mock history intact; format only UI copy.
export const chatOrderLabel = (id: string) => id.replace(/^DEMO-/, "ASC-");
const legacyCopy: Record<string, string> = {
  "Đơn hàng mẫu đã hoàn tất. Cảm ơn bạn!": "Đơn hàng đã hoàn tất. Cảm ơn bạn!",
  "Đội ngũ demo đã nhận yêu cầu của bạn.": "Đội ngũ ASCEND đã nhận yêu cầu của bạn.",
  "Mình đã nhận tin nhắn mẫu của bạn. Bạn có thể tiếp tục thử giao diện tại đây.": "Mình đã nhận tin nhắn của bạn.",
  "Mình đã nhận tin nhắn của bạn. Đây là phản hồi mẫu để bạn thử chat thời gian thực.": "Mình đã nhận tin nhắn của bạn.",
};
export const chatCopy = (text: string) => legacyCopy[text] ?? text.replace(/^Đơn hàng mẫu · /, "Đơn hàng · ");
