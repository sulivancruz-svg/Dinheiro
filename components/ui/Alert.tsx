import type { HTMLAttributes } from "react";
import clsx from "clsx";

type AlertTone = "info" | "success" | "warning";

const tones: Record<AlertTone, string> = {
  info: "border-[var(--color-river)]/30 bg-[var(--color-river)]/10",
  success: "border-[var(--color-leaf)]/30 bg-[var(--color-leaf)]/10",
  warning: "border-[var(--color-gold)]/40 bg-[var(--color-gold)]/15",
};

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  tone?: AlertTone;
};

export function Alert({ className, tone = "info", ...props }: AlertProps) {
  return (
    <div
      className={clsx(
        "rounded-3xl border px-5 py-4 text-sm leading-6 text-[var(--color-ink)]",
        tones[tone],
        className
      )}
      role="status"
      {...props}
    />
  );
}
