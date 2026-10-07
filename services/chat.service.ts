"use client";
import { chatService as adapter } from "./operations";
import type { ChatService } from "./contracts";
export const chatService = adapter satisfies ChatService;
