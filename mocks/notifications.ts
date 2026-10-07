import type { OrderNotification } from "@/types/operations";
import { ago } from "./orders";
export const mockNotifications: OrderNotification[] = [
  {
    id: "n1",
    title: "New order",
    detail: "#ASC-1049 was submitted",
    href: "/admin/orders/ASC-1049",
    at: ago(3),
    scope: "order.view",
  },
  {
    id: "n2",
    title: "New message",
    detail: "Mynh Dat asked for an update",
    href: "/admin/chat?order=ASC-1042",
    at: ago(2),
    scope: "chat.view",
  },
  {
    id: "n3",
    title: "Employee accepted order",
    detail: "Zen accepted #ASC-1041",
    href: "/admin/orders/ASC-1041",
    at: ago(15),
    scope: "order.view",
  },
  {
    id: "n4",
    title: "Employee declined order",
    detail: "Nova declined #ASC-1043",
    href: "/admin/orders/ASC-1043",
    at: ago(27),
    scope: "order.view",
  },
  {
    id: "n5",
    title: "Order completed",
    detail: "#ASC-1039 is complete",
    href: "/admin/orders/ASC-1039",
    at: ago(60),
    scope: "order.view",
  },
];
