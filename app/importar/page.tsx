import { ButtonLink } from "@/components/ui/Button";
import { ImportacaoForm } from "@/components/importacao/ImportacaoForm";
import { requireAuth } from "@/lib/auth/session";

export default async function ImportarPage() {
  await requireAuth();

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff8ec,#f2dcad)] px-5 py-8">
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--color-clay)]">
              Importacao
            </p>
            <h1 className="font-display mt-2 text-5xl font-black leading-none tracking-[-0.06em] text-[var(--color-ink)]">
              Suba seu extrato ou fatura para preencher mais rapido.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Use arquivos CSV, OFX ou TXT. A analise sugere valores para o
              diagnostico, e voce revisa tudo antes de salvar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/onboarding" variant="secondary">
              Digitar manualmente
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="ghost">
              Dashboard
            </ButtonLink>
          </div>
        </header>

        <ImportacaoForm />
      </section>
    </main>
  );
}
