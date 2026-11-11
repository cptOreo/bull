"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Send, Loader2, Sparkles, Bot, Brain, HelpCircle, Languages } from "lucide-react";
import { useChat } from "@/state/use-chat";
import { ToolInvocation } from "./tool-invocation";
import { CitationList, InlineCitations } from "@/components/chat/citation";
import { ContextualFollowUps } from "./contextual-follow-ups";

const STARTER_PROMPTS_TUTOR = [
  "Explain P/E ratio in plain English",
  "Socratic Challenge: What happens if margins drop 2%?",
  "How to read a balance sheet and spot red flags?",
  "What is the difference between ROCE and ROE?",
];

const STARTER_PROMPTS_ANALYST = [
  "Screen for high ROE, low debt stocks under 20x P/E",
  "Build a DCF model for Reliance",
  "Compare TCS vs Infosys on ROE and valuation",
  "Analyze Zomato's cash flow red flags",
];

interface ChatPanelProps {
  defaultMode?: "tutor" | "analyst";
  context?: { stock?: string; page?: string };
  className?: string;
}

export function ChatPanel({ defaultMode = "tutor", context, className }: ChatPanelProps) {
  const { messages, currentMode, addMessage, setMode } = useChat();
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [locale, setLocale] = React.useState<"en" | "hi-en">("en");

  const handleSend = async (e: React.FormEvent, customText?: string) => {
    if (e && e.preventDefault) e.preventDefault();
    const userMessage = (customText || input).trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setIsLoading(true);

    addMessage({
      role: "user",
      content: userMessage,
      mode: currentMode,
      context: context || {},
    });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          mode: currentMode,
          locale: locale,
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
          citations: data.citations,
          toolCalls: data.toolCalls,
        });
      } else if (data.content) {
        addMessage({
          role: "assistant",
          content: data.content,
          mode: currentMode,
          context: context || {},
          citations: data.citations,
          toolCalls: data.toolCalls,
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
          <span className="font-semibold text-sm">Financial AI Assistant</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Language Toggle */}
          <button
            onClick={() => setLocale(locale === "en" ? "hi-en" : "en")}
            title="Toggle English / Hinglish"
            className="px-2 py-1 rounded text-[11px] font-mono border border-border/80 text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <Languages className="h-3 w-3" />
            <span>{locale === "en" ? "EN" : "Hinglish"}</span>
          </button>

          <Button
            variant={currentMode === "tutor" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("tutor")}
            className="text-xs h-7 px-2.5"
          >
            <Brain className="h-3 w-3 mr-1" /> Tutor
          </Button>
          <Button
            variant={currentMode === "analyst" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("analyst")}
            className="text-xs h-7 px-2.5"
          >
            <Bot className="h-3 w-3 mr-1" /> Analyst
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" role="log" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="flex flex-col items-center justify-center h-full text-center py-8"
            >
              <Bot className="h-10 w-10 mb-3 opacity-40 text-primary" />
              <p className="text-sm font-semibold text-foreground mb-1">Interactive Financial Tutor</p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                Ask about any stock, valuation multiple, balance sheet item, or request a Socratic problem.
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {starterPrompts.map((prompt, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto px-2.5 py-1.5 text-left"
                    onClick={(e) => handleSend(e, prompt)}
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
                  className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "")}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}
                  >
                    {msg.role === "user" ? <Brain className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[82%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/80 border border-border/40 rounded-tl-sm text-foreground"
                    )}
                  >
                    <InlineCitations citations={msg.citations || []} text={msg.content} />
                    {msg.toolCalls && msg.toolCalls.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {msg.toolCalls.map((tc, idx) => (
                          <ToolInvocation
                            key={idx}
                            name={tc.name}
                            args={tc.args}
                            result={tc.result}
                            id={`tool_${msg.id}_${idx}`}
                          />
                        ))}
                      </div>
                    ) : null}
                    {msg.citations && msg.citations.length > 0 ? (
                      <CitationList citations={msg.citations} />
                    ) : null}
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
              className="flex items-center gap-2 py-2 text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs font-mono">Tutor reasoning...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t p-3 bg-card/50 backdrop-blur space-y-2">
        <ContextualFollowUps
          mode={currentMode}
          stock={context?.stock}
          concept={messages[messages.length - 1]?.content}
          onSelect={(prompt) => handleSend({ preventDefault: () => {} } as React.FormEvent, prompt)}
          context={context?.page}
        />

        <form onSubmit={handleSend} className="pt-1">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${currentMode === "tutor" ? "tutor a financial question" : "analyst to screen or model"}...`}
              className="flex-1 text-xs h-9"
              disabled={isLoading}
              aria-label="Chat input"
            />
            <Button type="submit" size="sm" disabled={!input.trim() || isLoading} className="h-9 px-3" aria-label="Send message">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
