import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { CaixinhasService } from "@/lib/services/CaixinhasService";
import { DiagnosticoService } from "@/lib/services/DiagnosticoService";
import { PerfilService } from "@/lib/services/PerfilService";

const profileLabels: Record<string, string> = {
  sobrevivente_financeiro: "Sobrevivente financeiro",
  gastador_emocional: "Gastador emocional",
  acumulador_ansioso: "Acumulador ansioso",
  organizador_em_construcao: "Organizador em construcao",
  potencial_travado: "Potencial travado",
  construtor_patrimonio: "Construtor de patrimonio",
};

const caixinhasMeta: Record<
  string,
  {
    label: string;
    description: string;
    color: string;
  }
> = {
  essencial: {
    label: "Essencial",
    description: "Moradia, alimentacao, transporte, contas e tudo que mantem a vida de pe.",
    color: "bg-[var(--color-ink)] text-[var(--color-paper)]",
  },
  dividas: {
    label: "Dividas",
    description: "Parcelas, renegociacoes e pagamentos que reduzem pressao mensal.",
    color: "bg-[var(--color-clay)] text-[var(--color-paper)]",
  },
  futuro: {
    label: "Futuro",
    description: "Reserva de emergencia, investimentos simples e protecao contra imprevistos.",
    color: "bg-[var(--color-leaf)] text-[var(--color-paper)]",
  },
  prazer: {
    label: "Prazer",
    description: "Lazer consciente para o plano ser sustentavel, nao uma punicao.",
    color: "bg-[var(--color-gold)] text-[var(--color-ink)]",
  },
  crescimento: {
    label: "Crescimento",
    description: "Cursos, livros, ferramentas e experiencias que aumentam capacidade.",
    color: "bg-[var(--color-river)] text-[var(--color-paper)]",
  },
  grandes_planos: {
    label: "Grandes planos",
    description: "Objetivos maiores: viagem, mudanca, entrada de imovel, projeto proprio.",
    color: "bg-white text-[var(--color-ink)]",
  },
  generosidade: {
    label: "Generosidade",
    description: "Ajuda, presentes e contribuicoes feitas com limite claro.",
    color: "bg-[var(--color-sand)] text-[var(--color-ink)]",
  },
};

const currency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

function calcularDiagnostico(diagnostico: {
  rendaFixa: number;
  rendaVariavel: number;
  gastosFixos: number;
  gastosVariaveis: number;
  parcelasMensais: number;
  valorPoupado: number;
  valorInvestido: number;
  dividaTotal: number;
}) {
  const rendaTotal = DiagnosticoService.calcularRendaTotal(
    diagnostico.rendaFixa,
    diagnostico.rendaVariavel
  );
  const gastosTotais = DiagnosticoService.calcularGastosTotais(
    diagnostico.gastosFixos,
    diagnostico.gastosVariaveis
  );
  const saldoMensal = DiagnosticoService.calcularSaldoMensal(
    rendaTotal,
    gastosTotais,
    diagnostico.parcelasMensais
  );
  const percentualComprometido =
    DiagnosticoService.calcularPercentualComprometido(
      gastosTotais,
      diagnostico.parcelasMensais,
      rendaTotal
    );
  const percentualDivida = DiagnosticoService.calcularPercentualDivida(
    diagnostico.parcelasMensais,
    rendaTotal
  );
  const capacidadePoupanca =
    DiagnosticoService.calcularCapacidadePoupanca(saldoMensal);
  const patrimonioLiquido = DiagnosticoService.calcularPatrimonioLiquido(
    diagnostico.valorPoupado,
    diagnostico.valorInvestido,
    diagnostico.dividaTotal
  );
  const perfil = PerfilService.classificarPerfil({
    saldoMensal,
    percentualComprometido,
    percentualDivida,
    patrimonio_liquido: patrimonioLiquido,
    valor_poupado: diagnostico.valorPoupado,
    capacidade_poupanca: capacidadePoupanca,
  });
  const percentuais = CaixinhasService.sugerirCaixinhas({
    perfil,
    rendaTotal,
    saldoMensal,
    percentualDivida,
  });
  const valores = CaixinhasService.calcularValoresCaixinhas(
    rendaTotal,
    percentuais
  );

  return {
    perfil,
    rendaTotal,
    saldoMensal,
    percentualComprometido,
    percentualDivida,
    percentuais,
    valores,
  };
}

export default async function CaixinhasPage() {
  const user = await requireAuth();

  const diagnostico = await prisma.diagnostico.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (!diagnostico) {
    redirect("/onboarding");
  }

  const resumo = calcularDiagnostico(diagnostico);
  const totalAlocado = Object.values(resumo.valores).reduce(
    (total, value) => total + value,
    0
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff8ec,#f2dcad)] px-5 py-8">
      <section className="mx-auto w-full max-w-7xl">
        <header className="mb-8 grid gap-6 lg:grid-cols-[1fr_0.75fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--color-clay)]">
              Caixinhas
            </p>
            <h1 className="font-display mt-2 text-5xl font-black leading-none tracking-[-0.06em] text-[var(--color-ink)]">
              Seu dinheiro com destino antes de sair da conta.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Uma divisao sugerida para transformar renda em prioridades claras.
              Use como ponto de partida e ajuste conforme sua realidade.
            </p>
          </div>

          <Card className="bg-[var(--color-ink)] text-[var(--color-paper)]">
            <p className="text-sm text-white/65">Perfil atual</p>
            <p className="mt-2 text-2xl font-black tracking-[-0.04em]">
              {profileLabels[resumo.perfil] || resumo.perfil}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-white/60">Renda</p>
                <p className="mt-1 font-black">{currency.format(resumo.rendaTotal)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-white/60">Saldo</p>
                <p className="mt-1 font-black">{currency.format(resumo.saldoMensal)}</p>
              </div>
            </div>
          </Card>
        </header>

        <div className="mb-5 flex flex-col justify-between gap-3 rounded-[2rem] border border-[var(--color-ink)]/10 bg-[var(--color-paper)]/80 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-bold text-[var(--color-muted)]">
              Total distribuido
            </p>
            <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-[var(--color-ink)]">
              {currency.format(totalAlocado)}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/dashboard" variant="secondary">
              Dashboard
            </ButtonLink>
            <ButtonLink href="/mentor" variant="ghost">
              Perguntar ao mentor
            </ButtonLink>
            <ButtonLink href="/onboarding">Novo diagnostico</ButtonLink>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(resumo.valores).map(([key, value]) => {
            const meta = caixinhasMeta[key];
            const percent = resumo.percentuais[key as keyof typeof resumo.percentuais];

            return (
              <Card className="overflow-hidden p-0" key={key}>
                <div className={`${meta.color} p-5`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold opacity-75">
                        {percent}% da renda
                      </p>
                      <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
                        {meta.label}
                      </h2>
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-black">
                      {currency.format(value)}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-6 text-[var(--color-muted)]">
                    {meta.description}
                  </p>
                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-[var(--color-sand)]/55">
                    <div
                      className="h-full rounded-full bg-[var(--color-clay)]"
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-5 bg-[var(--color-paper)]/90">
          <CardTitle>Como usar esta divisao</CardTitle>
          <CardDescription>
            Separe as caixinhas logo que a renda entrar. Se o saldo estiver
            negativo ou apertado, priorize essencial, dividas e futuro antes de
            prazer e grandes planos.
          </CardDescription>
        </Card>
      </section>
    </main>
  );
}
