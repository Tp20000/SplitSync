// FILE: apps/web/src/lib/currencies.ts
// PURPOSE: Currency list, symbols, and formatting utilities
// DEPENDS ON: none
// LAST UPDATED: F33 - Multi-Currency Support

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
];

export function getCurrencySymbol(code: string): string {
  return (
    CURRENCIES.find(
      (c) => c.code === code.toUpperCase()
    )?.symbol ?? code
  );
}

export function getCurrencyName(code: string): string {
  return (
    CURRENCIES.find(
      (c) => c.code === code.toUpperCase()
    )?.name ?? code
  );
}