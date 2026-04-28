export interface Caixinhas {
  essencial: number;
  dividas: number;
  futuro: number;
  prazer: number;
  crescimento: number;
  grandes_planos: number;
  generosidade: number;
}

export interface DiagnosticoForCaixinhas {
  perfil: string;
  rendaTotal: number;
  saldoMensal: number;
  percentualDivida?: number;
}

/**
 * Service for budget allocation across 7 categories (Caixinhas)
 * Suggests percentual distribution based on financial profile
 */
export class CaixinhasService {
  /**
   * Suggest caixinhas distribution based on user's financial profile
   * @param diagnostico - User's financial diagnosis with profile
   * @returns Percentual allocation for 7 budget categories
   */
  static sugerirCaixinhas(diagnostico: DiagnosticoForCaixinhas): Caixinhas {
    const { perfil, percentualDivida = 0 } = diagnostico;

    let caixinhas: Caixinhas;

    if (perfil === "sobrevivente_financeiro") {
      // Spends more than earns: all resources for essentials + debt
      caixinhas = {
        essencial: 100,
        dividas: 0,
        futuro: 0,
        prazer: 0,
        crescimento: 0,
        grandes_planos: 0,
        generosidade: 0,
      };
    } else if (perfil === "gastador_emocional") {
      // Spends everything: focus on essentials + debt + small reserve
      caixinhas = {
        essencial: 50,
        dividas: 30,
        futuro: 20,
        prazer: 0,
        crescimento: 0,
        grandes_planos: 0,
        generosidade: 0,
      };
    } else if (perfil === "acumulador_ansioso") {
      // Saves but lives tight: prioritize essentials + debt + future
      caixinhas = {
        essencial: 50,
        dividas: 20,
        futuro: 20,
        prazer: 5,
        crescimento: 3,
        grandes_planos: 0,
        generosidade: 2,
      };
    } else if (perfil === "organizador_em_construcao") {
      // Has method: balance with margin for pleasure
      caixinhas = {
        essencial: 50,
        dividas: 20,
        futuro: 15,
        prazer: 10,
        crescimento: 3,
        grandes_planos: 1,
        generosidade: 1,
      };
    } else if (perfil === "potencial_travado") {
      // Can grow but blocked: suggest starting to save
      caixinhas = {
        essencial: 50,
        dividas: percentualDivida > 5 ? 15 : 10,
        futuro: 20,
        prazer: 10,
        crescimento: 5,
        grandes_planos: 2,
        generosidade: 3,
      };
    } else {
      // construtor_patrimonio: diversified
      caixinhas = {
        essencial: 50,
        dividas: 5,
        futuro: 20,
        prazer: 15,
        crescimento: 5,
        grandes_planos: 3,
        generosidade: 2,
      };
    }

    return caixinhas;
  }

  /**
   * Calculate actual monetary values for each caixinha
   * @param rendaTotal - Total monthly income
   * @param percentuais - Percentual allocation for each category
   * @returns Actual amounts for each category
   */
  static calcularValoresCaixinhas(
    rendaTotal: number,
    percentuais: Caixinhas
  ): Record<string, number> {
    return {
      essencial: Math.round((rendaTotal * percentuais.essencial) / 100),
      dividas: Math.round((rendaTotal * percentuais.dividas) / 100),
      futuro: Math.round((rendaTotal * percentuais.futuro) / 100),
      prazer: Math.round((rendaTotal * percentuais.prazer) / 100),
      crescimento: Math.round((rendaTotal * percentuais.crescimento) / 100),
      grandes_planos: Math.round(
        (rendaTotal * percentuais.grandes_planos) / 100
      ),
      generosidade: Math.round(
        (rendaTotal * percentuais.generosidade) / 100
      ),
    };
  }
}
