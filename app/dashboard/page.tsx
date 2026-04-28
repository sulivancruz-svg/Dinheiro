import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { CaixinhasService } from "@/lib/services/CaixinhasService";
import { DiagnosticoService } from "@/lib/services/DiagnosticoService";
import { PerfilService } from "@/lib/services/PerfilService";
import { PlanoAcaoService } from "@/lib/services/PlanoAcaoService";

const profileLabels: Record<string, string> = {
  sobrevivente_financeiro: "Sobrevivente financeiro",
  gastador_emocional: "Gastador emocional",
  acumulador_ansioso: "Acumulador ansioso",
  organizador_em_construcao: "Organizador em construcao",
  potencial_travado: "Potencial travado",
  construtor_patrimonio: "Construtor de patrimonio",
};

const caixinhaLabels: Record<string, string> = {
  essencial: "Essencial",
  dividas: "Dividas",
  futuro: "Futuro",
  prazer: "Prazer",
  crescimento: "Crescimento",
  grandes_planos: "Grandes planos",
  generosidade: "Generosidade",
};

const currency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ diagnostico?: string }>;
}) {
  const user = await requireAuth();
  const { diagnostico: diagnosticoId } = await searchParams;

  const diagnostico = await prisma.diagnostico.findFirst({
    where: {
      userId: user.id,
      ...(diagnosticoId ? { id: diagnosticoId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  if (!diagnostico) {
    redirect("/onboarding");
  }

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
  const plano = PlanoAcaoService.gerarPlano({
    perfil,
    saldoMensal,
    percentualComprometido,
    percentualDivida,
    rendaTotal,
    capacidade_poupanca: capacidadePoupanca,
  });
  const caixinhasPercentuais = CaixinhasService.sugerirCaixinhas({
    perfil,
    rendaTotal,
    saldoMensal,
    percentualDivida,
  });
  const caixinhasValores = CaixinhasService.calcularValoresCaixinhas(
    rendaTotal,
    caixinhasPercentuais
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff8ec,#f2dcad)] px-5 py-8">
      <section className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--color-clay)]">
              Dashboard
            </p>
            <h1 className="font-display mt-2 text-5xl font-black leading-none tracking-[-0.06em] text-[var(--color-ink)]">
              {profileLabels[perfil] || "Perfil financeiro"}
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/onboarding" variant="secondary">
              Novo diagnostico
            </ButtonLink>
            <ButtonLink href="/mentor" variant="ghost">
              Abrir mentor
            </ButtonLink>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-4">
          <Card>
            <CardDescription>Renda mensal</CardDescription>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
              {currency.format(rendaTotal)}
            </p>
          </Card>
          <Card>
            <CardDescription>Gastos + parcelas</CardDescription>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
              {currency.format(gastosTotais + diagnostico.parcelasMensais)}
            </p>
          </Card>
          <Card>
            <CardDescription>Saldo mensal</CardDescription>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
              {currency.format(saldoMensal)}
            </p>
          </Card>
          <Card>
            <CardDescription>Patrimonio liquido</CardDescription>
            <p className="mt-2 text-3xl font-black tracking-[-0.05em]">
              {currency.format(patrimonioLiquido)}
            </p>
          </Card>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="bg-[var(--color-ink)] text-[var(--color-paper)]">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[var(--color-gold)]">
              Prioridade do mes
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">
              {plano.prioridade}
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/70">
              {plano.problemaPrincipal}
            </p>
            <div className="mt-6 rounded-[1.5rem] bg-white/10 p-5">
              <p className="text-sm text-white/65">Meta de economia</p>
              <p className="mt-1 text-2xl font-black">
                {currency.format(plano.metaEconomia)}
              </p>
            </div>
          </Card>

          <Card>
            <CardTitle>Acoes praticas</CardTitle>
            <ul className="mt-5 space-y-3">
              {plano.acoes.map((acao) => (
                <li
                  className="rounded-2xl bg-[var(--color-sand)]/45 px-4 py-3 text-sm leading-6 text-[var(--color-ink)]"
                  key={acao}
                >
                  {acao}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-[var(--color-muted)]">
              Habito semanal: {plano.habitoSemanal}
            </p>
          </Card>
        </div>

        <Card className="mt-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <CardTitle>Caixinhas sugeridas</CardTitle>
              <CardDescription>
                Distribuicao calculada a partir do perfil e renda mensal.
              </CardDescription>
            </div>
            <Link className="text-sm font-bold text-[var(--color-clay)]" href="/historico">
              Ver historico
            </Link>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(caixinhasValores).map(([key, value]) => (
              <div
                className="rounded-[1.5rem] border border-[var(--color-ink)]/10 bg-white/65 p-4"
                key={key}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-[var(--color-ink)]">
                    {caixinhaLabels[key] || key}
                  </p>
                  <span className="rounded-full bg-[var(--color-gold)]/25 px-3 py-1 text-xs font-black">
                    {caixinhasPercentuais[key as keyof typeof caixinhasPercentuais]}%
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black tracking-[-0.04em]">
                  {currency.format(value)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </main>
  );
}
