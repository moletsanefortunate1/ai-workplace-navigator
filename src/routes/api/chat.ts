import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";
import { CHAT_MODEL, createProvider, friendlyAiError, responsesOptions } from "@/lib/ai/gateway.server";

function userClient(token: string) {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const json = (status: number, error: string) =>
  new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json" } });

async function handleChat(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json(401, "Please sign in to chat.");
  const supabase = userClient(token);
  const { data: userData, error: userErr } = await supabase.auth.getUser(token);
  if (userErr || !userData.user) return json(401, "Your session has expired. Please sign in again.");
  const userId = userData.user.id;

  let body: { messages?: UIMessage[]; threadId?: string };
  try {
    body = await request.json();
  } catch {
    return json(400, "Invalid request.");
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const threadId = body.threadId;
  if (!threadId || messages.length === 0) return json(400, "Invalid request.");

  const { data: thread } = await supabase.from("chat_threads").select("id,title").eq("id", threadId).maybeSingle();
  if (!thread) return json(404, "Conversation not found.");

  // Persist the latest user message.
  const last = messages[messages.length - 1];
  if (last?.role === "user") {
    const { error } = await supabase
      .from("chat_messages")
      .upsert(
        { thread_id: threadId, user_id: userId, message_id: last.id, role: "user", message: last as never },
        { onConflict: "thread_id,message_id" },
      );
    if (error) console.error("save user message failed", error);
    if (thread.title === "New conversation") {
      const text = last.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim();
      if (text) {
        await supabase.from("chat_threads").update({ title: text.slice(0, 60) }).eq("id", threadId);
        await supabase.from("activity").insert({ user_id: userId, kind: "chat", title: text.slice(0, 140) });
      }
    }
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createProvider(runIdFetch);
  const result = streamText({
    model: provider.responses(CHAT_MODEL),
    instructions:
      "You are a helpful AI workplace productivity assistant. Help professionals with emails, planning, meetings, writing and analysis. Be concise, practical and well-formatted with markdown.",
    messages: await convertToModelMessages(messages),
    abortSignal: request.signal,
    providerOptions: responsesOptions,
  });

  const response = result.toUIMessageStreamResponse({
    originalMessages: messages,
    sendReasoning: true,
    onError: (error) => friendlyAiError(error),
    onFinish: async ({ responseMessage }) => {
      if (!responseMessage?.parts?.length) return;
      const { error } = await supabase.from("chat_messages").upsert(
        {
          thread_id: threadId,
          user_id: userId,
          message_id: responseMessage.id,
          role: "assistant",
          message: responseMessage as never,
        },
        { onConflict: "thread_id,message_id" },
      );
      if (error) console.error("save assistant message failed", error);
      await supabase.from("chat_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);
    },
  });
  return withLovableAiGatewayRunIdHeader(response, runIdFetch);
}

export const Route = createFileRoute("/api/chat")({
  server: { handlers: { POST: ({ request }) => handleChat(request) } },
});
