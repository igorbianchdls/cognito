/**
 * Dados da oferta do OttoCut. Preencha aqui quando estiverem definidos — a página se ajusta sozinha:
 * - checkoutUrl vazio: os botões levam para a seção da oferta, que mostra "valor de lançamento em breve".
 * - price/fromPrice/installments nulos: o bloco de preço não mostra valores.
 */
export const OTTOCUT_OFFER = {
  checkoutUrl: '',
  /** Preço "por", em reais (ex.: 197). */
  price: null as number | null,
  /** Preço "de", para ancoragem (ex.: 497). */
  fromPrice: null as number | null,
  /** Parcelamento (ex.: { count: 12, value: 19.7 }). */
  installments: null as { count: number; value: number } | null,
  /** Prazo de garantia em dias (7 é o direito de arrependimento do CDC para compras online). */
  guaranteeDays: 7,
}
