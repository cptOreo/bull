import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Block, Locale, ProfileField } from "@/lib/engine/types";
import { useBull } from "@/lib/state/use-bull";
import type { ChatMessage } from "@/lib/state/store";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";
import { DisclaimerBanner } from "./disclaimer-banner";
import { StarterPrompts } from "./starter-prompts";
import { MessageBubble } from "./message-bubble";

export interface ChatContainerProps {
  messages?: ChatMessage[];
  onSendMessage?: (text: string) => Promise<void> | void;
  isLoading?: boolean;
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
  onSelectIntakeOption?: (field: ProfileField, value: string) => void;
  className?: string;
}

const MAX_CHARACTERS = 500;

export function ChatContainer({
  messages: controlledMessages,
  onSendMessage,
  isLoading: controlledIsLoading = false,
  locale: controlledLocale,
  onLocaleChange,
  onSelectIntakeOption: controlledOnSelectIntakeOption,
  className,
}: ChatContainerProps) {
  const store = useBull();

  // Use props if provided; otherwise fallback to store
  const messages = controlledMessages ?? store.chatMessages;
  const locale = controlledLocale ?? store.locale ?? "en";
  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  const [input, setInput] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const isLoading = controlledIsLoading || internalLoading;

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on message change or loading state change
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isLoading, scrollToBottom]);

  // Adjust textarea height automatically
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, MAX_CHARACTERS);
    setInput(val);

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  };

  const handleSend = async (textToSend?: string) => {
    const content = (textToSend ?? input).trim();
    if (!content || isLoading) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (onSendMessage) {
      try {
        setInternalLoading(true);
        await onSendMessage(content);
      } finally {
        setInternalLoading(false);
      }
    } else {
      // Direct store dispatch if onSendMessage was not passed
      store.addChatMessage({
        sender: "user",
        text: content,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectIntakeOption = (field: ProfileField, value: string) => {
    if (controlledOnSelectIntakeOption) {
      controlledOnSelectIntakeOption(field, value);
    } else {
      store.setProfileField(field, value as never, false);
      handleSend(`${field}: ${value}`);
    }
  };

  const quickActions = [
    { id: "find-stocks", label: copy.chat.starterPrompt1, prompt: copy.chat.starterPrompt1 },
    { id: "itc-debt", label: copy.chat.starterPrompt2, prompt: copy.chat.starterPrompt2 },
    { id: "tcs-infy", label: copy.chat.starterPrompt3, prompt: copy.chat.starterPrompt3 },
  ];

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden bg-background text-foreground",
        className
      )}
    >
      {/* SEBI Educational Disclaimer Banner */}
      <DisclaimerBanner locale={locale} />

      {/* Messages Stream */}
      <div
        ref={scrollContainerRef}
        role="log"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-4 sm:px-6"
      >
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-6 w-6 text-zinc-900 dark:text-zinc-100"
                >
                  <path d="M4.5 4.5c1.5 2 3.5 3.5 6 3.5h3c2.5 0 4.5-1.5 6-3.5.5-.6 1.5-.2 1.5.6v2.4c0 3-2 5.5-5 6v2c0 2.2-1.8 4-4 4s-4-1.8-4-4v-2c-3-.5-5-3-5-6V5.1c0-.8 1-1.2 1.5-.6z" />
                </svg>
              </div>

              <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {copy.common.appName}
              </h2>
              <p className="mt-1 max-w-md text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {copy.chat.emptyStateText}
              </p>

              <div className="mt-8 w-full max-w-lg text-left">
                <StarterPrompts locale={locale} onSelectPrompt={(p) => handleSend(p)} />
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                sender={message.sender}
                text={message.text}
                blocks={message.blocks as Block[]}
                followUps={message.followUps}
                timestamp={message.timestamp}
                locale={locale}
                onSelectOption={(val) => handleSend(val)}
                onSelectIntakeOption={handleSelectIntakeOption}
              />
            ))
          )}

          {/* Thinking / Engine Response Loading Indicator */}
          {isLoading && (
            <div
              aria-label="Bull is thinking"
              className="flex items-center gap-3 py-2 text-zinc-400 animate-pulse"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-ping" />
              </div>
              <div className="flex items-center gap-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                <span>{copy.common.loading}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} aria-hidden="true" className="h-2" />
        </div>
      </div>

      {/* Quick Action Pill Bar */}
      <div className="border-t border-zinc-100 bg-zinc-50/50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto flex max-w-3xl items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <span className="shrink-0 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Quick:
          </span>
          {quickActions.map((qa) => (
            <button
              key={qa.id}
              type="button"
              disabled={isLoading}
              onClick={() => handleSend(qa.prompt)}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-700 shadow-2xs transition-all",
                "hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900",
                "dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
                "disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              )}
            >
              {qa.label}
            </button>
          ))}

          {onLocaleChange && (
            <button
              type="button"
              onClick={() => onLocaleChange(locale === "en" ? "hi-en" : "en")}
              className="ml-auto inline-flex shrink-0 items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-mono font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
            >
              🌐 {locale === "en" ? "Hinglish" : "English"}
            </button>
          )}
        </div>
      </div>

      {/* Input Composer Bar */}
      <div className="border-t border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-end gap-2 rounded-xl border border-zinc-200 bg-zinc-50/70 p-2 shadow-2xs transition-all focus-within:border-zinc-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-zinc-400/20 dark:border-zinc-800 dark:bg-zinc-850/60 dark:focus-within:border-zinc-600 dark:focus-within:bg-zinc-900"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              disabled={isLoading}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={copy.chat.composerPlaceholder}
              className="max-h-40 min-h-[38px] w-full resize-none bg-transparent px-2 py-1.5 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />

            <div className="flex shrink-0 items-center gap-1.5 pb-0.5">
              {input.length > 0 && (
                <span
                  className={cn(
                    "font-mono text-[11px] tabular-nums",
                    input.length >= MAX_CHARACTERS ? "text-rose-500 font-bold" : "text-zinc-400 dark:text-zinc-500"
                  )}
                >
                  {input.length}/{MAX_CHARACTERS}
                </span>
              )}

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label={copy.chat.sendButton}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white transition-all shadow-xs",
                  "hover:bg-zinc-800 active:scale-95",
                  "dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
                  "disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer"
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </form>

          <p className="mt-1.5 text-center text-[11px] text-zinc-400">
            {copy.disclaimers.educationNote}
          </p>
        </div>
      </div>
    </div>
  );
}
