import { useChatStore } from "@/components/providers/chat-provider";

export function useChat() {
  const { messages, currentMode, context, addMessage, updateMessage, setMode, setContext, clearHistory } = useChatStore();

  return {
    messages,
    currentMode,
    context,
    addMessage,
    updateMessage,
    setMode,
    setContext,
    clearHistory,
  };
}