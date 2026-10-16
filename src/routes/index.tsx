import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, NotebookPen, CalendarCheck, MessagesSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiDisclaimer } from "@/components/AiDisclaimer";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI Workplace Productivity Assistant" },
      { name: "description", content: "Draft emails, summarize meetings, plan your week and chat with AI — all in one workspace." },
      { property: "og:title", content: "AI Workplace Productivity Assistant" },
      { property: "og:description", content: "Draft emails, summarize meetings, plan your week and chat with AI — all in one workspace." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Mail, title: "Smart emails", text: "Polished emails in any tone, in seconds." },
  { icon: NotebookPen, title: "Meeting notes", text: "Summaries, owners, decisions and deadlines." },
  { icon: CalendarCheck, title: "Task planner", text: "A prioritized daily or weekly schedule." },
  { icon: MessagesSquare, title: "AI chat", text: "Ask anything about your work, any time." },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" width={32} height={32} className="h-8 w-8" />
          <span className="font-display font-semibold">Workplace AI</span>
        </div>
        <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6">
        <section className="bg-hero mt-6 rounded-3xl border px-6 py-16 text-center md:py-24">
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold md:text-6xl">
            Spend less time on busywork. <span className="text-primary">More on what matters.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
            Your AI workplace assistant for emails, meetings, planning and quick answers.
          </p>
          <Button asChild size="lg" className="mt-8 shadow-glow">
            <Link to="/dashboard">Get started <ArrowRight /></Link>
          </Button>
        </section>
        <section className="my-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </section>
      </main>
      <footer className="border-t px-6 py-5">
        <AiDisclaimer className="mx-auto max-w-6xl" />
      </footer>
    </div>
  );
}
