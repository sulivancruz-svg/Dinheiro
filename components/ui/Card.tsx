import type { HTMLAttributes } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-[2rem] border border-[var(--color-ink)]/10 bg-white/72 p-6 shadow-[0_24px_80px_rgba(35,31,26,0.10)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx(
        "text-xl font-black tracking-[-0.03em] text-[var(--color-ink)]",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={clsx("mt-2 text-sm leading-6 text-[var(--color-muted)]", className)}
      {...props}
    />
  );
}
