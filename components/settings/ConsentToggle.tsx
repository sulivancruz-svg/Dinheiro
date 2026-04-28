"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

type ConsentType = "WHATSAPP" | "EMAIL_MARKETING";

type ConsentToggleProps = {
  tipo: ConsentType;
  title: string;
  description: string;
  initialAccepted: boolean;
  updatedAt?: string;
};

export function ConsentToggle({
  tipo,
  title,
  description,
  initialAccepted,
  updatedAt,
}: ConsentToggleProps) {
  const [accepted, setAccepted] = useState(initialAccepted);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleConsent() {
    const nextValue = !accepted;
    setMessage(null);

    startTransition(() => {
      void fetch("/api/consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo,
          aceito: nextValue,
        }),
      })
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Nao foi possivel atualizar.");
          }

          setAccepted(data.aceito);
          setMessage(data.aceito ? "Consentimento ativo." : "Consentimento revogado.");
        })
        .catch((error: unknown) => {
          setMessage(
            error instanceof Error
              ? error.message
              : "Nao foi possivel atualizar."
          );
        });
    });
  }

  return (
    <div className="rounded-[1.75rem] border border-[var(--color-ink)]/10 bg-white/65 p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-black tracking-[-0.03em] text-[var(--color-ink)]">
              {title}
            </h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${
                accepted
                  ? "bg-[var(--color-leaf)]/15 text-[var(--color-leaf)]"
                  : "bg-[var(--color-clay)]/12 text-[var(--color-clay)]"
              }`}
            >
              {accepted ? "Ativo" : "Revogado"}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            {description}
          </p>
          {updatedAt ? (
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Ultima atualizacao: {updatedAt}
            </p>
          ) : null}
        </div>

        <Button disabled={isPending} onClick={toggleConsent} variant="secondary">
          {isPending ? "Salvando..." : accepted ? "Revogar" : "Ativar"}
        </Button>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl bg-[var(--color-sand)]/55 px-4 py-3 text-sm leading-6 text-[var(--color-ink)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
