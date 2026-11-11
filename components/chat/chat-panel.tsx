"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Send, X, Loader2, Sparkles, Bot, Brain, ChevronRight } from "lucide-react";
import { useChat } from "@/state/use-chat";
import { useStock } from "@/hooks/use-stock";

interface ChatPanelProps {
  defaultMode?: "tutor" | "analyst";
  context?: { stock?: string; page?: string };
  className?: string;
}

const STARTER_PROMPTS_TUTOR = [
  "Explain P/E ratio with a kirana store analogy",
  "What is DCF modeling?",
  "How to read a balance sheet?",
  "What are economic moats?",
];

const STARTER_PROMPTS_ANALYST = [
  "Screen for high ROE, low debt stocks under 20x P/E",
  "Build a DCF model for Reliance",
  "Compare TCS vs Infosys on ROE and valuation",
  "Analyze Zomato's cash flow red flags",
];

export function ChatPanel({ defaultMode = "tutor", context, className }: ChatPanelProps) {
  const { messages, currentMode, addMessage, setMode } = useChat();
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);

    addMessage({ role: "user", content: userMessage, mode: currentMode, context: context || {} });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          mode: currentMode,
          context: { stock: context?.stock, page: context?.page },
        }),
      });

      const data = await response.json();
      
      if (data.blocks && data.blocks[0]?.text) {
        addMessage({
          role: "assistant",
          content: data.blocks[0].text,
          mode: currentMode,
          context: context || {},
        });
      } else if (data.content) {
        addMessage({
          role: "assistant",
          content: data.content,
          mode: currentMode,
          context: context || {},
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({
        role: "assistant",
        content: "I encountered an error. Please try again.",
        mode: currentMode,
        context: context || {},
      });
    } finally {
      setIsLoading(false);
    }
  };

  const starterPrompts = currentMode === "tutor" ? STARTER_PROMPTS_TUTOR : STARTER_PROMPTS_ANALYST;

  return (
    <div className={cn("flex flex-col h-full border-l glass dark:glass-dark", className)}>
      <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card/95 backdrop-blur z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold">AI Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={currentMode === "tutor" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("tutor")}
            className="text-xs"
          >
            <Brain className="h-3.5 w-3.5 mr-1" /> Tutor
          </Button>
          <Button
            variant={currentMode === "analyst" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("analyst")}
            className="text-xs"
          >
            <Bot className="h-3.5 w-3.5 mr-1" /> Analyst
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-sm mb-4">Start a conversation</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {STARTER_PROMPTS_TUTOR.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto px-3 py-1.5"
                    onClick={() => {
                      addMessage({ role: "user", content: prompt, mode: "tutor", context: context || {} });
                    }}
                  >
                    {prompt}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {messages.slice(-20).map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}
                  >
                    {msg.role === "user" ? <Brain className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted rounded-tl-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 py-2 text-muted-foreground"
            >
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-mono">Thinking...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="p-4 border-t bg-card/50 backdrop-blur">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${currentMode}...`}
            className="flex-1"
            disabled={isLoading}
            aria-label="Chat input"
          />
          <Button type="submit" size="icon" disabled={!input.trim() || isLoading} aria-label="Send message">
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}