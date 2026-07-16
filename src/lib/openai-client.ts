import OpenAI from "openai";

function sanitizeApiKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const key = raw.trim().replace(/^["']|["']$/g, "");
  return key.length > 0 ? key : undefined;
}

export function getOpenAIApiKey(): string | undefined {
  return sanitizeApiKey(process.env.OPENAI_API_KEY);
}

export function createOpenAIClient(): OpenAI | null {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
