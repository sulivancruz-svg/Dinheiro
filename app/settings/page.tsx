import { ButtonLink } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { ConsentToggle } from "@/components/settings/ConsentToggle";
import { DataExportButton } from "@/components/settings/DataExportButton";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const consentConfig = [
  {
    tipo: "WHATSAPP" as const,
    title: "Comunicacao por WhatsApp",
    description:
      "Permite receber lembretes, avisos de progresso e mensagens educacionais pelo WhatsApp quando essa integracao estiver ativa.",
  },
  {
    tipo: "EMAIL_MARKETING" as const,
    title: "Emails de conteudo e novidades",
    description:
      "Permite receber materiais educativos, melhorias do produto e comunicacoes de marketing por email.",
  },
];

export default async function SettingsPage() {
  const user = await requireAuth();

  const [account, consentimentos, diagnosticosCount, chatSessionsCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          email: true,
          name: true,
          plano: true,
          createdAt: true,
        },
      }),
      prisma.consentimento.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.diagnostico.count({
        where: { userId: user.id },
      }),
      prisma.chatSession.count({
        where: { userId: user.id },
      }),
    ]);

  const consentByType = new Map(
    consentimentos.map((consent) => [consent.tipo, consent])
  );

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#fff8ec,#f2dcad)] px-5 py-8">
      <section className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-[var(--color-clay)]">
              Configuracoes
            </p>
            <h1 className="font-display mt-2 text-5xl font-black leading-none tracking-[-0.06em] text-[var(--color-ink)]">
              Conta, privacidade e LGPD.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Controle seus consentimentos e veja o que ja esta associado a sua
              conta.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/dashboard" variant="secondary">
              Dashboard
            </ButtonLink>
            <ButtonLink href="/historico" variant="ghost">
              Historico
            </ButtonLink>
          </div>
        </header>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="bg-[var(--color-ink)] text-[var(--color-paper)]">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--color-gold)]">
              Conta
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em]">
              {account?.name || user.name || "Usuario"}
            </h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-white/60">Email</dt>
                <dd className="mt-1 font-bold">{account?.email || user.email}</dd>
              </div>
              <div>
                <dt className="text-white/60">Plano</dt>
                <dd className="mt-1 font-bold uppercase">
                  {account?.plano || "free"}
                </dd>
              </div>
              {account?.createdAt ? (
                <div>
                  <dt className="text-white/60">Conta criada em</dt>
                  <dd className="mt-1 font-bold">
                    {dateFormatter.format(account.createdAt)}
                  </dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card>
            <CardTitle>Resumo dos seus dados</CardTitle>
            <CardDescription>
              Estes numeros ajudam a entender o que sera considerado em futuras
              acoes de exportacao ou exclusao LGPD.
            </CardDescription>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-[var(--color-sand)]/45 p-5">
                <p className="text-sm text-[var(--color-muted)]">Diagnosticos</p>
                <p className="mt-2 text-3xl font-black">{diagnosticosCount}</p>
              </div>
              <div className="rounded-[1.5rem] bg-[var(--color-sand)]/45 p-5">
                <p className="text-sm text-[var(--color-muted)]">Conversas</p>
                <p className="mt-2 text-3xl font-black">{chatSessionsCount}</p>
              </div>
              <div className="rounded-[1.5rem] bg-[var(--color-sand)]/45 p-5">
                <p className="text-sm text-[var(--color-muted)]">Consentimentos</p>
                <p className="mt-2 text-3xl font-black">{consentimentos.length}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mt-5">
          <CardTitle>Consentimentos</CardTitle>
          <CardDescription>
            Voce pode ativar ou revogar consentimentos a qualquer momento.
          </CardDescription>
          <div className="mt-6 space-y-4">
            {consentConfig.map((config) => {
              const consent = consentByType.get(config.tipo);

              return (
                <ConsentToggle
                  description={config.description}
                  initialAccepted={consent?.aceito || false}
                  key={config.tipo}
                  tipo={config.tipo}
                  title={config.title}
                  updatedAt={
                    consent?.updatedAt
                      ? dateFormatter.format(consent.updatedAt)
                      : undefined
                  }
                />
              );
            })}
          </div>
        </Card>

        <Card className="mt-5 border-[var(--color-clay)]/20 bg-[var(--color-paper)]/90">
          <CardTitle>LGPD</CardTitle>
          <CardDescription>
            Exporte uma copia dos dados associados a sua conta em JSON. A
            exclusao da conta com soft delete sera a proxima etapa.
          </CardDescription>
          <div className="mt-6 flex flex-wrap gap-3">
            <DataExportButton />
            <ButtonLink href="/settings" variant="ghost">
              Exclusao em breve
            </ButtonLink>
          </div>
        </Card>
      </section>
    </main>
  );
}
