"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";
import { Bot, Brain, Send, Sparkles, Loader2, ChevronRight, X, Copy } from "lucide-react";
import { useChat } from "@/state/use-chat";
import { useStock } from "@/hooks/use-stock";

export default function ResearchPage() {
  const { messages, currentMode, context, addMessage, setMode, setContext } = useChat();
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [toolCalls, setToolCalls] = React.useState<Array<{ name: string; args: unknown; result: unknown }>>([]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);

    addMessage({ role: "user", content: userMessage, mode: currentMode, context: {} });

    try {
      // This would call the API route
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          mode: currentMode,
          context: { stock: context.stock },
        }),
      });

      const data = await response.json();
      
      if (data.blocks) {
        // Handle tool calls if any
        if (data.toolCalls) {
          setToolCalls(data.toolCalls);
        }
        
        addMessage({
          role: "assistant",
          content: data.blocks[0]?.text || data.content || "Response received",
          mode: currentMode,
          context: {},
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({
        role: "assistant",
        content: "I encountered an error. Please try again.",
        mode: currentMode,
        context: {},
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      <aside className="hidden lg:block w-96 border-l glass dark:glass-dark flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Research Context</h2>
        </div>
        {context.stock && (
          <div className="p-4 border-b">
            <StockContextChip stock={context.stock} onRemove={() => setContext({})} />
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <QuickActionButton 
                icon={Brain} 
                label="Explain P/E ratio" 
                onClick={() => { addMessage({ role: "user", content: "Explain P/E ratio with a real-world analogy", mode: "tutor", context: {} }); setMode("tutor"); }}
              />
              <QuickActionButton 
                icon={Bot} 
                label="Screen quality stocks" 
                onClick={() => { addMessage({ role: "user", content: "Screen for high ROE, low debt stocks under 20x P/E", mode: "analyst", context: {} }); setMode("analyst"); }}
              />
              <QuickActionButton 
                icon={Bot} 
                label="Build DCF model" 
                onClick={() => { addMessage({ role: "user", content: "Build a DCF model for Reliance", mode: "analyst", context: {} }); setMode("analyst"); }}
              />
              <QuickActionButton 
                icon={Brain} 
                label="Compare stocks" 
                onClick={() => { addMessage({ role: "user", content: "Compare TCS vs Infosys on ROE and valuation", mode: "tutor", context: {} }); setMode("tutor"); }}
              />
            </div>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col">
        <div className="p-4 lg:p-6 border-b bg-card/50 backdrop-blur">
          <Tabs value={currentMode} onValueChange={(val) => setMode(val as "tutor" | "analyst")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="tutor" className="gap-2 py-2">
                <Brain className="h-4 w-4" /> Tutor
              </TabsTrigger>
              <TabsTrigger value="analyst" className="gap-2 py-2">
                <Bot className="h-4 w-4" /> Analyst
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {context.stock && (
            <StockContextChip 
              stock={context.stock} 
              onRemove={() => setContext({})} 
              className="mt-4 inline-flex"
            />
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-[60vh] text-center"
              >
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Welcome to Research</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {currentMode === "tutor" 
                    ? "Ask me anything about financial concepts — I'll explain with real-world analogies"
                    : "Give me a research task — I'll screen stocks, build models, and generate reports"}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {currentMode === "tutor" ? (
                    <>
                      <StarterPrompt onClick={() => addMessage({ role: "user", content: "Explain P/E ratio with a kirana store analogy", mode: "tutor", context: {} })}>P/E Ratio Analogy</StarterPrompt>
                      <StarterPrompt onClick={() => addMessage({ role: "user", content: "What is DCF modeling?", mode: "tutor", context: {} })}>DCF Modeling</StarterPrompt>
                      <StarterPrompt onClick={() => addMessage({ role: "user", content: "How to read a balance sheet?", mode: "tutor", context: {} })}>Balance Sheet</StarterPrompt>
                    </>
                  ) : (
                    <>
                      <StarterPrompt onClick={() => addMessage({ role: "user", content: "Screen for high ROE, low debt stocks under 20x P/E", mode: "analyst", context: {} })}>Quality Screen</StarterPrompt>
                      <StarterPrompt onClick={() => addMessage({ role: "user", content: "Build DCF for Reliance", mode: "analyst", context: {} })}>DCF for Reliance</StarterPrompt>
                      <StarterPrompt onClick={() => addMessage({ role: "user", content: "Compare TCS vs Infosys", mode: "analyst", context: {} })}>TCS vs Infosys</StarterPrompt>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
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

            {toolCalls.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                {toolCalls.map((tc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-lg bg-muted/50 border border-border/50 text-sm font-mono"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Tool: {tc.name}</span>
                    </div>
                    <pre className="text-xs overflow-auto max-h-32">{JSON.stringify(tc.result, null, 2)}</pre>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <div className="h-4" />
          </div>
        </div>

        <div className="border-t p-4 lg:p-6 bg-card/50 backdrop-blur">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask ${currentMode}...`}
              className="flex-1"
              disabled={isLoading}
              aria-label="Research query"
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} aria-label="Send message">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

function StockContextChip({
  stock,
  onRemove,
  className,
}: {
  stock: string | { symbol: string; name?: string };
  onRemove: () => void;
  className?: string;
}) {
  const symbol = typeof stock === "string" ? stock : stock.symbol;
  const name = typeof stock === "string" ? "" : stock.name;
  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm", className)}>
      <span className="font-mono">{symbol.replace(".NS", "").replace(".BO", "")}</span>
      {name && <span className="text-xs text-muted-foreground">{name}</span>}
      <button onClick={onRemove} className="ml-1 p-1 hover:bg-primary/20 rounded" aria-label="Remove context">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 p-3 rounded-lg text-left hover:bg-accent/50 transition-colors group"
    >
      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function StarterPrompt({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg border border-input bg-background text-xs hover:bg-accent transition-colors"
    >
      {children}
    </button>
  );
}