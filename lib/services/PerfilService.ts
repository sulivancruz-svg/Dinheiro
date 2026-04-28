interface DiagnosticoCalculado {
  saldoMensal: number;
  percentualComprometido: number;
  percentualDivida: number;
  patrimonio_liquido: number;
  valor_poupado: number;
  capacidade_poupanca: number;
}

/**
 * Service for financial profile classification
 * Based on 6 distinct profiles with specific characteristics
 */
export class PerfilService {
  /**
   * Classify user's financial profile based on calculated metrics
   * @param diagnostico - Calculated financial data
   * @returns One of 6 profile types
   */
  static classificarPerfil(diagnostico: DiagnosticoCalculado): string {
    const {
      saldoMensal,
      percentualComprometido,
      percentualDivida,
      patrimonio_liquido,
      valor_poupado,
    } = diagnostico;

    // Sobrevivente: saldo negativo ou % > 100
    if (saldoMensal < 0 || percentualComprometido > 100) {
      return "sobrevivente_financeiro";
    }

    // Gastador Emocional: saldo pequeno, % alto, sem poupança
    if (
      saldoMensal > 0 &&
      saldoMensal < 200 &&
      percentualComprometido > 80 &&
      valor_poupado < 1000
    ) {
      return "gastador_emocional";
    }

    // Acumulador Ansioso: guarda mas vive apertado
    if (
      valor_poupado > 1000 &&
      saldoMensal < 500 &&
      percentualDivida > 5
    ) {
      return "acumulador_ansioso";
    }

    // Potencial Travado: saldo alto, % baixo, mas sem guardar
    if (
      saldoMensal > 2000 &&
      percentualComprometido < 60 &&
      valor_poupado < 5000 &&
      patrimonio_liquido < 15000
    ) {
      return "potencial_travado";
    }

    // Construtor de Patrimônio: tudo positivo
    if (
      saldoMensal > 1000 &&
      percentualComprometido < 60 &&
      percentualDivida < 5 &&
      patrimonio_liquido > 20000
    ) {
      return "construtor_patrimonio";
    }

    // Default: Organizador em Construção
    return "organizador_em_construcao";
  }

  /**
   * Get human-readable description of a profile
   * @param perfil - Profile type
   * @returns Portuguese description
   */
  static getPerfilDescricao(perfil: string): string {
    const descricoes: Record<string, string> = {
      sobrevivente_financeiro:
        "Você está vivendo apagando incêndios. Precisamos organizar isso.",
      gastador_emocional:
        "O dinheiro entra e desaparece rápido. Vamos entender para onde vai.",
      acumulador_ansioso:
        "Você guarda, mas vive com medo de faltar. É hora de relaxar e confiar.",
      organizador_em_construcao:
        "Você tem método, mas precisa de direção para crescer.",
      potencial_travado:
        "Você pode crescer, mas algo está bloqueando. Vamos descobrir.",
      construtor_patrimonio:
        "Você já está no caminho certo. Agora é otimizar a estratégia.",
    };

    return descricoes[perfil] || "Perfil financeiro não classificado";
  }
}
