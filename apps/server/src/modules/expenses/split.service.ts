// FILE: apps/server/src/modules/expenses/split.service.ts
// PURPOSE: Calculates owed amounts for each split type using decimal.js
// DEPENDS ON: decimal.js, ApiError
// LAST UPDATED: F13 - Expense CRUD API

import Decimal from "decimal.js";
import { ApiError, ErrorCode } from "../../shared/utils/ApiError";
import type { SplitEntry, SplitType } from "./expense.validation";

// ─────────────────────────────────────────────
// Result type
// ─────────────────────────────────────────────

export interface CalculatedSplit {
  userId: string;
  owedAmount: Decimal;
}

// ─────────────────────────────────────────────
// Main split calculator
// ─────────────────────────────────────────────

export function calculateSplits(
  totalAmount: number,
  splitType: SplitType,
  splits: SplitEntry[]
): CalculatedSplit[] {
  const total = new Decimal(totalAmount);

  switch (splitType) {
    case "equal":
      return calculateEqual(total, splits);
    case "exact":
      return calculateExact(total, splits);
    case "percentage":
      return calculatePercentage(total, splits);
    case "shares":
      return calculateShares(total, splits);
    default:
      throw ApiError.badRequest(
        `Invalid split type: ${splitType as string}`,
        ErrorCode.INVALID_INPUT
      );
  }
}

// ─────────────────────────────────────────────
// EQUAL SPLIT
// Divides evenly, assigns remainder cents to first participants
// ─────────────────────────────────────────────

function calculateEqual(
  total: Decimal,
  splits: SplitEntry[]
): CalculatedSplit[] {
  const count = splits.length;
  if (count === 0) {
    throw ApiError.badRequest(
      "At least one participant is required",
      ErrorCode.INSUFFICIENT_SPLIT
    );
  }

  // Base amount per person (rounded down to 2 decimals)
  const baseAmount = total.div(count).toDecimalPlaces(2, Decimal.ROUND_DOWN);

  // Remainder after rounding (in cents)
  const distributed = baseAmount.mul(count);
  const remainder = total.minus(distributed);
  const remainderCents = remainder.mul(100).toNumber();

  return splits.map((split, index) => ({
    userId: split.userId,
    owedAmount:
      index < remainderCents
        ? baseAmount.plus(new Decimal("0.01"))
        : baseAmount,
  }));
}

// ─────────────────────────────────────────────
// EXACT SPLIT
// Each person specifies exactly how much they owe
// Sum must equal totalAmount
// ─────────────────────────────────────────────

function calculateExact(
  total: Decimal,
  splits: SplitEntry[]
): CalculatedSplit[] {
  let sum = new Decimal(0);

  const result: CalculatedSplit[] = splits.map((split) => {
    if (split.value === undefined || split.value < 0) {
      throw ApiError.badRequest(
        "Each split must have a positive value for exact split",
        ErrorCode.SPLIT_MISMATCH
      );
    }

    const amount = new Decimal(split.value).toDecimalPlaces(2);
    sum = sum.plus(amount);

    return {
      userId: split.userId,
      owedAmount: amount,
    };
  });

  // Verify sum matches total (with small tolerance for floating point)
  if (!sum.equals(total)) {
    throw ApiError.badRequest(
      `Split amounts (${sum.toFixed(2)}) do not equal total (${total.toFixed(2)})`,
      ErrorCode.SPLIT_MISMATCH
    );
  }

  return result;
}

// ─────────────────────────────────────────────
// PERCENTAGE SPLIT
// Each person specifies a percentage (must sum to 100)
// ─────────────────────────────────────────────

function calculatePercentage(
  total: Decimal,
  splits: SplitEntry[]
): CalculatedSplit[] {
  let percentageSum = new Decimal(0);

  const rawResults: { userId: string; percentage: Decimal }[] = [];

  for (const split of splits) {
    if (
      split.value === undefined ||
      split.value < 0 ||
      split.value > 100
    ) {
      throw ApiError.badRequest(
        "Each percentage must be between 0 and 100",
        ErrorCode.SPLIT_MISMATCH
      );
    }

    const pct = new Decimal(split.value);
    percentageSum = percentageSum.plus(pct);

    rawResults.push({ userId: split.userId, percentage: pct });
  }

  // Verify percentages sum to 100
  if (!percentageSum.equals(new Decimal(100))) {
    throw ApiError.badRequest(
      `Percentages sum to ${percentageSum.toFixed(2)}%, must equal 100%`,
      ErrorCode.SPLIT_MISMATCH
    );
  }

  // Calculate amounts
  const results: CalculatedSplit[] = rawResults.map((r) => ({
    userId: r.userId,
    owedAmount: total
      .mul(r.percentage)
      .div(100)
      .toDecimalPlaces(2, Decimal.ROUND_DOWN),
  }));

  // Fix rounding: assign remainder to first person
  const distributed = results.reduce(
    (sum, r) => sum.plus(r.owedAmount),
    new Decimal(0)
  );
  const remainder = total.minus(distributed);

  if (remainder.greaterThan(0) && results.length > 0) {
    results[0].owedAmount = results[0].owedAmount.plus(remainder);
  }

  return results;
}

// ─────────────────────────────────────────────
// SHARES SPLIT
// Each person specifies number of shares
// Amount proportional to shares
// ─────────────────────────────────────────────

function calculateShares(
  total: Decimal,
  splits: SplitEntry[]
): CalculatedSplit[] {
  let totalShares = new Decimal(0);

  for (const split of splits) {
    if (split.value === undefined || split.value <= 0) {
      throw ApiError.badRequest(
        "Each participant must have at least 1 share",
        ErrorCode.SPLIT_MISMATCH
      );
    }
    totalShares = totalShares.plus(new Decimal(split.value));
  }

  if (totalShares.isZero()) {
    throw ApiError.badRequest(
      "Total shares must be greater than 0",
      ErrorCode.SPLIT_MISMATCH
    );
  }

  // Calculate per-share amount
  const results: CalculatedSplit[] = splits.map((split) => {
    const shares = new Decimal(split.value ?? 1);
    return {
      userId: split.userId,
      owedAmount: total
        .mul(shares)
        .div(totalShares)
        .toDecimalPlaces(2, Decimal.ROUND_DOWN),
    };
  });

  // Fix rounding remainder
  const distributed = results.reduce(
    (sum, r) => sum.plus(r.owedAmount),
    new Decimal(0)
  );
  const remainder = total.minus(distributed);

  if (remainder.greaterThan(0) && results.length > 0) {
    results[0].owedAmount = results[0].owedAmount.plus(remainder);
  }

  return results;
}