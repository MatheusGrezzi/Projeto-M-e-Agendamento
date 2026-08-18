export function formatCurrencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateBr(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function formatDateTimeBr(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}
