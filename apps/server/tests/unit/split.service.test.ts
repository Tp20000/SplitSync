// FILE: apps/server/tests/unit/split.service.test.ts
// PURPOSE: Unit tests for split calculation engine
// LAST UPDATED: F43 - Unit Tests

import Decimal from "decimal.js";
import { calculateSplits } from "../../src/modules/expenses/split.service";

describe("Split Service", () => {
  // ─────────────────────────────────────────
  // EQUAL SPLIT
  // ─────────────────────────────────────────

  describe("Equal Split", () => {
    it("should split evenly among 2 people", () => {
      const result = calculateSplits(1000, "equal", [
        { userId: "user1" },
        { userId: "user2" },
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].owedAmount.toFixed(2)).toBe("500.00");
      expect(result[1].owedAmount.toFixed(2)).toBe("500.00");
    });

    it("should split evenly among 3 people with remainder", () => {
      const result = calculateSplits(100, "equal", [
        { userId: "user1" },
        { userId: "user2" },
        { userId: "user3" },
      ]);

      expect(result).toHaveLength(3);

      // Total should equal exactly 100
      const total = result.reduce(
        (sum, r) => sum.plus(r.owedAmount),
        new Decimal(0)
      );
      expect(total.toFixed(2)).toBe("100.00");

      // First person gets the extra penny
      expect(result[0].owedAmount.toFixed(2)).toBe("33.34");
      expect(result[1].owedAmount.toFixed(2)).toBe("33.33");
      expect(result[2].owedAmount.toFixed(2)).toBe("33.33");
    });

    it("should handle single person", () => {
      const result = calculateSplits(500, "equal", [
        { userId: "user1" },
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].owedAmount.toFixed(2)).toBe("500.00");
    });

    it("should handle large group (10 people)", () => {
      const splits = Array.from({ length: 10 }, (_, i) => ({
        userId: `user${i + 1}`,
      }));

      const result = calculateSplits(1000, "equal", splits);

      expect(result).toHaveLength(10);

      const total = result.reduce(
        (sum, r) => sum.plus(r.owedAmount),
        new Decimal(0)
      );
      expect(total.toFixed(2)).toBe("1000.00");
    });

    it("should handle small amount with many people", () => {
      const splits = Array.from({ length: 7 }, (_, i) => ({
        userId: `user${i + 1}`,
      }));

      const result = calculateSplits(1, "equal", splits);

      const total = result.reduce(
        (sum, r) => sum.plus(r.owedAmount),
        new Decimal(0)
      );
      expect(total.toFixed(2)).toBe("1.00");
    });

    it("should throw for empty splits", () => {
      expect(() => {
        calculateSplits(100, "equal", []);
      }).toThrow();
    });
  });

  // ─────────────────────────────────────────
  // EXACT SPLIT
  // ─────────────────────────────────────────

  describe("Exact Split", () => {
    it("should accept exact amounts that equal total", () => {
      const result = calculateSplits(1000, "exact", [
        { userId: "user1", value: 600 },
        { userId: "user2", value: 400 },
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].owedAmount.toFixed(2)).toBe("600.00");
      expect(result[1].owedAmount.toFixed(2)).toBe("400.00");
    });

    it("should throw when amounts dont match total", () => {
      expect(() => {
        calculateSplits(1000, "exact", [
          { userId: "user1", value: 600 },
          { userId: "user2", value: 500 },
        ]);
      }).toThrow("Split amounts");
    });

    it("should handle decimal amounts", () => {
      const result = calculateSplits(99.99, "exact", [
        { userId: "user1", value: 33.33 },
        { userId: "user2", value: 33.33 },
        { userId: "user3", value: 33.33 },
      ]);

      const total = result.reduce(
        (sum, r) => sum.plus(r.owedAmount),
        new Decimal(0)
      );
      expect(total.toFixed(2)).toBe("99.99");
    });

    it("should throw for negative values", () => {
      expect(() => {
        calculateSplits(100, "exact", [
          { userId: "user1", value: -50 },
          { userId: "user2", value: 150 },
        ]);
      }).toThrow();
    });
  });

  // ─────────────────────────────────────────
  // PERCENTAGE SPLIT
  // ─────────────────────────────────────────

  describe("Percentage Split", () => {
    it("should split by percentage", () => {
      const result = calculateSplits(1000, "percentage", [
        { userId: "user1", value: 60 },
        { userId: "user2", value: 40 },
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].owedAmount.toFixed(2)).toBe("600.00");
      expect(result[1].owedAmount.toFixed(2)).toBe("400.00");
    });

    it("should throw when percentages dont sum to 100", () => {
      expect(() => {
        calculateSplits(1000, "percentage", [
          { userId: "user1", value: 60 },
          { userId: "user2", value: 50 },
        ]);
      }).toThrow("Percentages sum to");
    });

    it("should handle thirds (33.33 + 33.33 + 33.34)", () => {
      const result = calculateSplits(1000, "percentage", [
        { userId: "user1", value: 33.33 },
        { userId: "user2", value: 33.33 },
        { userId: "user3", value: 33.34 },
      ]);

      const total = result.reduce(
        (sum, r) => sum.plus(r.owedAmount),
        new Decimal(0)
      );
      expect(total.toFixed(2)).toBe("1000.00");
    });

    it("should handle 100% to one person", () => {
      const result = calculateSplits(500, "percentage", [
        { userId: "user1", value: 100 },
      ]);

      expect(result[0].owedAmount.toFixed(2)).toBe("500.00");
    });

    it("should handle rounding with odd percentages", () => {
      const result = calculateSplits(100, "percentage", [
        { userId: "user1", value: 33.33 },
        { userId: "user2", value: 33.33 },
        { userId: "user3", value: 33.34 },
      ]);

      const total = result.reduce(
        (sum, r) => sum.plus(r.owedAmount),
        new Decimal(0)
      );
      expect(total.toFixed(2)).toBe("100.00");
    });
  });

  // ─────────────────────────────────────────
  // SHARES SPLIT
  // ─────────────────────────────────────────

  describe("Shares Split", () => {
    it("should split by shares proportionally", () => {
      const result = calculateSplits(900, "shares", [
        { userId: "user1", value: 2 },
        { userId: "user2", value: 1 },
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].owedAmount.toFixed(2)).toBe("600.00");
      expect(result[1].owedAmount.toFixed(2)).toBe("300.00");
    });

    it("should handle equal shares (same as equal split)", () => {
      const result = calculateSplits(1000, "shares", [
        { userId: "user1", value: 1 },
        { userId: "user2", value: 1 },
      ]);

      expect(result[0].owedAmount.toFixed(2)).toBe("500.00");
      expect(result[1].owedAmount.toFixed(2)).toBe("500.00");
    });

    it("should handle large share ratios", () => {
      const result = calculateSplits(1000, "shares", [
        { userId: "user1", value: 10 },
        { userId: "user2", value: 1 },
      ]);

      const total = result.reduce(
        (sum, r) => sum.plus(r.owedAmount),
        new Decimal(0)
      );
      expect(total.toFixed(2)).toBe("1000.00");

      // 10/11 of 1000 = 909.09
      expect(
        parseFloat(result[0].owedAmount.toFixed(2))
      ).toBeGreaterThan(900);
    });

    it("should handle rounding with shares", () => {
      const result = calculateSplits(100, "shares", [
        { userId: "user1", value: 1 },
        { userId: "user2", value: 1 },
        { userId: "user3", value: 1 },
      ]);

      const total = result.reduce(
        (sum, r) => sum.plus(r.owedAmount),
        new Decimal(0)
      );
      expect(total.toFixed(2)).toBe("100.00");
    });

    it("should throw for zero shares", () => {
      expect(() => {
        calculateSplits(100, "shares", [
          { userId: "user1", value: 0 },
        ]);
      }).toThrow();
    });
  });

  // ─────────────────────────────────────────
  // EDGE CASES
  // ─────────────────────────────────────────

  describe("Edge Cases", () => {
    it("should handle very large amounts", () => {
      const result = calculateSplits(99999999.99, "equal", [
        { userId: "user1" },
        { userId: "user2" },
      ]);

      const total = result.reduce(
        (sum, r) => sum.plus(r.owedAmount),
        new Decimal(0)
      );
      expect(total.toFixed(2)).toBe("99999999.99");
    });

    it("should handle very small amounts", () => {
      const result = calculateSplits(0.01, "equal", [
        { userId: "user1" },
        { userId: "user2" },
      ]);

      const total = result.reduce(
        (sum, r) => sum.plus(r.owedAmount),
        new Decimal(0)
      );
      expect(total.toFixed(2)).toBe("0.01");
    });

    it("should throw for invalid split type", () => {
      expect(() => {
        calculateSplits(100, "invalid" as "equal", [
          { userId: "user1" },
        ]);
      }).toThrow();
    });
  });
});