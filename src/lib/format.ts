'use client';

// Parse numbers that may come as strings in either US (1,234.56) or BR (1.234,56) formats
export function toNumberPT(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value !== 'string') {
    try {
      return Number(value as number);
    } catch {
      return 0;
    }
  }

  const s = value.trim();
  if (!s) return 0;

  // If contains comma, treat comma as decimal separator (pt-BR style)
  if (s.includes(',')) {
    const noThousands = s.replace(/\./g, '');
    const normalized = noThousands.replace(/,/g, '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // Otherwise, rely on dot as decimal separator
  const parsed = Number.parseFloat(s);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toIntegerPT(value: unknown): string {
  const n = toNumberPT(value);
  return Number(n).toLocaleString('pt-BR');
}

export function toBRL(value: unknown): string {
  const n = toNumberPT(value);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

export function toPercent(value: unknown, fractionDigits = 2): string {
  const n = toNumberPT(value);
  return `${n.toFixed(fractionDigits).replace('.', ',')}%`;
}

