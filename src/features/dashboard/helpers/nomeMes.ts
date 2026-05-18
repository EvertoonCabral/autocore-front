/** Nome do mês em PT-BR a partir de número 1..12. */
export function nomeMesPtBr(mes: number | undefined): string {
  if (!mes || mes < 1 || mes > 12) return 'este mês'
  const nomes = [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ]
  return nomes[mes - 1] ?? 'este mês'
}
