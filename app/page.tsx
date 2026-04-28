import { Alert } from "@/components/ui/Alert";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";

const steps = [
  {
    title: "Diagnostico sem julgamento",
    description:
      "Renda, gastos, dividas e patrimonio viram uma leitura simples do momento atual.",
  },
  {
    title: "Plano de acao mensal",
    description:
      "A prioridade do mes, tres acoes praticas e uma meta realista para sair da inercia.",
  },
  {
    title: "Mentor IA com contexto",
    description:
      "Perguntas financeiras respondidas com dados sanitizados e linguagem direta.",
  },
];

const metrics = [
  ["6", "perfis financeiros"],
  ["7", "caixinhas de orcamento"],
  ["LGPD", "consentimento e auditoria"],
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_15%_10%,rgba(217,164,65,0.35),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(60,110,113,0.20),transparent_30%),linear-gradient(135deg,#fff8ec_0%,#f4dfb7_48%,#e8c98b_100%)]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
        <a className="text-lg font-black tracking-[-0.04em]" href="#top">
          Dinheiro com Direcao
        </a>
        <nav className="hidden items-center gap-6 text-sm font-bold text-[var(--color-muted)] sm:flex">
          <a className="hover:text-[var(--color-ink)]" href="#metodo">
            Metodo
          </a>
          <a className="hover:text-[var(--color-ink)]" href="#seguranca">
            Seguranca
          </a>
          <a className="hover:text-[var(--color-ink)]" href="#comece">
            Comece
          </a>
        </nav>
      </header>

      <main id="top" className="mx-auto w-full max-w-7xl px-5 pb-16 pt-8 sm:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Alert className="mb-6 max-w-xl" tone="warning">
              MVP em construcao: backend, diagnostico, mentor IA e consentimento
              LGPD ja estao preparados para o fluxo principal.
            </Alert>
            <h1 className="font-display max-w-4xl text-6xl font-black leading-[0.9] tracking-[-0.07em] text-[var(--color-ink)] sm:text-7xl lg:text-8xl">
              Dinheiro claro. Decisoes sem panico.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)] sm:text-xl">
              Um app financeiro educacional para transformar numeros soltos em
              diagnostico, caixinhas e um plano mensal que cabe na vida real.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/login">Entrar no MVP</ButtonLink>
              <ButtonLink href="#metodo" variant="secondary">
                Ver como funciona
              </ButtonLink>
            </div>
          </div>

          <Card className="relative min-h-[520px] overflow-hidden bg-[var(--color-ink)] p-0 text-[var(--color-paper)]">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[var(--color-gold)]/60 blur-2xl" />
            <div className="absolute -bottom-20 left-8 h-56 w-56 rounded-full bg-[var(--color-river)]/70 blur-2xl" />
            <div className="relative p-7 sm:p-9">
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--color-gold)]">
                Diagnostico exemplo
              </p>
              <div className="mt-8 rounded-[1.75rem] bg-white/10 p-5">
                <p className="text-sm text-white/65">Perfil financeiro</p>
                <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
                  Organizador em construcao
                </p>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-[1.5rem] bg-white/10 p-5">
                  <p className="text-sm text-white/65">Saldo mensal</p>
                  <p className="mt-2 text-2xl font-black">R$ 1.850</p>
                </div>
                <div className="rounded-[1.5rem] bg-white/10 p-5">
                  <p className="text-sm text-white/65">Risco</p>
                  <p className="mt-2 text-2xl font-black">Baixo</p>
                </div>
              </div>
              <div className="mt-5 rounded-[1.75rem] bg-[var(--color-paper)] p-5 text-[var(--color-ink)]">
                <p className="text-sm font-bold text-[var(--color-muted)]">
                  Proxima prioridade
                </p>
                <p className="mt-2 text-xl font-black tracking-[-0.03em]">
                  Automatizar 20% para futuro antes dos gastos variaveis.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section id="metodo" className="mt-20 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title}>
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-ink)] text-lg font-black text-[var(--color-paper)]">
                {index + 1}
              </div>
              <CardTitle>{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </Card>
          ))}
        </section>

        <section
          id="seguranca"
          className="mt-10 grid overflow-hidden rounded-[2.5rem] border border-[var(--color-ink)]/10 bg-[var(--color-paper)]/80 shadow-[0_24px_80px_rgba(35,31,26,0.10)] lg:grid-cols-[0.85fr_1.15fr]"
        >
          <div className="bg-[var(--color-clay)] p-8 text-[var(--color-paper)] sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/70">
              Privacidade por desenho
            </p>
            <h2 className="font-display mt-4 text-4xl font-black leading-none tracking-[-0.06em]">
              Dados financeiros nao precisam virar exposicao.
            </h2>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
            {metrics.map(([value, label]) => (
              <div key={label} className="rounded-[1.75rem] bg-white/70 p-5">
                <p className="text-3xl font-black tracking-[-0.05em] text-[var(--color-ink)]">
                  {value}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="comece"
          className="mt-10 rounded-[2.5rem] bg-[var(--color-ink)] px-6 py-10 text-center text-[var(--color-paper)] sm:px-10"
        >
          <h2 className="font-display mx-auto max-w-3xl text-4xl font-black leading-none tracking-[-0.06em] sm:text-5xl">
            O proximo passo e conectar o onboarding ao diagnostico.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/70">
            A base backend ja calcula perfil, caixinhas e historico. A interface
            agora pode evoluir para formulario, dashboard e mentor.
          </p>
          <div className="mt-7">
            <ButtonLink href="/login" variant="secondary">
              Acessar autenticacao
            </ButtonLink>
          </div>
        </section>
      </main>
    </div>
  );
}
