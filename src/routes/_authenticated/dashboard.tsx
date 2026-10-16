import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NAV } from "@/components/AppSidebar";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · AI Workplace Productivity Assistant" },
      { name: "description", content: "Your AI productivity tools and recent activity." },
      { property: "og:title", content: "Dashboard · AI Workplace Productivity Assistant" },
      { property: "og:description", content: "Your AI productivity tools and recent activity." },
    ],
  }),
  component: Dashboard,
});

const DESCRIPTIONS: Record<string, string> = {
  "/email": "Draft professional emails in any tone.",
  "/meeting-notes": "Turn raw notes into summary, actions and decisions.",
  "/planner": "Get a prioritized daily or weekly schedule.",
  "/chat": "Ask questions and brainstorm with AI.",
};
const KIND_LABEL: Record<string, string> = { email: "Email", notes: "Meeting notes", planner: "Planner", chat: "Chat" };

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function Dashboard() {
  const { user } = Route.useRouteContext();
  const name = (user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? user.email?.split("@")[0];
  const activity = useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const { data, error } = await supabase.from("activity").select("*").order("created_at", { ascending: false }).limit(6);
      if (error) throw error;
      return data;
    },
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <section className="bg-hero rounded-3xl border p-6 md:p-10">
        <p className="text-sm text-primary">{greeting}</p>
        <h1 className="mt-1 text-3xl font-semibold md:text-4xl">Welcome back, {name}</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Pick a tool to get started. Every AI result is fully editable, so you stay in control.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {NAV.filter((n) => n.url !== "/dashboard").map((item) => (
          <Link
            key={item.url}
            to={item.url}
            className="group rounded-2xl border bg-card p-5 transition-colors hover:border-primary/60"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <item.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <h3 className="mt-4 font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{DESCRIPTIONS[item.url]}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4 text-primary" /> Recent activity
        </h2>
        <div className="mt-4">
          {activity.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" />
            </div>
          ) : activity.isError ? (
            <p className="text-sm text-muted-foreground">Couldn't load recent activity. Try refreshing.</p>
          ) : !activity.data?.length ? (
            <p className="text-sm text-muted-foreground">No activity yet — try generating your first email.</p>
          ) : (
            <ul className="divide-y">
              {activity.data.map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-28 shrink-0 rounded-md bg-accent px-2 py-0.5 text-center text-xs text-accent-foreground">
                    {KIND_LABEL[a.kind] ?? a.kind}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{a.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
