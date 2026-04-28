import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-ink)] text-[var(--color-paper)] shadow-[0_18px_40px_rgba(35,31,26,0.24)] hover:-translate-y-0.5 hover:bg-[var(--color-clay)]",
  secondary:
    "border border-[var(--color-ink)]/15 bg-white/70 text-[var(--color-ink)] hover:-translate-y-0.5 hover:border-[var(--color-ink)]/35",
  ghost: "text-[var(--color-ink)] hover:bg-[var(--color-sand)]/70",
};

const baseClass =
  "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold tracking-[-0.01em] transition";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(baseClass, variants[variant], className)}
      type={type}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  href,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={clsx(baseClass, variants[variant], className)}
      href={href}
      {...props}
    >
      {children}
    </Link>
  );
}
