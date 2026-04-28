import { redirect } from "next/navigation";
import { LoginActions } from "@/components/auth/LoginActions";
import { Card } from "@/components/ui/Card";
import { getOptionalSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getOptionalSession();

  if (session?.user) {
    redirect("/onboarding");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,164,65,0.32),transparent_34%),linear-gradient(135deg,#fff8ec,#f0d09a)] px-5 py-10">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--color-clay)]">
            Acesso ao MVP
          </p>
          <h1 className="font-display mt-4 max-w-3xl text-6xl font-black leading-[0.9] tracking-[-0.07em] text-[var(--color-ink)] sm:text-7xl">
            Entre para montar seu diagnostico.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--color-muted)]">
            Depois do login, voce informa os numeros principais e recebe perfil,
            caixinhas e prioridade do mes.
          </p>
        </div>

        <Card className="bg-[var(--color-paper)]/90">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[var(--color-ink)]">
            Escolha uma forma de entrada
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            O login e necessario porque os diagnosticos sao privados por usuario.
          </p>
          <div className="mt-6">
            <LoginActions />
          </div>
        </Card>
      </section>
    </main>
  );
}
