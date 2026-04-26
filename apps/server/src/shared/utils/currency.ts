// FILE: apps/server/src/shared/utils/currency.ts
// PURPOSE: Exchange rate fetching + conversion using frankfurter.app (free, no key)
// DEPENDS ON: redis cache
// LAST UPDATED: F33 - Multi-Currency Support

import Decimal from "decimal.js";
import { cacheGet, cacheSet } from "../../config/redis";
import { logger } from "./logger";

// ─────────────────────────────────────────────
// Supported currencies
// ─────────────────────────────────────────────

export const SUPPORTED_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "JPY",
  "SGD",
  "AED",
  "CHF",
  "SEK",
  "NOK",
  "NZD",
  "ZAR",
  "BRL",
  "MXN",
  "THB",
  "MYR",
  "PHP",
  "IDR",
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// ─────────────────────────────────────────────
// Cache config
// ─────────────────────────────────────────────

const RATE_CACHE_KEY = "exchange_rates";
const RATE_CACHE_TTL = 6 * 60 * 60; // 6 hours in seconds

// ─────────────────────────────────────────────
// Rate storage: all rates relative to EUR (frankfurter base)
// ─────────────────────────────────────────────

interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
  fetchedAt: string;
}

// ─────────────────────────────────────────────
// Fetch fresh rates from frankfurter.app
// Free API: no key required, ~300 req/day limit
// ─────────────────────────────────────────────

async function fetchFreshRates(): Promise<ExchangeRates | null> {
  try {
    const currencies = SUPPORTED_CURRENCIES.join(",");
    const url = `https://api.frankfurter.app/latest?to=${currencies}`;

    logger.info("[Currency] Fetching rates from frankfurter.app...");

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      base: string;
      date: string;
      rates: Record<string, number>;
    };

    const result: ExchangeRates = {
      base: data.base,
      date: data.date,
      rates: {
        ...data.rates,
        [data.base]: 1, // Add base currency itself
      },
      fetchedAt: new Date().toISOString(),
    };

    logger.info(
      `[Currency] Fetched ${Object.keys(result.rates).length} rates (base: ${result.base}, date: ${result.date})`
    );

    return result;
  } catch (err) {
    const error = err as Error;
    logger.error("[Currency] Failed to fetch rates:", {
      message: error.message,
    });
    return null;
  }
}

// ─────────────────────────────────────────────
// Get rates (from cache or fetch fresh)
// ─────────────────────────────────────────────

export async function getExchangeRates(): Promise<ExchangeRates | null> {
  // Try cache first
  const cached = await cacheGet<ExchangeRates>(RATE_CACHE_KEY);
  if (cached) {
    return cached;
  }

  // Fetch fresh
  const fresh = await fetchFreshRates();
  if (fresh) {
    await cacheSet(RATE_CACHE_KEY, fresh, RATE_CACHE_TTL);
  }

  return fresh;
}

// ─────────────────────────────────────────────
// Force refresh rates (called by CRON)
// ─────────────────────────────────────────────

export async function refreshExchangeRates(): Promise<void> {
  const fresh = await fetchFreshRates();
  if (fresh) {
    await cacheSet(RATE_CACHE_KEY, fresh, RATE_CACHE_TTL);
    logger.info("[Currency] Rates refreshed and cached");
  }
}

// ─────────────────────────────────────────────
// Convert amount between currencies
//
// Uses EUR as intermediate (frankfurter base):
//   fromAmount → EUR → toAmount
//
// Formula:
//   eurAmount = fromAmount / rates[fromCurrency]
//   toAmount  = eurAmount * rates[toCurrency]
// ─────────────────────────────────────────────

export async function convertCurrency(
  amount: number | string | Decimal,
  fromCurrency: string,
  toCurrency: string
): Promise<Decimal> {
  // Same currency — no conversion needed
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return new Decimal(amount);
  }

  const rates = await getExchangeRates();

  if (!rates) {
    logger.warn(
      "[Currency] No exchange rates available — returning unconverted amount"
    );
    return new Decimal(amount);
  }

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  const fromRate = rates.rates[from];
  const toRate = rates.rates[to];

  if (!fromRate || !toRate) {
    logger.warn(
      `[Currency] Rate not found for ${from} or ${to} — returning unconverted`
    );
    return new Decimal(amount);
  }

  // Convert: amount → EUR → target
  const amountDecimal = new Decimal(amount);
  const eurAmount = amountDecimal.div(new Decimal(fromRate));
  const converted = eurAmount.mul(new Decimal(toRate));

  return converted.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

// ─────────────────────────────────────────────
// Get rate between two currencies
// ─────────────────────────────────────────────

export async function getRate(
  fromCurrency: string,
  toCurrency: string
): Promise<Decimal | null> {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return new Decimal(1);
  }

  const rates = await getExchangeRates();
  if (!rates) return null;

  const fromRate = rates.rates[fromCurrency.toUpperCase()];
  const toRate = rates.rates[toCurrency.toUpperCase()];

  if (!fromRate || !toRate) return null;

  return new Decimal(toRate).div(new Decimal(fromRate));
}

// ─────────────────────────────────────────────
// Currency metadata
// ─────────────────────────────────────────────

export const CURRENCY_INFO: Record<
  string,
  { symbol: string; name: string; locale: string }
> = {
  INR: { symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  USD: { symbol: "$", name: "US Dollar", locale: "en-US" },
  EUR: { symbol: "€", name: "Euro", locale: "de-DE" },
  GBP: { symbol: "£", name: "British Pound", locale: "en-GB" },
  AUD: { symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  CAD: { symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  JPY: { symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  SGD: { symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  AED: { symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE" },
  CHF: { symbol: "CHF", name: "Swiss Franc", locale: "de-CH" },
  SEK: { symbol: "kr", name: "Swedish Krona", locale: "sv-SE" },
  NOK: { symbol: "kr", name: "Norwegian Krone", locale: "nb-NO" },
  NZD: { symbol: "NZ$", name: "New Zealand Dollar", locale: "en-NZ" },
  ZAR: { symbol: "R", name: "South African Rand", locale: "en-ZA" },
  BRL: { symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
  MXN: { symbol: "MX$", name: "Mexican Peso", locale: "es-MX" },
  THB: { symbol: "฿", name: "Thai Baht", locale: "th-TH" },
  MYR: { symbol: "RM", name: "Malaysian Ringgit", locale: "ms-MY" },
  PHP: { symbol: "₱", name: "Philippine Peso", locale: "en-PH" },
  IDR: { symbol: "Rp", name: "Indonesian Rupiah", locale: "id-ID" },
};