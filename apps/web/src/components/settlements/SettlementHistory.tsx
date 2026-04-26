// FILE: apps/web/src/components/settlements/SettlementHistory.tsx
// PURPOSE: List of past settlements in a group
// DEPENDS ON: useSettlements, shadcn/ui
// LAST UPDATED: F25 - Settlement Recording API

"use client";

import { ArrowRight, Banknote } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSettlements } from "@/hooks/useSettlements";
import { useUser } from "@/stores/authStore";
import {
  formatCurrency,
  formatDate,
  getInitials,
  stringToColor,
} from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SettlementHistoryProps {
  groupId: string;
}

export function SettlementHistory({
  groupId,
}: SettlementHistoryProps) {
  const currentUser = useUser();
  const { data, isLoading } = useSettlements(groupId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  const settlements = data?.settlements ?? [];

  if (settlements.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Banknote
            className="mx-auto mb-3 text-muted-foreground"
            size={32}
          />
          <p className="font-medium">No settlements yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use the Settle button on the Balances tab to record
            payments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Banknote size={16} />
          Settlement History
          <span className="text-sm font-normal text-muted-foreground">
            ({data?.meta?.total ?? settlements.length})
          </span>
        </CardTitle>
        <CardDescription>
          All recorded payments in this group
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {settlements.map((settlement, index) => {
          const amount = parseFloat(settlement.amount);
          const isCurrentPayer =
            settlement.paidBy === currentUser?.id;
          const isCurrentReceiver =
            settlement.paidTo === currentUser?.id;

          return (
            <div key={settlement.id}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3",
                  (isCurrentPayer || isCurrentReceiver) &&
                    "bg-primary/5"
                )}
              >
                {/* Payer avatar */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    backgroundColor: stringToColor(
                      settlement.paidByUser.name
                    ),
                  }}
                >
                  {getInitials(settlement.paidByUser.name)}
                </div>

                {/* Flow */}
                <div className="flex flex-1 items-center gap-2 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {isCurrentPayer
                      ? "You"
                      : settlement.paidByUser.name.split(" ")[0]}
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="text-sm font-medium truncate">
                    {isCurrentReceiver
                      ? "You"
                      : settlement.paidToUser.name.split(" ")[0]}
                  </span>
                </div>

                {/* Amount + date */}
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      "text-sm font-semibold tabular-nums",
                      isCurrentPayer
                        ? "text-red-600"
                        : isCurrentReceiver
                          ? "text-green-600"
                          : "text-foreground"
                    )}
                  >
                    {formatCurrency(amount, settlement.currency)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatDate(settlement.settledAt)}
                  </p>
                </div>
              </div>

              {/* Note */}
              {settlement.note && (
                <p className="ml-11 text-xs text-muted-foreground pb-1">
                  {settlement.note}
                </p>
              )}

              {index < settlements.length - 1 && (
                <Separator className="my-1" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}