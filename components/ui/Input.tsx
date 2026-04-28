import type { InputHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: ReactNode;
};

export function Input({ className, id, label, hint, ...props }: InputProps) {
  const inputId = id || props.name;

  return (
    <label className="block">
      {label ? (
        <span className="mb-2 block text-sm font-bold text-[var(--color-ink)]">
          {label}
        </span>
      ) : null}
      <input
        id={inputId}
        className={clsx(
          "min-h-12 w-full rounded-2xl border border-[var(--color-ink)]/12 bg-white/80 px-4 text-base text-[var(--color-ink)] outline-none transition placeholder:text-[var(--color-muted)]/70 focus:border-[var(--color-clay)] focus:ring-4 focus:ring-[var(--color-clay)]/15",
          className
        )}
        {...props}
      />
      {hint ? (
        <span className="mt-2 block text-xs leading-5 text-[var(--color-muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
