/** Enum `TipoIntencaoPagamento` do back: PixQr=1, LinkCheckout=2. */

export type TipoIntencaoPagamento = 1 | 2

export const TipoIntencaoValues = {
  PixQr: 1,
  LinkCheckout: 2,
} as const satisfies Record<string, TipoIntencaoPagamento>

export function tipoIntencaoLabel(value: TipoIntencaoPagamento | number | null | undefined): string {
  if (value === TipoIntencaoValues.PixQr) return 'Pix (QR)'
  if (value === TipoIntencaoValues.LinkCheckout) return 'Link de pagamento'
  return ''
}
