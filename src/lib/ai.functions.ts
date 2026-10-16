import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EmailResult = { subject: string; body: string };
export type NotesResult = {
  summary: string;
  actionItems: { task: string; owner: string }[];
  decisions: { item: string; deadline: string }[];
};
export type PlanResult = {
  overview: string;
  days: { label: string; blocks: { time: string; task: string; priority: string; note: string }[] }[];
};

async function logActivity(
  supabase: { from: (t: "activity") => { insert: (v: unknown) => PromiseLike<{ error: unknown }> } },
  userId: string,
  kind: string,
  title: string,
) {
  const { error } = await supabase.from("activity").insert({ user_id: userId, kind, title: title.slice(0, 140) });
  if (error) console.error("activity insert failed", error);
}

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { recipient: string; purpose: string; keyPoints: string; tone: string }) => {
    if (!d.purpose?.trim()) throw new Error("Please describe the purpose of the email.");
    return {
      recipient: String(d.recipient ?? "").slice(0, 200),
      purpose: String(d.purpose).slice(0, 1000),
      keyPoints: String(d.keyPoints ?? "").slice(0, 4000),
      tone: ["formal", "friendly", "persuasive"].includes(d.tone) ? d.tone : "formal",
    };
  })
  .handler(async ({ data, context }) => {
    const { runStructured } = await import("./ai/gateway.server");
    const out = await runStructured<EmailResult>({
      name: "email",
      instructions:
        "You are a professional workplace email writer. Write clear, concise, well-structured emails. Use plain text paragraphs, a greeting and sign-off. Do not invent facts beyond the key points; use placeholders like [Your Name] where needed.",
      prompt: `Recipient: ${data.recipient || "(not specified)"}\nPurpose: ${data.purpose}\nKey points:\n${data.keyPoints || "(none)"}\nTone: ${data.tone}`,
      schema: z.object({ subject: z.string(), body: z.string() }),
    });
    await logActivity(context.supabase as never, context.userId, "email", out.subject);
    return out;
  });

export const summarizeNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { notes: string }) => {
    const notes = String(d.notes ?? "").trim();
    if (notes.length < 20) throw new Error("Please paste a bit more of your meeting notes.");
    return { notes: notes.slice(0, 30000) };
  })
  .handler(async ({ data, context }) => {
    const { runStructured } = await import("./ai/gateway.server");
    const out = await runStructured<NotesResult>({
      name: "meeting_summary",
      instructions:
        "You summarize raw meeting notes for busy professionals. Be faithful to the notes. For owners or deadlines not mentioned, use 'Unassigned' or 'Not specified'.",
      prompt: data.notes,
      schema: z.object({
        summary: z.string(),
        actionItems: z.array(z.object({ task: z.string(), owner: z.string() })),
        decisions: z.array(z.object({ item: z.string(), deadline: z.string() })),
      }),
    });
    await logActivity(context.supabase as never, context.userId, "notes", out.summary);
    return out;
  });

export const planTasks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: { mode: "daily" | "weekly"; today: string; tasks: { title: string; deadline: string; priority: string }[] }) => {
      const tasks = (d.tasks ?? []).filter((t) => t.title?.trim()).slice(0, 50);
      if (tasks.length === 0) throw new Error("Add at least one task to plan.");
      return { mode: d.mode === "weekly" ? "weekly" : "daily", today: String(d.today).slice(0, 40), tasks };
    },
  )
  .handler(async ({ data, context }) => {
    const { runStructured } = await import("./ai/gateway.server");
    const list = data.tasks
      .map((t, i) => `${i + 1}. ${t.title} | deadline: ${t.deadline || "none"} | priority: ${t.priority}`)
      .join("\n");
    const out = await runStructured<PlanResult>({
      name: "schedule",
      instructions:
        "You are a productivity coach. Build a realistic, prioritized schedule. Put urgent/high-priority and near-deadline tasks first, include short breaks, and keep a 9:00-17:30 working day. priority must be one of High, Medium, Low.",
      prompt: `Today is ${data.today}. Create a ${data.mode} schedule${data.mode === "weekly" ? " (Monday to Friday, starting from today)" : " for today"}.\nTasks:\n${list}`,
      schema: z.object({
        overview: z.string(),
        days: z.array(
          z.object({
            label: z.string(),
            blocks: z.array(
              z.object({ time: z.string(), task: z.string(), priority: z.string(), note: z.string() }),
            ),
          }),
        ),
      }),
    });
    await logActivity(context.supabase as never, context.userId, "planner", `${data.mode === "weekly" ? "Weekly" : "Daily"} plan · ${data.tasks.length} tasks`);
    return out;
  });
