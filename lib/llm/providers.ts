import { GoogleGenerativeAI } from "@google/generative-ai";
import { Groq } from "groq-sdk";
import { OpenAI } from "openai";

export type LLMProvider = "gemini" | "groq" | "openrouter" | "none";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCalls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  toolCallId?: string;
  name?: string;
}

export interface LLMResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface LLMTool {
  type?: "function";
  function?: {
    name: string;
    description?: string;
    parameters?: unknown;
  };
  name?: string;
  description?: string;
  parameters?: unknown;
}

export interface LLMProviderConfig {
  name: LLMProvider;
  generate: (messages: LLMMessage[], tools?: LLMTool[]) => Promise<LLMResponse>;
  supportsTools: boolean;
  maxTokens: number;
  contextWindow: number;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

function getGeminiProvider(): LLMProviderConfig | null {
  if (!GEMINI_API_KEY) return null;
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  return {
    name: "gemini",
    supportsTools: true,
    maxTokens: 8192,
    contextWindow: 1000000,
    async generate(messages) {
      const preferredModel = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
      const modelsToTry = [preferredModel, "gemini-3.6-flash", "gemini-3.5-flash"];
      const systemMessage = messages.find((m) => m.role === "system");
      const nonSystemMessages = messages.filter((m) => m.role !== "system");

      if (nonSystemMessages.length === 0) {
        return { content: "" };
      }

      const history = nonSystemMessages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const lastMessage = nonSystemMessages[nonSystemMessages.length - 1];

      let lastError: unknown;
      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemMessage?.content,
            generationConfig: {
              temperature: 0.2,
            },
          });

          const chat = model.startChat({ history });
          const result = await chat.sendMessage(lastMessage.content);

          return {
            content: result.response.text(),
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          };
        } catch (error) {
          lastError = error;
          const msg = error instanceof Error ? error.message : String(error);
          if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("503") || msg.includes("404")) {
            console.warn(`[Gemini] ${modelName} unavailable (${msg.slice(0, 80)}), trying fallback...`);
            continue;
          }
          break;
        }
      }

      console.error("Gemini generation error:", lastError);
      const lastUser = messages.filter((m) => m.role === "user").pop();
      return {
        content: `Unable to reach Gemini right now: ${lastError instanceof Error ? lastError.message : "Unknown error"}. Query was: "${lastUser?.content || ""}".`,
      };
    },
  };
}

function getGroqProvider(): LLMProviderConfig | null {
  if (!GROQ_API_KEY) return null;
  const groq = new Groq({ apiKey: GROQ_API_KEY });

  return {
    name: "groq",
    supportsTools: true,
    maxTokens: 8192,
    contextWindow: 131072,
    async generate(messages, tools) {
      const formattedTools = tools?.map((t) =>
        t.function ? { type: "function" as const, function: t.function } : {
          type: "function" as const,
          function: { name: t.name || "", description: t.description, parameters: t.parameters as Record<string, unknown> }
        }
      );
      const formattedMessages = messages.map((m) => {
        if (m.role === "tool") {
          return {
            role: "tool" as const,
            content: m.content,
            tool_call_id: m.toolCallId || "call_default",
          };
        }
        if (m.role === "assistant") {
          return {
            role: "assistant" as const,
            content: m.content,
          };
        }
        if (m.role === "system") {
          return {
            role: "system" as const,
            content: m.content,
          };
        }
        return {
          role: "user" as const,
          content: m.content,
        };
      });
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile",
        messages: formattedMessages,
        tools: formattedTools as Parameters<typeof groq.chat.completions.create>[0]["tools"],
        tool_choice: "auto",
        max_tokens: 4096,
        temperature: 0.1,
      });
      return {
        content: completion.choices[0]?.message?.content || "",
        toolCalls: completion.choices[0]?.message?.tool_calls
          ?.filter((tc): tc is typeof tc & { function: { name: string; arguments: string } } => "function" in tc && !!tc.function)
          .map(tc => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.function.name, arguments: tc.function.arguments },
          })),
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };
    },
  };
}

function getOpenRouterProvider(): LLMProviderConfig | null {
  if (!OPENROUTER_API_KEY) return null;
  const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
    defaultHeaders: { "HTTP-Referer": "https://bull.app", "X-Title": "Bull" },
  });

  return {
    name: "openrouter",
    supportsTools: true,
    maxTokens: 4096,
    contextWindow: 128000,
    async generate(messages, tools) {
      const formattedTools = tools?.map((t) =>
        t.function ? { type: "function" as const, function: t.function } : {
          type: "function" as const,
          function: { name: t.name || "", description: t.description, parameters: t.parameters as Record<string, unknown> }
        }
      );
      const formattedMessages = messages.map((m) => {
        if (m.role === "tool") {
          return {
            role: "tool" as const,
            content: m.content,
            tool_call_id: m.toolCallId || "call_default",
          };
        }
        if (m.role === "assistant") {
          return {
            role: "assistant" as const,
            content: m.content,
          };
        }
        if (m.role === "system") {
          return {
            role: "system" as const,
            content: m.content,
          };
        }
        return {
          role: "user" as const,
          content: m.content,
        };
      });
      const completion = await openrouter.chat.completions.create({
        model: "meta-llama/llama-3.1-70b-instruct:free",
        messages: formattedMessages,
        tools: formattedTools as Parameters<typeof openrouter.chat.completions.create>[0]["tools"],
        tool_choice: "auto",
        max_tokens: 4096,
      });
      return {
        content: completion.choices[0]?.message?.content || "",
        toolCalls: completion.choices[0]?.message?.tool_calls
          ?.filter((tc): tc is typeof tc & { function: { name: string; arguments: string } } => "function" in tc && !!tc.function)
          .map(tc => ({
            id: tc.id,
            type: "function" as const,
            function: { name: tc.function.name, arguments: tc.function.arguments },
          })),
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };
    },
  };
}

function getNullProvider(): LLMProviderConfig {
  return {
    name: "none",
    supportsTools: false,
    maxTokens: 0,
    contextWindow: 0,
    async generate(messages) {
      const lastUser = messages.filter(m => m.role === "user").pop();
      return {
        content: lastUser
          ? `I'm running in template mode (no API key). You asked: "${lastUser.content}". 
             Please add GEMINI_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY to enable AI responses.`
          : "No message provided",
      };
    },
  };
}

const PROVIDER_PRIORITY: (() => LLMProviderConfig | null)[] = [
  getGeminiProvider,
  getGroqProvider,
  getOpenRouterProvider,
];

export function getActiveProvider(): LLMProviderConfig {
  for (const getProvider of PROVIDER_PRIORITY) {
    const provider = getProvider();
    if (provider) return provider;
  }
  return getNullProvider();
}

export function getProviderName(): LLMProvider {
  return getActiveProvider().name;
}