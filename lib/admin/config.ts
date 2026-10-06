import type { Permission } from "@/types/admin";
export const permissionOptions: {
  value: Permission;
  label: string;
  description: string;
}[] = [
  {
    value: "employee.application.view",
    label: "View applications",
    description: "Access candidate profiles and application history.",
  },
  {
    value: "employee.application.approve",
    label: "Approve applications",
    description: "Approve candidates and provision employee accounts.",
  },
  {
    value: "employee.application.reject",
    label: "Reject applications",
    description: "Decline applications with a review reason.",
  },
];
permissionOptions.push(
  {
    value: "order.view",
    label: "View orders",
    description: "Read order details and assignment activity.",
  },
  {
    value: "order.assign",
    label: "Assign orders",
    description: "Offer and reassign orders to employees.",
  },
  {
    value: "order.update",
    label: "Update orders",
    description: "Review, pause, complete and update progress.",
  },
  {
    value: "order.cancel",
    label: "Cancel orders",
    description: "Cancel an order after confirmation.",
  },
  {
    value: "chat.view",
    label: "View conversations",
    description: "Read customer conversations and internal notes.",
  },
  {
    value: "chat.send",
    label: "Send messages",
    description: "Reply, add internal notes and archive conversations.",
  },
);
export const allPermissions = permissionOptions.map((p) => p.value);
export const adminNav = [
  { href: "/admin", label: "Dashboard", icon: "overview", group: "" },
  {
    href: "/admin/orders",
    label: "Orders",
    icon: "orders",
    group: "ORDERS",
    permission: "order.view" as Permission,
  },
  {
    href: "/admin/incoming-orders",
    label: "Incoming orders",
    icon: "incoming",
    group: "ORDERS",
    permission: "order.view" as Permission,
  },
  {
    href: "/admin/assignments",
    label: "Assignments",
    icon: "assignments",
    group: "ORDERS",
    permission: "order.view" as Permission,
  },
  {
    href: "/admin/staff",
    label: "Staff members",
    icon: "staff",
    owner: true,
    group: "TEAM",
  },
  {
    href: "/admin/staff/invitations",
    label: "Invitations",
    icon: "invitations",
    owner: true,
    group: "TEAM",
  },
  {
    href: "/admin/employee-applications",
    label: "Applications",
    icon: "applications",
    permission: "employee.application.view" as Permission,
    group: "TEAM",
  },
  {
    href: "/admin/chat",
    label: "Chat",
    icon: "chat",
    group: "COMMUNICATION",
    permission: "chat.view" as Permission,
  },
  {
    href: "/admin/security",
    label: "Security",
    icon: "security",
    group: "SECURITY",
  },
  {
    href: "/admin/profile",
    label: "My profile",
    icon: "profile",
    group: "SECURITY",
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
