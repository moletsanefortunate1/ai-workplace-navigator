import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, Loader2, Wand2, Plus, Trash2 } from "lucide-react";
import { planTasks, type PlanResult } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorNote, errorMessage } from "@/components/PageHeader";
import { AiDisclaimer } from "@/components/AiDisclaimer";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "AI Task Planner · Workplace AI" },
      { name: "description", content: "Turn your task list into a prioritized daily or weekly schedule." },
      { property: "og:title", content: "AI Task Planner · Workplace AI" },
      { property: "og:description", content: "Turn your task list into a prioritized daily or weekly schedule." },
    ],
  }),
  component: PlannerPage,
});

type Task = { title: string; deadline: string; priority: string };
const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-destructive/15 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-accent text-accent-foreground",
};

function PlannerPage() {
  const run = useServerFn(planTasks);
  const [tasks, setTasks] = useState<Task[]>([
    { title: "", deadline: "", priority: "High" },
    { title: "", deadline: "", priority: "Medium" },
  ]);
  const [mode, setMode] = useState<"daily" | "weekly">("daily");
  const [plan, setPlan] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, patch: Partial<Task>) => setTasks(tasks.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      setPlan(await run({ data: { mode, today, tasks } }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  const updateBlock = (d: number, b: number, patch: Partial<PlanResult["days"][number]["blocks"][number]>) =>
    plan && setPlan({
      ...plan,
      days: plan.days.map((day, i) => (i !== d ? day : { ...day, blocks: day.blocks.map((bl, j) => (j === b ? { ...bl, ...patch } : bl)) })),
    });

  return (
    <div className="space-y-6">
      <PageHeader icon={CalendarCheck} title="AI Task Planner" description="List your tasks — AI builds a prioritized schedule." />
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="hidden grid-cols-[1fr_11rem_8rem_2.25rem] gap-2 text-xs text-muted-foreground sm:grid">
          <span>Task</span><span>Deadline</span><span>Priority</span><span />
        </div>
        {tasks.map((t, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_11rem_8rem_2.25rem]">
            <Input placeholder="e.g. Finish quarterly report" value={t.title} aria-label="Task" onChange={(e) => update(i, { title: e.target.value })} />
            <Input type="date" value={t.deadline} aria-label="Deadline" onChange={(e) => update(i, { deadline: e.target.value })} />
            <Select value={t.priority} onValueChange={(v) => update(i, { priority: v })}>
              <SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" aria-label="Remove task" onClick={() => setTasks(tasks.filter((_, j) => j !== i))} disabled={tasks.length === 1}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={() => setTasks([...tasks, { title: "", deadline: "", priority: "Medium" }])}>
            <Plus /> Add task
          </Button>
          <div className="flex items-center gap-3">
            <ToggleGroup type="single" variant="outline" value={mode} onValueChange={(v) => v && setMode(v as "daily" | "weekly")}>
              <ToggleGroupItem value="daily" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Daily</ToggleGroupItem>
              <ToggleGroupItem value="weekly" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Weekly</ToggleGroupItem>
            </ToggleGroup>
            <Button onClick={go} disabled={loading || !tasks.some((t) => t.title.trim())}>
              {loading ? <Loader2 className="animate-spin" /> : <Wand2 />} {loading ? "Planning…" : "Build schedule"}
            </Button>
          </div>
        </div>
      </div>

      {error && <ErrorNote message={error} />}
      {loading && <div className="grid gap-3"><Skeleton className="h-16" /><Skeleton className="h-48" /></div>}

      {plan && !loading && (
        <div className="space-y-4">
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="mb-2 text-base font-semibold">Overview</h2>
            <Textarea rows={3} value={plan.overview} onChange={(e) => setPlan({ ...plan, overview: e.target.value })} />
          </section>
          {plan.days.map((day, d) => (
            <section key={d} className="rounded-2xl border bg-card p-5">
              <Input className="mb-3 border-none bg-transparent px-0 font-display text-base font-semibold shadow-none" value={day.label} aria-label="Day"
                onChange={(e) => setPlan({ ...plan, days: plan.days.map((x, i) => (i === d ? { ...x, label: e.target.value } : x)) })} />
              <ol className="space-y-2">
                {day.blocks.map((b, i) => (
                  <li key={i} className="grid gap-2 rounded-xl border bg-background/40 p-3 sm:grid-cols-[8rem_1fr_auto] sm:items-start">
                    <Input value={b.time} aria-label="Time" className="font-medium text-primary" onChange={(e) => updateBlock(d, i, { time: e.target.value })} />
                    <div className="space-y-1">
                      <Input value={b.task} aria-label="Task" onChange={(e) => updateBlock(d, i, { task: e.target.value })} />
                      <Input value={b.note} aria-label="Note" className="text-xs text-muted-foreground" onChange={(e) => updateBlock(d, i, { note: e.target.value })} />
                    </div>
                    <span className={`justify-self-start rounded-md px-2 py-1 text-xs font-medium ${PRIORITY_STYLE[b.priority.toLowerCase()] ?? PRIORITY_STYLE.low}`}>
                      {b.priority}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
          <AiDisclaimer />
        </div>
      )}
    </div>
  );
}
