import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, Output, streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

export const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
export const CHAT_MODEL = "openai/gpt-6-astra";

export function getApiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured yet. Please try again later.");
  return key;
}

export function createProvider(runIdFetch: ReturnType<typeof createLovableAiGatewayRunIdFetch>) {
  const apiKey = getApiKey();
  return createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
}

export const responsesOptions = {
  openai: {
    store: false,
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    include: ["reasoning.encrypted_content"],
  },
} as const;

/** Map gateway failures to friendly, user-facing messages. */
export function friendlyAiError(error: unknown): string {
  const status = APICallError.isInstance(error) ? error.statusCode : undefined;
  if (status === 429) return "The AI is busy right now. Please wait a moment and try again.";
  if (status === 402) return "AI credits have run out for this workspace. Please add credits to keep going.";
  if (status === 403) return "AI access is currently blocked for this workspace.";
  if (status === 400) return "That request couldn't be processed. Try shortening or rephrasing your input.";
  if (status && status >= 500) return "The AI service had a hiccup. Please try again in a moment.";
  return "Something went wrong while generating. Please try again.";
}

/** Run a structured-output call (streamed, consumed server-side). */
export async function runStructured<T>(opts: {
  instructions: string;
  prompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any;
  name: string;
}): Promise<T> {
  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createProvider(runIdFetch);
  const messages: ModelMessage[] = [{ role: "user", content: opts.prompt }];
  try {
    const result = streamText({
      model: provider.responses(CHAT_MODEL),
      instructions: opts.instructions,
      messages,
      maxRetries: 1,
      output: Output.object({ schema: opts.schema, name: opts.name }),
      providerOptions: responsesOptions,
    });
    const out = await result.output;
    if (!out) throw new Error("empty");
    return out as T;
  } catch (error) {
    console.error("AI call failed", error);
    throw new Error(friendlyAiError(error));
  }
}
