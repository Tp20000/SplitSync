// FILE: apps/server/tests/unit/debt-simplifier.test.ts
// PURPOSE: Unit tests for debt simplification algorithm
// LAST UPDATED: F43 - Unit Tests

import Decimal from "decimal.js";
import {
  simplifyDebts,
  countNaiveDebts,
  simplifyWithStats,
  type PersonInfo,
} from "../../src/modules/settlements/debt-simplifier";

// Helper to create person map
function makePersonMap(
  ...names: string[]
): Map<string, PersonInfo> {
  const map = new Map<string, PersonInfo>();
  names.forEach((name, i) => {
    map.set(`user${i + 1}`, {
      userId: `user${i + 1}`,
      name,
      avatarUrl: null,
    });
  });
  return map;
}

describe("Debt Simplifier", () => {
  describe("simplifyDebts", () => {
    it("should handle simple two-person debt", () => {
      const balances = new Map<string, Decimal>();
      balances.set("user1", new Decimal("-500")); // owes
      balances.set("user2", new Decimal("500"));  // owed

      const persons = makePersonMap("Alice", "Bob");
      const result = simplifyDebts(balances, persons, "INR");

      expect(result).toHaveLength(1);
      expect(result[0].from.name).toBe("Alice");
      expect(result[0].to.name).toBe("Bob");
      expect(result[0].amount).toBe("500.00");
    });

    it("should simplify chain: A→B→C to A→C", () => {
      const balances = new Map<string, Decimal>();
      balances.set("user1", new Decimal("-500")); // Alice owes 500
      balances.set("user2", new Decimal("0"));    // Bob is even
      balances.set("user3", new Decimal("500"));  // Charlie is owed 500

      const persons = makePersonMap("Alice", "Bob", "Charlie");
      const result = simplifyDebts(balances, persons, "INR");

      expect(result).toHaveLength(1);
      expect(result[0].from.name).toBe("Alice");
      expect(result[0].to.name).toBe("Charlie");
      expect(result[0].amount).toBe("500.00");
    });

    it("should handle multiple debtors and creditors", () => {
      const balances = new Map<string, Decimal>();
      balances.set("user1", new Decimal("-300")); // Alice owes
      balances.set("user2", new Decimal("-200")); // Bob owes
      balances.set("user3", new Decimal("350"));  // Charlie owed
      balances.set("user4", new Decimal("150"));  // Dave owed

      const persons = makePersonMap(
        "Alice",
        "Bob",
        "Charlie",
        "Dave"
      );
      const result = simplifyDebts(balances, persons, "INR");

      // Total transfers should balance
      let totalFrom = new Decimal(0);
      let totalTo = new Decimal(0);

      result.forEach((d) => {
        totalFrom = totalFrom.plus(d.amount);
        totalTo = totalTo.plus(d.amount);
      });

      // Should produce at most N-1 = 3 transactions
      expect(result.length).toBeLessThanOrEqual(3);

      // Each transfer amount should be positive
      result.forEach((d) => {
        expect(parseFloat(d.amount)).toBeGreaterThan(0);
      });
    });

    it("should return empty when all balanced", () => {
      const balances = new Map<string, Decimal>();
      balances.set("user1", new Decimal("0"));
      balances.set("user2", new Decimal("0"));
      balances.set("user3", new Decimal("0"));

      const persons = makePersonMap("Alice", "Bob", "Charlie");
      const result = simplifyDebts(balances, persons, "INR");

      expect(result).toHaveLength(0);
    });

    it("should ignore tiny amounts below threshold", () => {
      const balances = new Map<string, Decimal>();
      balances.set("user1", new Decimal("-0.005")); // Below 0.01
      balances.set("user2", new Decimal("0.005"));

      const persons = makePersonMap("Alice", "Bob");
      const result = simplifyDebts(balances, persons, "INR");

      expect(result).toHaveLength(0);
    });

    it("should handle single debtor single creditor", () => {
      const balances = new Map<string, Decimal>();
      balances.set("user1", new Decimal("-1000"));
      balances.set("user2", new Decimal("1000"));

      const persons = makePersonMap("Alice", "Bob");
      const result = simplifyDebts(balances, persons, "INR");

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe("1000.00");
    });

    it("should handle 5 people with complex balances", () => {
      const balances = new Map<string, Decimal>();
      balances.set("user1", new Decimal("-400"));
      balances.set("user2", new Decimal("-100"));
      balances.set("user3", new Decimal("200"));
      balances.set("user4", new Decimal("150"));
      balances.set("user5", new Decimal("150"));

      const persons = makePersonMap(
        "Alice",
        "Bob",
        "Charlie",
        "Dave",
        "Eve"
      );
      const result = simplifyDebts(balances, persons, "INR");

      // At most N-1 = 4 transactions
      expect(result.length).toBeLessThanOrEqual(4);

      // Verify balance: total debts paid = total credits received
      let totalTransferred = new Decimal(0);
      result.forEach((d) => {
        totalTransferred = totalTransferred.plus(d.amount);
      });

      expect(totalTransferred.toFixed(2)).toBe("500.00");
    });
  });

  describe("countNaiveDebts", () => {
    it("should count pairwise debts from expenses", () => {
      const expenses = [
        {
          paidBy: "user1",
          splits: [
            { userId: "user1", owedAmount: new Decimal(50) },
            { userId: "user2", owedAmount: new Decimal(50) },
          ],
        },
        {
          paidBy: "user2",
          splits: [
            { userId: "user1", owedAmount: new Decimal(30) },
            { userId: "user2", owedAmount: new Decimal(30) },
          ],
        },
      ];

      const count = countNaiveDebts(expenses);

      // user2→user1: 50, user1→user2: 30 — net: user2→user1: 20
      expect(count).toBe(1);
    });

    it("should return 0 when no debts", () => {
      const expenses = [
        {
          paidBy: "user1",
          splits: [
            { userId: "user1", owedAmount: new Decimal(100) },
          ],
        },
      ];

      const count = countNaiveDebts(expenses);
      expect(count).toBe(0);
    });
  });

  describe("simplifyWithStats", () => {
    it("should return correct stats", () => {
      const balances = new Map<string, Decimal>();
      balances.set("user1", new Decimal("-500"));
      balances.set("user2", new Decimal("200"));
      balances.set("user3", new Decimal("300"));

      const persons = makePersonMap("Alice", "Bob", "Charlie");
      const result = simplifyWithStats(
        balances,
        persons,
        "INR",
        4 // naive count
      );

      expect(result.stats.naiveCount).toBe(4);
      expect(result.stats.simplifiedCount).toBe(
        result.debts.length
      );
      expect(result.stats.savings).toBe(
        4 - result.debts.length
      );
      expect(result.stats.savingsPercent).toBeGreaterThanOrEqual(0);
    });
  });
});