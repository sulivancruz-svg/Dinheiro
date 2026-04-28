require("dotenv/config");

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const seedUsers = [
  {
    name: "Sofia Sobrevivente",
    email: "sofia.sobrevivente@seed.dinheiro.local",
    diagnostico: {
      rendaFixa: 2800,
      rendaVariavel: 0,
      gastosFixos: 2100,
      gastosVariaveis: 650,
      dividaTotal: 18000,
      parcelasMensais: 620,
      valorPoupado: 150,
      valorInvestido: 0,
      objetivoCurto: "Parar de atrasar contas",
      objetivoLongo: "Sair das dividas",
    },
  },
  {
    name: "Bruno Gastador",
    email: "bruno.gastador@seed.dinheiro.local",
    diagnostico: {
      rendaFixa: 4200,
      rendaVariavel: 300,
      gastosFixos: 2600,
      gastosVariaveis: 1450,
      dividaTotal: 3200,
      parcelasMensais: 260,
      valorPoupado: 400,
      valorInvestido: 0,
      objetivoCurto: "Controlar compras por impulso",
      objetivoLongo: "Montar uma reserva",
    },
  },
  {
    name: "Camila Acumuladora",
    email: "camila.acumuladora@seed.dinheiro.local",
    diagnostico: {
      rendaFixa: 6200,
      rendaVariavel: 0,
      gastosFixos: 4100,
      gastosVariaveis: 900,
      dividaTotal: 12000,
      parcelasMensais: 780,
      valorPoupado: 22000,
      valorInvestido: 5000,
      objetivoCurto: "Organizar prioridades",
      objetivoLongo: "Investir com tranquilidade",
    },
  },
  {
    name: "Diego Organizador",
    email: "diego.organizador@seed.dinheiro.local",
    diagnostico: {
      rendaFixa: 7000,
      rendaVariavel: 500,
      gastosFixos: 3600,
      gastosVariaveis: 1600,
      dividaTotal: 6000,
      parcelasMensais: 450,
      valorPoupado: 9000,
      valorInvestido: 4000,
      objetivoCurto: "Melhorar controle mensal",
      objetivoLongo: "Comprar um imovel",
    },
  },
  {
    name: "Elisa Potencial",
    email: "elisa.potencial@seed.dinheiro.local",
    diagnostico: {
      rendaFixa: 12000,
      rendaVariavel: 1500,
      gastosFixos: 4300,
      gastosVariaveis: 2500,
      dividaTotal: 2000,
      parcelasMensais: 200,
      valorPoupado: 2500,
      valorInvestido: 3000,
      objetivoCurto: "Criar rotina de investimento",
      objetivoLongo: "Independencia financeira",
    },
  },
  {
    name: "Felipe Construtor",
    email: "felipe.construtor@seed.dinheiro.local",
    diagnostico: {
      rendaFixa: 15000,
      rendaVariavel: 2500,
      gastosFixos: 5200,
      gastosVariaveis: 2300,
      dividaTotal: 0,
      parcelasMensais: 0,
      valorPoupado: 35000,
      valorInvestido: 120000,
      objetivoCurto: "Otimizar carteira",
      objetivoLongo: "Acelerar patrimonio",
    },
  },
];

function calcularMetricas(diagnostico) {
  const rendaTotal = diagnostico.rendaFixa + diagnostico.rendaVariavel;
  const gastosTotal = diagnostico.gastosFixos + diagnostico.gastosVariaveis;
  const saldoMensal = rendaTotal - gastosTotal - diagnostico.parcelasMensais;
  const percentualComprometido =
    rendaTotal === 0
      ? 0
      : ((gastosTotal + diagnostico.parcelasMensais) / rendaTotal) * 100;
  const percentualDivida =
    rendaTotal === 0 ? 0 : (diagnostico.parcelasMensais / rendaTotal) * 100;
  const patrimonioLiquido =
    diagnostico.valorPoupado + diagnostico.valorInvestido - diagnostico.dividaTotal;

  return {
    rendaTotal,
    gastosTotal,
    saldoMensal,
    percentualComprometido,
    percentualDivida,
    patrimonioLiquido,
  };
}

function classificarPerfil(diagnostico, metricas) {
  if (metricas.saldoMensal < 0 || metricas.percentualComprometido > 100) {
    return "sobrevivente_financeiro";
  }

  if (
    metricas.saldoMensal > 0 &&
    metricas.saldoMensal < 200 &&
    metricas.percentualComprometido > 80 &&
    diagnostico.valorPoupado < 1000
  ) {
    return "gastador_emocional";
  }

  if (
    diagnostico.valorPoupado > 1000 &&
    metricas.saldoMensal < 500 &&
    metricas.percentualDivida > 5
  ) {
    return "acumulador_ansioso";
  }

  if (
    metricas.saldoMensal > 2000 &&
    metricas.percentualComprometido < 60 &&
    diagnostico.valorPoupado < 5000 &&
    metricas.patrimonioLiquido < 15000
  ) {
    return "potencial_travado";
  }

  if (
    metricas.saldoMensal > 1000 &&
    metricas.percentualComprometido < 60 &&
    metricas.percentualDivida < 5 &&
    metricas.patrimonioLiquido > 20000
  ) {
    return "construtor_patrimonio";
  }

  return "organizador_em_construcao";
}

function nivelRisco(metricas) {
  if (metricas.saldoMensal < 0 || metricas.percentualComprometido > 100) {
    return "alto";
  }

  if (metricas.percentualComprometido > 80 || metricas.percentualDivida > 15) {
    return "medio";
  }

  return "baixo";
}

async function main() {
  const emails = seedUsers.map((user) => user.email);

  await prisma.user.deleteMany({
    where: {
      email: {
        in: emails,
      },
    },
  });

  for (const seedUser of seedUsers) {
    const metricas = calcularMetricas(seedUser.diagnostico);
    const perfil = classificarPerfil(seedUser.diagnostico, metricas);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: seedUser.email,
          name: seedUser.name,
          emailVerified: new Date(),
          consentimentos: {
            create: [
              {
                tipo: "WHATSAPP",
                aceito: true,
                origin: "seed",
              },
              {
                tipo: "EMAIL_MARKETING",
                aceito: seedUser.email.includes("construtor"),
                origin: "seed",
              },
            ],
          },
          chatSessions: {
            create: {
              titulo: "Conversa inicial com Mentor",
              mensagens: {
                create: [
                  {
                    role: "user",
                    conteudo: "Qual deve ser meu primeiro passo este mes?",
                  },
                  {
                    role: "assistant",
                    conteudo:
                      "Comece pelo diagnostico: proteja o essencial, defina uma meta pequena e acompanhe semanalmente.",
                  },
                ],
              },
            },
          },
        },
      });

      const diagnostico = await tx.diagnostico.create({
        data: {
          userId: user.id,
          ...seedUser.diagnostico,
          origem: "seed",
        },
      });

      await tx.historicoMensal.create({
        data: {
          userId: user.id,
          diagnosticoId: diagnostico.id,
          mes: new Date("2026-04-01T00:00:00.000Z"),
          rendaTotal: metricas.rendaTotal,
          gastosTotal: metricas.gastosTotal,
          saldoMensal: metricas.saldoMensal,
          percentualComprometido: metricas.percentualComprometido,
          percentualDivida: metricas.percentualDivida,
          nivelRisco: nivelRisco(metricas),
          perfil,
          problemaPrincipal:
            metricas.saldoMensal < 0
              ? "Saldo mensal negativo"
              : "Falta de plano financeiro estruturado",
          prioridadeMes:
            perfil === "construtor_patrimonio"
              ? "Otimizar investimentos"
              : "Organizar caixinhas e reduzir desperdicios",
          metaEconomia: Math.max(Math.round(metricas.saldoMensal * 0.2), 0),
        },
      });
    });
  }

  await prisma.auditLog.create({
    data: {
      evento: "database_seeded",
      detalhes: JSON.stringify({
        users: seedUsers.length,
        profiles: seedUsers.map((user) =>
          classificarPerfil(user.diagnostico, calcularMetricas(user.diagnostico))
        ),
      }),
    },
  });

  console.info(`Seed completed: ${seedUsers.length} users created.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
