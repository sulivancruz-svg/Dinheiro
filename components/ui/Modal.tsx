"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { Button } from "./Button";

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({ open, title, children, onClose, className }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--color-ink)]/35 p-4 backdrop-blur-sm">
      <section
        aria-modal="true"
        className={clsx(
          "w-full max-w-lg rounded-[2rem] bg-[var(--color-paper)] p-6 shadow-[0_30px_90px_rgba(35,31,26,0.26)]",
          className
        )}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-6">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[var(--color-ink)]">
            {title}
          </h2>
          <Button aria-label="Fechar modal" onClick={onClose} variant="ghost">
            Fechar
          </Button>
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </div>
  );
}
