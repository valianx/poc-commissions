/**
 * Map country codes to their official currencies
 */
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  CL: "CLP", // Chile - Peso Chileno
  BR: "BRL", // Brazil - Real Brasileño
  PE: "PEN", // Peru - Sol Peruano
  CO: "COP", // Colombia - Peso Colombiano
  AR: "ARS", // Argentina - Peso Argentino
  MX: "MXN", // Mexico - Peso Mexicano
  UY: "UYU", // Uruguay - Peso Uruguayo
  PY: "PYG", // Paraguay - Guaraní
  EC: "USD", // Ecuador - Dólar (uses USD)
  PA: "PAB", // Panama - Balboa (uses USD alongside)
};

/**
 * Get the official currency for a country code
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns Currency code (ISO 4217) or undefined if not found
 */
export function getCurrencyForCountry(countryCode: string): string | undefined {
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()];
}

/**
 * Get currency symbol for a currency code
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  CLP: "$",
  BRL: "R$",
  PEN: "S/",
  COP: "$",
  ARS: "$",
  MXN: "$",
  UYU: "$U",
  PYG: "₲",
  USD: "$",
  PAB: "B/.",
};

/**
 * Get the symbol for a currency code
 * @param currencyCode - ISO 4217 currency code
 * @returns Currency symbol or the code itself if not found
 */
export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
}
