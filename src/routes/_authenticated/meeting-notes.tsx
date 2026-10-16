import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { NotebookPen, Loader2, Wand2, Plus, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { summarizeNotes, type NotesResult } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorNote, errorMessage } from "@/components/PageHeader";
import { AiDisclaimer } from "@/components/AiDisclaimer";

export const Route = createFileRoute("/_authenticated/meeting-notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer · Workplace AI" },
      { name: "description", content: "Turn raw meeting notes into a summary, action items and decisions." },
      { property: "og:title", content: "Meeting Notes Summarizer · Workplace AI" },
      { property: "og:description", content: "Turn raw meeting notes into a summary, action items and decisions." },
    ],
  }),
  component: NotesPage,
});

function NotesPage() {
  const run = useServerFn(summarizeNotes);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<NotesResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      setResult(await run({ data: { notes } }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    if (!result) return;
    const text = [
      "SUMMARY", result.summary, "",
      "ACTION ITEMS", ...result.actionItems.map((a) => `- ${a.task} (Owner: ${a.owner})`), "",
      "DECISIONS & DEADLINES", ...result.decisions.map((d) => `- ${d.item} (Deadline: ${d.deadline})`),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Summary copied");
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={NotebookPen} title="Meeting Notes Summarizer" description="Paste messy notes — get a clean, shareable recap." />
      <div className="space-y-3 rounded-2xl border bg-card p-5">
        <Textarea
          rows={10}
          placeholder="Paste your raw meeting notes or transcript here…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">{notes.length.toLocaleString()} characters</span>
          <Button onClick={go} disabled={loading || notes.trim().length === 0}>
            {loading ? <Loader2 className="animate-spin" /> : <Wand2 />} {loading ? "Summarizing…" : "Summarize"}
          </Button>
        </div>
      </div>

      {error && <ErrorNote message={error} />}

      {loading && (
        <div className="grid gap-4">
          <Skeleton className="h-32" /><Skeleton className="h-40" /><Skeleton className="h-32" />
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <Section title="Summary">
            <Textarea rows={5} value={result.summary} onChange={(e) => setResult({ ...result, summary: e.target.value })} />
          </Section>

          <Section title="Action Items">
            <div className="space-y-2">
              {result.actionItems.map((a, i) => (
                <div key={i} className="flex flex-col gap-2 sm:flex-row">
                  <Input className="flex-1" value={a.task} aria-label="Task"
                    onChange={(e) => setResult({ ...result, actionItems: result.actionItems.map((x, j) => (j === i ? { ...x, task: e.target.value } : x)) })} />
                  <Input className="sm:w-48" value={a.owner} aria-label="Owner" placeholder="Owner"
                    onChange={(e) => setResult({ ...result, actionItems: result.actionItems.map((x, j) => (j === i ? { ...x, owner: e.target.value } : x)) })} />
                  <Button variant="ghost" size="icon" aria-label="Remove"
                    onClick={() => setResult({ ...result, actionItems: result.actionItems.filter((_, j) => j !== i) })}><Trash2 /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setResult({ ...result, actionItems: [...result.actionItems, { task: "", owner: "" }] })}>
                <Plus /> Add action item
              </Button>
            </div>
          </Section>

          <Section title="Decisions and Deadlines">
            <div className="space-y-2">
              {result.decisions.map((d, i) => (
                <div key={i} className="flex flex-col gap-2 sm:flex-row">
                  <Input className="flex-1" value={d.item} aria-label="Decision"
                    onChange={(e) => setResult({ ...result, decisions: result.decisions.map((x, j) => (j === i ? { ...x, item: e.target.value } : x)) })} />
                  <Input className="sm:w-48" value={d.deadline} aria-label="Deadline" placeholder="Deadline"
                    onChange={(e) => setResult({ ...result, decisions: result.decisions.map((x, j) => (j === i ? { ...x, deadline: e.target.value } : x)) })} />
                  <Button variant="ghost" size="icon" aria-label="Remove"
                    onClick={() => setResult({ ...result, decisions: result.decisions.filter((_, j) => j !== i) })}><Trash2 /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setResult({ ...result, decisions: [...result.decisions, { item: "", deadline: "" }] })}>
                <Plus /> Add decision
              </Button>
            </div>
          </Section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <AiDisclaimer />
            <Button variant="outline" onClick={copyAll}><Copy /> Copy all</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <span className="h-4 w-1 rounded-full bg-primary" /> {title}
      </h2>
      {children}
    </section>
  );
}
