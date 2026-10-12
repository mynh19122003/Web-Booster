export type RequestStatus = "open" | "assigned" | "resolved";
export type CustomerRequest = {
  id: string;
  subject: string;
  game: string;
  status: RequestStatus;
  customerId: string;
  customerName: string;
  employeeId: string | null;
  employeeName: string | null;
  employeeOnline: number;
  updatedAt: number;
  lastMessage: string;
};
export type SupportMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "customer" | "employee";
  text: string;
  createdAt: number;
};
