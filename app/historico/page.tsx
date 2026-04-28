import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
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

const currency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function calcularResumo(diagnostico: {
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

  return {
    perfil,
    rendaTotal,
    gastosTotais,
    saldoMensal,
    patrimonioLiquido,
    percentualComprometido,
  };
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; limit?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page || 1));
  const limit = Math.max(1, Math.min(24, Number(params.limit || 8)));
  const skip = (page - 1) * limit;

  const [diagnosticos, total] = await Promise.all([
    prisma.diagnostico.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.diagnostico.count({
      where: { userId: user.id },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));
  const hasPrevious = page > 1;
  const hasNext = page < pages;

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff8ec,#f2dcad)] px-5 py-8">
      <section className="mx-auto w-full max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--color-clay)]">
              Historico
            </p>
            <h1 className="font-display mt-2 text-5xl font-black leading-none tracking-[-0.06em] text-[var(--color-ink)]">
              Seus diagnosticos
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Acompanhe como seu perfil, saldo e patrimonio evoluem a cada novo
              diagnostico.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/dashboard" variant="secondary">
              Voltar ao dashboard
            </ButtonLink>
            <ButtonLink href="/onboarding">Novo diagnostico</ButtonLink>
          </div>
        </header>

        {diagnosticos.length === 0 ? (
          <Card className="bg-[var(--color-paper)]/90">
            <CardTitle>Nenhum diagnostico ainda</CardTitle>
            <CardDescription>
              Complete o onboarding para criar seu primeiro registro financeiro.
            </CardDescription>
            <div className="mt-6">
              <ButtonLink href="/onboarding">Comecar agora</ButtonLink>
            </div>
          </Card>
        ) : (
          <>
            <div className="grid gap-4">
              {diagnosticos.map((diagnostico) => {
                const resumo = calcularResumo(diagnostico);

                return (
                  <Card
                    className="bg-[var(--color-paper)]/86 transition hover:-translate-y-0.5 hover:border-[var(--color-clay)]/25"
                    key={diagnostico.id}
                  >
                    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr_0.9fr_0.9fr_auto] lg:items-center">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">
                          {dateFormatter.format(diagnostico.createdAt)}
                        </p>
                        <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--color-ink)]">
                          {profileLabels[resumo.perfil] || resumo.perfil}
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                          Origem: {diagnostico.origem}
                        </p>
                      </div>

                      <div>
                        <CardDescription>Renda</CardDescription>
                        <p className="mt-1 text-xl font-black text-[var(--color-ink)]">
                          {currency.format(resumo.rendaTotal)}
                        </p>
                      </div>

                      <div>
                        <CardDescription>Saldo</CardDescription>
                        <p
                          className={`mt-1 text-xl font-black ${
                            resumo.saldoMensal >= 0
                              ? "text-[var(--color-leaf)]"
                              : "text-[var(--color-clay)]"
                          }`}
                        >
                          {currency.format(resumo.saldoMensal)}
                        </p>
                      </div>

                      <div>
                        <CardDescription>Patrimonio</CardDescription>
                        <p className="mt-1 text-xl font-black text-[var(--color-ink)]">
                          {currency.format(resumo.patrimonioLiquido)}
                        </p>
                      </div>

                      <Link
                        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--color-ink)]/15 px-5 text-sm font-bold text-[var(--color-ink)] transition hover:border-[var(--color-ink)]/35"
                        href={`/dashboard?diagnostico=${diagnostico.id}`}
                      >
                        Abrir
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>

            <footer className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm text-[var(--color-muted)]">
                Pagina {page} de {pages}. Total de {total} diagnosticos.
              </p>
              <div className="flex gap-3">
                {hasPrevious ? (
                  <ButtonLink
                    href={`/historico?page=${page - 1}&limit=${limit}`}
                    variant="secondary"
                  >
                    Anterior
                  </ButtonLink>
                ) : null}
                {hasNext ? (
                  <ButtonLink
                    href={`/historico?page=${page + 1}&limit=${limit}`}
                    variant="secondary"
                  >
                    Proxima
                  </ButtonLink>
                ) : null}
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}
