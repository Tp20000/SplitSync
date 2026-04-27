// FILE: apps/web/src/components/groups/SettleSuggestions.tsx
// PURPOSE: Visual display of simplified settlement suggestions with UPI payment
// DEPENDS ON: shadcn/ui, balance types, UpiPaymentModal, SettleButton
// LAST UPDATED: Payment Integration - UPI Deep Links

"use client";

import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  Smartphone,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SettleButton } from "./SettleButton";
import { UpiPaymentModal } from "@/components/settlements/UpiPaymentModal";
import { useUser } from "@/stores/authStore";
import {
  formatCurrency,
  getInitials,
  stringToColor,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { PairwiseDebt, SimplificationStats } from "@/types/balance";

interface SettleSuggestionsProps {
  debts: PairwiseDebt[];
  stats: SimplificationStats;
  currency: string;
  groupId: string;
}

export function SettleSuggestions({
  debts,
  stats,
  currency,
  groupId,
}: SettleSuggestionsProps) {
  const currentUser = useUser();
  const [selectedDebt, setSelectedDebt] =
    useState<PairwiseDebt | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);

  const allSettled = debts.length === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              {allSettled ? (
                <>
                  <CheckCircle2
                    size={16}
                    className="text-green-600"
                  />
                  All Settled Up! 🎉
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-amber-500" />
                  Smart Settlement Plan
                </>
              )}
            </CardTitle>
            <CardDescription>
              {allSettled
                ? "Everyone is even. No payments needed."
                : "Optimized payments to settle all debts."}
            </CardDescription>
          </div>

          {/* Optimization badge */}
          {!allSettled && stats.savings > 0 && (
            <Badge variant="success" className="gap-1 shrink-0">
              <TrendingDown size={12} />
              {stats.savings} fewer transfer
              {stats.savings !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Optimization stats */}
        {!allSettled && stats.naiveCount > 0 && (
          <div className="mb-4 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">
                  Without optimization
                </p>
                <p className="font-medium">
                  {stats.naiveCount} payment
                  {stats.naiveCount !== 1 ? "s" : ""}
                </p>
              </div>

              <ArrowRight
                size={16}
                className="text-muted-foreground shrink-0"
              />

              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">
                  With SplitSync
                </p>
                <p className="font-semibold text-green-600">
                  {stats.simplifiedCount} payment
                  {stats.simplifiedCount !== 1 ? "s" : ""}
                </p>
              </div>

              {stats.savingsPercent > 0 && (
                <Badge variant="outline" className="shrink-0">
                  {stats.savingsPercent}% saved
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Settled state */}
        {allSettled ? (
          <div className="py-8 text-center">
            <CheckCircle2
              className="mx-auto mb-3 text-green-600"
              size={40}
            />
            <p className="text-sm text-muted-foreground">
              No outstanding balances
            </p>
          </div>
        ) : (
          /* Debt list */
          <div className="space-y-1">
            {debts.map((debt, index) => {
              const isCurrentUserFrom =
                debt.from.userId === currentUser?.id;
              const isCurrentUserTo =
                debt.to.userId === currentUser?.id;
              const involvesCurrentUser =
                isCurrentUserFrom || isCurrentUserTo;

              return (
                <div key={index}>
                  <div
                    className={cn(
                      "flex items-center gap-2 sm:gap-3 rounded-lg p-2 sm:p-3 transition-colors",
                      involvesCurrentUser
                        ? "bg-primary/5 border border-primary/10"
                        : "hover:bg-muted/50"
                    )}
                  >
                    {/* Step number */}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {index + 1}
                    </div>

                    {/* From */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{
                          backgroundColor: stringToColor(
                            debt.from.name
                          ),
                        }}
                      >
                        {getInitials(debt.from.name)}
                      </div>
                      <span className="text-sm font-medium truncate">
                        {isCurrentUserFrom
                          ? "You"
                          : debt.from.name.split(" ")[0]}
                      </span>
                    </div>

                    {/* Arrow + Amount */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0 px-2">
                      <span
                        className={cn(
                          "text-sm font-bold tabular-nums",
                          isCurrentUserFrom
                            ? "text-red-600"
                            : isCurrentUserTo
                              ? "text-green-600"
                              : "text-foreground"
                        )}
                      >
                        {formatCurrency(debt.amount, currency)}
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-muted-foreground"
                      />
                    </div>

                    {/* To */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-medium truncate">
                        {isCurrentUserTo
                          ? "You"
                          : debt.to.name.split(" ")[0]}
                      </span>
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{
                          backgroundColor: stringToColor(
                            debt.to.name
                          ),
                        }}
                      >
                        {getInitials(debt.to.name)}
                      </div>
                    </div>

                    {/* Payment buttons — only for debts where current user pays */}
                    {isCurrentUserFrom && (
                      <div className="flex items-center gap-1 ml-1 shrink-0">
                        {/* Pay via UPI */}
                        <Button
                          variant="default"
                          size="sm"
                          className="gap-1 bg-green-600 hover:bg-green-700 h-7 text-xs"
                          onClick={() => {
                            setSelectedDebt(debt);
                            setPayModalOpen(true);
                          }}
                        >
                          <Smartphone size={12} />
                          Pay
                        </Button>

                        {/* Manual settle */}
                        <SettleButton
                          debt={debt}
                          groupId={groupId}
                          currentUserId={currentUser?.id ?? ""}
                          variant="outline"
                          size="sm"
                        />
                      </div>
                    )}

                    {/* Settle button for debts where current user receives */}
                    {isCurrentUserTo && !isCurrentUserFrom && (
                      <div className="ml-1 shrink-0">
                        <SettleButton
                          debt={debt}
                          groupId={groupId}
                          currentUserId={currentUser?.id ?? ""}
                          variant="outline"
                          size="sm"
                        />
                      </div>
                    )}
                  </div>
                  {index < debts.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary for current user */}
        {!allSettled && currentUser && (
          <UserSettleSummary
            debts={debts}
            currentUserId={currentUser.id}
            currency={currency}
          />
        )}
      </CardContent>

      {/* UPI Payment Modal */}
      {selectedDebt && (
        <UpiPaymentModal
          open={payModalOpen}
          onOpenChange={setPayModalOpen}
          debt={selectedDebt}
          groupId={groupId}
          currentUserId={currentUser?.id ?? ""}
        />
      )}
    </Card>
  );
}

// ─────────────────────────────────────────────
// User-specific summary — how much you owe/get
// ─────────────────────────────────────────────

function UserSettleSummary({
  debts,
  currentUserId,
  currency,
}: {
  debts: PairwiseDebt[];
  currentUserId: string;
  currency: string;
}) {
  let totalOwe = 0;
  let totalGet = 0;

  for (const debt of debts) {
    const amount = parseFloat(debt.amount);
    if (debt.from.userId === currentUserId) {
      totalOwe += amount;
    }
    if (debt.to.userId === currentUserId) {
      totalGet += amount;
    }
  }

  if (totalOwe === 0 && totalGet === 0) return null;

  return (
    <div className="mt-4 rounded-lg border p-3">
      <p className="text-xs text-muted-foreground mb-2">
        Your summary
      </p>
      <div className="flex items-center gap-4">
        {totalOwe > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">You pay</p>
            <p className="text-lg font-bold tabular-nums balance-negative">
              {formatCurrency(totalOwe, currency)}
            </p>
          </div>
        )}
        {totalGet > 0 && (
          <div>
            <p className="text-xs text-muted-foreground">
              You receive
            </p>
            <p className="text-lg font-bold tabular-nums balance-positive">
              {formatCurrency(totalGet, currency)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}