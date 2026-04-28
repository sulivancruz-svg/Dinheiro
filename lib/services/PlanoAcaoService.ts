/**
 * Service for generating monthly action plans (Plano de Ação)
 * Based on financial profile and diagnostico data
 * All amounts in Brazilian Real (R$)
 */

interface Diagnostico {
  perfil: string;
  saldoMensal: number;
  percentualComprometido: number;
  rendaTotal: number;
  capacidade_poupanca: number;
  percentualDivida?: number;
}

interface Plano {
  problemaPrincipal: string;
  prioridade: string;
  metaEconomia: number;
  acoes: string[];
  habitoSemanal: string;
  alerta: string;
}

/**
 * PlanoAcaoService generates personalized monthly action plans
 * for each of the 6 financial profiles
 */
export class PlanoAcaoService {
  /**
   * Generate a monthly action plan based on financial profile
   * @param diagnostico - Financial diagnostic data including profile
   * @returns Plano - Structured action plan with goals and habits
   */
  static gerarPlano(diagnostico: Diagnostico): Plano {
    const {
      perfil,
      saldoMensal,
      percentualDivida = 0,
      capacidade_poupanca,
    } = diagnostico;

    let problemaPrincipal = "";
    let prioridade = "";
    let metaEconomia = 0;
    const acoes: string[] = [];
    let habitoSemanal = "";
    let alerta = "";

    if (perfil === "sobrevivente_financeiro") {
      problemaPrincipal =
        "Você está gastando mais que ganha. Precisamos parar o sangramento.";
      prioridade = "Cortar gastos para ter saldo positivo";
      metaEconomia = Math.min(200, capacidade_poupanca * 0.5);
      acoes.push(
        "Faça uma lista de todos os gastos fixos e corte 30% daqueles que pode viver sem",
        "Cancele inscrições de apps/serviços que não usa",
        "Negocie redução em contas (internet, energia, etc)"
      );
      habitoSemanal = "Toda segunda-feira, anotar gastos da semana anterior";
      alerta =
        "Você vive no limite. Um imprevisto quebra você. Prioridade é criar margem.";
    } else if (perfil === "gastador_emocional") {
      problemaPrincipal =
        "O dinheiro entra mas desaparece rápido. Algo está drenando você.";
      prioridade = "Rastrear aonde o dinheiro vai e criar reserva mínima";
      metaEconomia = Math.min(150, capacidade_poupanca * 0.3);
      acoes.push(
        "Separe R$ 100-150 no dia do salário em conta/poupança diferente",
        "Rastreie gastos por 7 dias (anote tudo)",
        "Crie uma regra: antes de qualquer compra > R$50, espere 24h"
      );
      habitoSemanal =
        "Toda sexta, revisar gastos da semana. Ser honesto consigo mesmo.";
      alerta =
        "Você costuma gastar por ansiedade. Reconheça o gatilho (cansaço, tédio, emoção).";
    } else if (perfil === "acumulador_ansioso") {
      problemaPrincipal =
        "Você guarda, mas vive com medo. A dívida te assusta.";
      prioridade = "Criar uma reserva de emergência mínima (R$ 2-3 mil)";
      metaEconomia = Math.min(300, capacidade_poupanca * 0.5);
      acoes.push(
        "Abra uma poupança separada e coloque R$ 500 agora (para emergências)",
        "Faça um plano para pagar a dívida em 12-18 meses",
        "Depois, comece a investigar investimentos simples (não é urgente)"
      );
      habitoSemanal =
        "Toda quarta, confirmar que a poupança de emergência está lá. Respira.";
      alerta =
        "Você consegue guardar! O medo é normal, mas você está no caminho.";
    } else if (perfil === "organizador_em_construcao") {
      problemaPrincipal =
        "Você tem método, mas falta direção. Sua renda permite crescer.";
      prioridade = "Aumentar poupança de 10% para 20% da renda";
      metaEconomia = Math.min(700, capacidade_poupanca * 0.8);
      acoes.push(
        "Revise os gastos variáveis: pode cortar R$ 200-300 sem sofrimento",
        "Crie duas contas poupança: emergência (3 salários) + objetivo (viagem, etc)",
        "Invista em você: curso, livro. Educação vale o investimento."
      );
      habitoSemanal = "Toda segunda, revisar plano de poupança e ajustar.";
      alerta = "Você está bem, mas pode melhorar significativamente.";
    } else if (perfil === "potencial_travado") {
      problemaPrincipal =
        "Você consegue muito saldo, mas não está guardando nada. Por quê?";
      prioridade = "Entender a resistência e começar a guardar deliberadamente";
      metaEconomia = Math.min(2000, capacidade_poupanca * 0.5);
      acoes.push(
        "Automatize a poupança: no dia do salário, mande 20% para outra conta",
        "Defina um objetivo claro (viagem, carro, casa, investimento)",
        "Comece pequeno: R$ 500 agora, aumente depois"
      );
      habitoSemanal =
        "Toda quinta, confirmar que o dinheiro foi guardado. Comemorar.";
      alerta =
        "Você tem potencial real. Algo psicológico bloqueia você. Pode superar.";
    } else {
      // construtor_patrimonio
      problemaPrincipal =
        "Você já está organizando bem. Hora de otimizar a estratégia.";
      prioridade = "Diversificar: continuar guardando + começar a investir";
      metaEconomia = capacidade_poupanca;
      acoes.push(
        "Continue guardando 20%+ da renda (você consegue)",
        "Explore investimentos: fundos imobiliários, CDB, ações diversificadas",
        "Procure um advisor para personalizar sua estratégia"
      );
      habitoSemanal =
        "Toda primeira segunda do mês, revisar patrimônio e objetivos.";
      alerta =
        "Você está trilhando bem. Mantenha a disciplina e aumente a educação.";
    }

    return {
      problemaPrincipal,
      prioridade,
      metaEconomia,
      acoes,
      habitoSemanal,
      alerta,
    };
  }
}
