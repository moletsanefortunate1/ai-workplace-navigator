import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Copy, RefreshCw, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { generateEmail, type EmailResult } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, ErrorNote, errorMessage } from "@/components/PageHeader";
import { AiDisclaimer } from "@/components/AiDisclaimer";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({
    meta: [
      { title: "Smart Email Generator · Workplace AI" },
      { name: "description", content: "Generate professional emails with AI in formal, friendly or persuasive tone." },
      { property: "og:title", content: "Smart Email Generator · Workplace AI" },
      { property: "og:description", content: "Generate professional emails with AI in formal, friendly or persuasive tone." },
    ],
  }),
  component: EmailPage,
});

function EmailPage() {
  const gen = useServerFn(generateEmail);
  const [form, setForm] = useState({ recipient: "", purpose: "", keyPoints: "", tone: "formal" });
  const [result, setResult] = useState<EmailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!form.purpose.trim()) {
      setError("Please describe the purpose of the email.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setResult(await gen({ data: form }));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(`Subject: ${result.subject}\n\n${result.body}`);
    toast.success("Email copied to clipboard");
  }

  return (
    <div>
      <PageHeader icon={Mail} title="Smart Email Generator" description="Describe what you need — get a ready-to-send draft." />
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="space-y-4 rounded-2xl border bg-card p-5"
          onSubmit={(e) => { e.preventDefault(); run(); }}
        >
          <div className="grid gap-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input id="recipient" placeholder="e.g. Sarah, Head of Marketing" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input id="purpose" placeholder="e.g. Request budget approval for Q4 campaign" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="points">Key points</Label>
            <Textarea id="points" rows={5} placeholder={"- Budget: R120,000\n- Expected 3x ROI\n- Need decision by Friday"} value={form.keyPoints} onChange={(e) => setForm({ ...form, keyPoints: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Tone</Label>
            <ToggleGroup type="single" variant="outline" value={form.tone} onValueChange={(v) => v && setForm({ ...form, tone: v })} className="justify-start">
              <ToggleGroupItem value="formal" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Formal</ToggleGroupItem>
              <ToggleGroupItem value="friendly" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Friendly</ToggleGroupItem>
              <ToggleGroupItem value="persuasive" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Persuasive</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Wand2 />} {loading ? "Writing your email…" : "Generate email"}
          </Button>
        </form>

        <div className="space-y-4 rounded-2xl border bg-card p-5">
          <h2 className="text-base font-semibold">Your draft</h2>
          {error && <ErrorNote message={error} />}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-9" /><Skeleton className="h-64" />
            </div>
          ) : result ? (
            <>
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={result.subject} onChange={(e) => setResult({ ...result, subject: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="body">Body</Label>
                <Textarea id="body" rows={14} value={result.body} onChange={(e) => setResult({ ...result, body: e.target.value })} />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={copy}><Copy /> Copy</Button>
                <Button variant="outline" onClick={run}><RefreshCw /> Regenerate</Button>
              </div>
              <AiDisclaimer />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Fill in the details and click Generate. You can edit the result freely.</p>
          )}
        </div>
      </div>
    </div>
  );
}
