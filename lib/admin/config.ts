import type { Permission } from "@/types/admin";
export const permissionOptions: {
  value: Permission;
  label: string;
  description: string;
}[] = [

  {
    value: "order.view",
    label: "Xem đơn hàng",
    description: "Xem chi tiết đơn và hoạt động phân công.",
  },
  {
    value: "order.assign",
    label: "Phân công đơn",
    description: "Gửi đề nghị và phân công lại đơn cho nhân sự.",
  },
  {
    value: "order.update",
    label: "Cập nhật đơn hàng",
    description: "Xác nhận, tạm dừng, hoàn thành và cập nhật tiến độ.",
  },
  {
    value: "order.cancel",
    label: "Hủy đơn hàng",
    description: "Hủy đơn sau khi xác nhận.",
  },
  {
    value: "chat.view",
    label: "Xem cuộc trò chuyện",
    description: "Xem trò chuyện khách hàng và ghi chú nội bộ.",
  },
  {
    value: "chat.send",
    label: "Gửi tin nhắn",
    description: "Trả lời, thêm ghi chú nội bộ và lưu trữ trò chuyện.",
  },
];
export const allPermissions = permissionOptions.map((p) => p.value);
export const adminNav = [
  { href: "/admin", label: "Tổng quan", icon: "overview", group: "" },
  {
    href: "/admin/orders",
    label: "Đơn hàng",
    icon: "orders",
    group: "ĐƠN HÀNG",
    permission: "order.view" as Permission,
  },
  {
    href: "/admin/incoming-orders",
    label: "Đơn mới",
    icon: "incoming",
    group: "ĐƠN HÀNG",
    permission: "order.view" as Permission,
  },
  {
    href: "/admin/assignments",
    label: "Phân công",
    icon: "assignments",
    group: "ĐƠN HÀNG",
    permission: "order.view" as Permission,
  },
  {
    href: "/admin/staff",
    label: "Nhân sự quản trị",
    icon: "staff",
    owner: true,
    group: "NHÂN SỰ",
  },
  {
    href: "/admin/staff/invitations",
    label: "Lời mời",
    icon: "invitations",
    owner: true,
    group: "NHÂN SỰ",
  },
  {
    href: "/admin/chat",
    label: "Tin nhắn",
    icon: "chat",
    group: "LIÊN LẠC",
    permission: "chat.view" as Permission,
  },
  {
    href: "/admin/security",
    label: "Bảo mật",
    icon: "security",
    group: "BẢO MẬT",
  },
  {
    href: "/admin/profile",
    label: "Hồ sơ cá nhân",
    icon: "profile",
    group: "BẢO MẬT",
  },
];
export function strongPassword(value: string) {
  return (
    value.length >= 12 &&
    value.length <= 128 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^a-zA-Z0-9]/.test(value)
  );
}
