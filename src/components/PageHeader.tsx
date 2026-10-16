import type { LucideIcon } from "lucide-react";

export function PageHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
      <span className="font-medium text-destructive">Couldn't generate. </span>
      {message}
    </div>
  );
}

export function errorMessage(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (/unauthori[sz]ed/i.test(msg)) return "Your session expired. Please sign in again.";
  return msg || "Something went wrong. Please try again.";
}
