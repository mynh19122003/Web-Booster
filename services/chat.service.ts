"use client";
import { chatService as mock } from "./operations";
import type { ChatService } from "./contracts";
export const chatService = mock satisfies ChatService;
