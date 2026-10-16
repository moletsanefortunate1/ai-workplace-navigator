import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Copy, Pencil, Plus, Trash2, MessagesSquare, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageActions, MessageAction, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AiDisclaimer } from "@/components/AiDisclaimer";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "AI Chat · Workplace AI" },
      { name: "description", content: "Chat with your AI workplace assistant." },
      { property: "og:title", content: "AI Chat · Workplace AI" },
      { property: "og:description", content: "Chat with your AI workplace assistant." },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const threads = useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_threads").select("id,title,updated_at").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const messages = useQuery({
    queryKey: ["messages", threadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("chat_messages").select("message").eq("thread_id", threadId).order("created_at");
      if (error) throw error;
      return data.map((r) => r.message as unknown as UIMessage);
    },
    staleTime: Infinity,
  });

  async function newThread() {
    const { data, error } = await supabase.from("chat_threads").insert({ user_id: user.id }).select("id").single();
    if (error || !data) return toast.error("Couldn't start a new conversation.");
    await qc.invalidateQueries({ queryKey: ["threads"] });
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  }

  async function deleteThread(id: string) {
    const { error } = await supabase.from("chat_threads").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete conversation.");
    await qc.invalidateQueries({ queryKey: ["threads"] });
    if (id === threadId) navigate({ to: "/chat" });
  }

  return (
    <div className="grid h-[calc(100dvh-11rem)] min-h-[480px] gap-4 md:grid-cols-[15rem_1fr]">
      <aside className="hidden flex-col rounded-2xl border bg-card p-3 md:flex">
        <Button onClick={newThread} className="mb-3 w-full"><Plus /> New chat</Button>
        <div className="-mx-1 flex-1 space-y-1 overflow-y-auto px-1">
          {threads.data?.map((t) => (
            <div key={t.id} className={cn("group flex items-center gap-1 rounded-lg pr-1 text-sm", t.id === threadId ? "bg-accent text-accent-foreground" : "hover:bg-muted")}>
              <Link to="/chat/$threadId" params={{ threadId: t.id }} className="min-w-0 flex-1 truncate px-3 py-2">{t.title}</Link>
              <button aria-label="Delete conversation" onClick={() => deleteThread(t.id)} className="rounded p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </aside>
      <section className="flex min-h-0 flex-col rounded-2xl border bg-card">
        <div className="flex items-center justify-between border-b px-4 py-2.5 md:hidden">
          <span className="truncate text-sm font-medium">{threads.data?.find((t) => t.id === threadId)?.title ?? "Chat"}</span>
          <Button size="sm" variant="outline" onClick={newThread}><Plus /> New</Button>
        </div>
        {messages.isLoading ? (
          <div className="space-y-3 p-6"><Skeleton className="h-10 w-2/3" /><Skeleton className="ml-auto h-10 w-1/2" /></div>
        ) : messages.isError ? (
          <p className="p-6 text-sm text-muted-foreground">Couldn't load this conversation. Try refreshing.</p>
        ) : (
          <ChatWindow key={threadId} threadId={threadId} initialMessages={messages.data ?? []} onActivity={() => qc.invalidateQueries({ queryKey: ["threads"] })} />
        )}
      </section>
    </div>
  );
}

function ChatWindow({ threadId, initialMessages, onActivity }: { threadId: string; initialMessages: UIMessage[]; onActivity: () => void }) {
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (err) => {
      let msg = err.message;
      try { msg = JSON.parse(msg).error ?? msg; } catch { /* plain text */ }
      toast.error(msg || "Couldn't reach the assistant. Check your connection and try again.");
    },
    onFinish: () => onActivity(),
  });

  const busy = status === "submitted" || status === "streaming";
  useEffect(() => { if (!busy) textareaRef.current?.focus(); }, [busy]);

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    sendMessage({ text });
    setInput("");
    setTimeout(onActivity, 1500);
  }

  async function saveEdit() {
    if (!editing) return;
    const next = messages.map((m) => (m.id === editing.id ? { ...m, parts: [{ type: "text" as const, text: editing.text }] } : m));
    setMessages(next);
    const updated = next.find((m) => m.id === editing.id);
    const { error } = await supabase.from("chat_messages").update({ message: updated as never }).eq("thread_id", threadId).eq("message_id", editing.id);
    if (error) toast.error("Couldn't save your edit.");
    else toast.success("Response updated");
    setEditing(null);
  }

  const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

  return (
    <>
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<img src={logo} alt="" width={56} height={56} className="h-14 w-14" />}
              title="How can I help you today?"
              description="Ask me to draft a message, brainstorm ideas, explain a concept or plan your work."
            />
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-transparent"}>
                  {editing?.id === m.id ? (
                    <div className="w-full min-w-[min(36rem,80vw)] space-y-2">
                      <Textarea rows={8} value={editing.text} onChange={(e) => setEditing({ ...editing, text: e.target.value })} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit}><Check /> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X /> Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    m.parts.map((p, i) =>
                      p.type === "text" ? (
                        m.role === "user" ? <p key={i} className="whitespace-pre-wrap">{p.text}</p> : <MessageResponse key={i}>{p.text}</MessageResponse>
                      ) : null,
                    )
                  )}
                </MessageContent>
                {m.role === "assistant" && editing?.id !== m.id && !(busy && m.id === messages[messages.length - 1]?.id) && textOf(m) && (
                  <div className="space-y-1">
                    <MessageActions>
                      <MessageAction tooltip="Copy" label="Copy" onClick={() => { navigator.clipboard.writeText(textOf(m)); toast.success("Copied"); }}>
                        <Copy className="h-3.5 w-3.5" />
                      </MessageAction>
                      <MessageAction tooltip="Edit" label="Edit" onClick={() => setEditing({ id: m.id, text: textOf(m) })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </MessageAction>
                    </MessageActions>
                    <AiDisclaimer />
                  </div>
                )}
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent className="bg-transparent"><Shimmer>Thinking…</Shimmer></MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="border-t p-3">
        <PromptInput onSubmit={submit} className="mx-auto max-w-3xl">
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message your assistant…"
            autoFocus
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} disabled={!busy && !input.trim()} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </>
  );
}

export { MessagesSquare };
