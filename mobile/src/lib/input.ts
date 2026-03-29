export function normalizeDecimalInput(raw: string) {
  return raw.replace(/[^0-9,\.]/g, '').replace('.', ',');
}

export function normalizeDecimalWithScale(raw: string, maxDecimals: number, maxIntegerDigits?: number) {
  const clean = raw.replace(/[^0-9,]/g, '');
  const [integerPart = '', decimalPart = ''] = clean.split(',');
  const normalizedInteger = maxIntegerDigits
    ? integerPart.slice(0, maxIntegerDigits)
    : integerPart;
  const normalizedDecimal = decimalPart.slice(0, maxDecimals);

  if (clean.includes(',')) {
    return `${normalizedInteger},${normalizedDecimal}`;
  }

  return normalizedInteger;
}

export function normalizeBrlCurrencyInput(raw: string, maxIntegerDigits = 3) {
  const digits = raw.replace(/\D/g, '').slice(0, maxIntegerDigits + 2);

  if (!digits) {
    return '';
  }

  const padded = digits.padStart(3, '0');
  const cents = padded.slice(-2);
  const units = String(Number(padded.slice(0, -2)));

  return `R$ ${units},${cents}`;
}

export function normalizeIntegerInput(raw: string) {
  return raw.replace(/\D/g, '');
}

export function normalizeKilometerInput(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 6);

  if (!digits) {
    return '';
  }

  const groups: string[] = [];

  for (let index = digits.length; index > 0; index -= 3) {
    groups.unshift(digits.slice(Math.max(0, index - 3), index));
  }

  return `${groups.join('.')} km`;
}

export function toNumberFromLocalizedInput(raw: string) {
  const normalized = raw
    .trim()
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(',', '.');

  return Number(normalized);
}

export function toIntegerFromMaskedInput(raw: string) {
  return Number(raw.replace(/\D/g, ''));
}

export function formatCurrencyBrl(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function normalizePlateInput(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}
