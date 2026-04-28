/**
 * Service for financial diagnostico calculations
 * All amounts in Brazilian Real (R$)
 */
export class DiagnosticoService {
  /**
   * Calculate total monthly income
   * @param rendaFixa - Fixed income
   * @param rendaVariavel - Variable income
   * @returns Total income
   */
  static calcularRendaTotal(rendaFixa: number, rendaVariavel: number): number {
    return rendaFixa + rendaVariavel;
  }

  /**
   * Calculate total monthly expenses
   * @param gastosFixos - Fixed expenses
   * @param gastosVariaveis - Variable expenses
   * @returns Total expenses
   */
  static calcularGastosTotais(
    gastosFixos: number,
    gastosVariaveis: number
  ): number {
    return gastosFixos + gastosVariaveis;
  }

  /**
   * Calculate monthly balance (surplus/deficit)
   * @param rendaTotal - Total income
   * @param gastosTotais - Total expenses
   * @param parcelasMensais - Monthly debt payments
   * @returns Monthly balance
   */
  static calcularSaldoMensal(
    rendaTotal: number,
    gastosTotais: number,
    parcelasMensais: number
  ): number {
    return rendaTotal - gastosTotais - parcelasMensais;
  }

  /**
   * Calculate percentage of income committed to expenses and debt
   * @param gastosTotais - Total expenses
   * @param parcelasMensais - Monthly debt payments
   * @param rendaTotal - Total income
   * @returns Percentage (0-100+)
   */
  static calcularPercentualComprometido(
    gastosTotais: number,
    parcelasMensais: number,
    rendaTotal: number
  ): number {
    if (rendaTotal === 0) return 0;
    return ((gastosTotais + parcelasMensais) / rendaTotal) * 100;
  }

  /**
   * Calculate percentage of income committed to debt payments
   * @param parcelasMensais - Monthly debt payments
   * @param rendaTotal - Total income
   * @returns Percentage (0-100+)
   */
  static calcularPercentualDivida(
    parcelasMensais: number,
    rendaTotal: number
  ): number {
    if (rendaTotal === 0) return 0;
    return (parcelasMensais / rendaTotal) * 100;
  }

  /**
   * Calculate savings capacity (how much can be saved monthly)
   * @param saldoMensal - Monthly balance
   * @returns Savings capacity (minimum 0)
   */
  static calcularCapacidadePoupanca(saldoMensal: number): number {
    return Math.max(saldoMensal, 0);
  }

  /**
   * Calculate net worth (assets minus liabilities)
   * @param valorPoupado - Savings
   * @param valorInvestido - Investments
   * @param dividaTotal - Total debt
   * @returns Net worth
   */
  static calcularPatrimonioLiquido(
    valorPoupado: number,
    valorInvestido: number,
    dividaTotal: number
  ): number {
    return valorPoupado + valorInvestido - dividaTotal;
  }
}
