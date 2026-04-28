"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function requestDeletion() {
    if (!confirming) {
      setConfirming(true);
      setMessage("Clique novamente para confirmar a solicitacao de exclusao.");
      return;
    }

    setMessage(null);

    startTransition(() => {
      void fetch("/api/lgpd/delete-request", {
        method: "POST",
      })
        .then(async (response) => {
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Nao foi possivel solicitar exclusao.");
          }

          setMessage("Solicitacao registrada. Voce sera desconectado.");

          setTimeout(() => {
            void signOut({ callbackUrl: "/login" });
          }, 900);
        })
        .catch((error: unknown) => {
          setConfirming(false);
          setMessage(
            error instanceof Error
              ? error.message
              : "Nao foi possivel solicitar exclusao."
          );
        });
    });
  }

  return (
    <div>
      <Button disabled={isPending} onClick={requestDeletion} variant="ghost">
        {isPending
          ? "Registrando..."
          : confirming
            ? "Confirmar exclusao"
            : "Solicitar exclusao"}
      </Button>
      {message ? (
        <p className="mt-3 max-w-xl rounded-2xl bg-[var(--color-sand)]/55 px-4 py-3 text-sm leading-6 text-[var(--color-ink)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
