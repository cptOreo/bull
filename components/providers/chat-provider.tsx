"use client";

import * as React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "tool";
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
  mode: "tutor" | "analyst";
  context?: { stock?: string; page?: string };
}

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  status: "pending" | "completed" | "error";
  result?: unknown;
}

interface ToolResult {
  toolCallId: string;
  name: string;
  result: unknown;
  error?: string;
}

interface ChatState {
  messages: ChatMessage[];
  currentMode: "tutor" | "analyst";
  context: { stock?: string; page?: string };
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setMode: (mode: "tutor" | "analyst") => void;
  setContext: (context: { stock?: string; page?: string }) => void;
  clearHistory: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      currentMode: "tutor",
      context: {},
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...message, id: crypto.randomUUID(), timestamp: Date.now() },
          ],
        })),
      updateMessage: (id, updates) =>
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      setMode: (mode) => set({ currentMode: mode }),
      setContext: (context) => set({ context }),
      clearHistory: () => set({ messages: [] }),
    }),
    { name: "bull-chat-history", partialize: (state) => ({ messages: state.messages.slice(-50) }) }
  )
);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}