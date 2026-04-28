import { DiagnosticoForm } from "@/components/forms/DiagnosticoForm";
import { Card } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/session";

export default async function OnboardingPage() {
  const user = await requireAuth();

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff8ec,#f3ddb0_55%,#e9c47d)] px-5 py-8">
      <section className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--color-clay)]">
              Onboarding financeiro
            </p>
            <h1 className="font-display mt-3 max-w-4xl text-5xl font-black leading-none tracking-[-0.06em] text-[var(--color-ink)] sm:text-6xl">
              Vamos transformar seus numeros em direcao.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--color-muted)]">
            Logado como {user.email || user.name || "usuario autenticado"}.
          </p>
        </div>

        <Card className="bg-[var(--color-paper)]/90">
          <DiagnosticoForm />
        </Card>
      </section>
    </main>
  );
}
