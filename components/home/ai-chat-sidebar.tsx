"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { X, Send, Sparkles, Bot, Brain } from "lucide-react";
import { useChatStore } from "@/components/providers/chat-provider";

const STARTER_PROMPTS = [
  "Explain P/E ratio with a kirana store analogy",
  "Compare TCS vs Infosys on ROE and valuation",
  "What are the red flags in Zomato's cash flow?",
  "Build a DCF model for Reliance",
  "Screen for high ROE, low debt stocks under 20x P/E",
] as const;

export function AIChatSidebar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const { messages, currentMode, addMessage, setMode } = useChatStore();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addMessage({ role: "user", content: input, mode: currentMode, context: {} });
    setInput("");
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-20 right-4 z-40 lg:hidden glass dark:glass-dark shadow-lg"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Chat"
      >
        <Bot className="h-6 w-6 text-primary" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-16 bottom-0 z-50 w-full lg:w-96 bg-card border-l glass dark:glass-dark flex flex-col lg:relative lg:z-auto lg:top-auto lg:bottom-auto lg:h-auto"
            role="complementary"
            aria-label="AI Chat"
          >
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
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close chat">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm mb-4">Start a conversation</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {STARTER_PROMPTS.map((prompt, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto px-3 py-1.5"
                        onClick={() => {
                          addMessage({ role: "user", content: prompt, mode: currentMode, context: {} });
                          setIsOpen(false);
                        }}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.slice(-20).map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="p-4 border-t bg-card/50 backdrop-blur">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Ask ${currentMode}...`}
                  className="flex-1"
                  aria-label="Chat input"
                />
                <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send message">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </motion.aside>
        )}

        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
    </>
  );
}