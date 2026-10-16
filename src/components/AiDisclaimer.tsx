import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export const DISCLAIMER = "AI-generated content may contain errors. Review before using.";

export function AiDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
      <span>{DISCLAIMER}</span>
    </p>
  );
}
