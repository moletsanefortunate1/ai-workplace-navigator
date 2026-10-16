import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({
    meta: [
      { title: "AI Chat · Workplace AI" },
      { name: "description", content: "Chat with your AI workplace assistant." },
      { property: "og:title", content: "AI Chat · Workplace AI" },
      { property: "og:description", content: "Chat with your AI workplace assistant." },
    ],
  }),
  component: ChatIndex,
});

function ChatIndex() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const { data: existing, error: e1 } = await supabase
        .from("chat_threads").select("id").order("updated_at", { ascending: false }).limit(1);
      if (e1) return setError("Couldn't load your conversations. Please refresh.");
      let id = existing?.[0]?.id;
      if (!id) {
        const { data, error: e2 } = await supabase.from("chat_threads").insert({ user_id: user.id }).select("id").single();
        if (e2 || !data) return setError("Couldn't start a conversation. Please refresh.");
        id = data.id;
      }
      navigate({ to: "/chat/$threadId", params: { threadId: id }, replace: true });
    })();
  }, [navigate, user.id]);

  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      {error ?? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Opening chat…</>}
    </div>
  );
}
