"use client";

import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff8ec,#f2dcad)] px-5 py-8">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center">
        <div className="rounded-[2rem] border border-[var(--color-clay)]/20 bg-[var(--color-paper)]/90 p-8 shadow-[0_24px_80px_rgba(35,31,26,0.10)]">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--color-clay)]">
            Erro inesperado
          </p>
          <h1 className="font-display mt-3 text-5xl font-black leading-none tracking-[-0.06em] text-[var(--color-ink)]">
            Nao foi possivel carregar esta area.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
            Tente novamente. Se o problema continuar, volte ao dashboard e
            refaca a acao.
          </p>
          {error.digest ? (
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              Codigo tecnico: {error.digest}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={reset}>Tentar novamente</Button>
            <ButtonLink href="/dashboard" variant="secondary">
              Ir ao dashboard
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
