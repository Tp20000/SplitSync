// FILE: apps/web/src/components/groups/SettleButton.tsx
// PURPOSE: Button to record a settlement via API
// DEPENDS ON: useCreateSettlement, shadcn/ui
// LAST UPDATED: F25 - Settlement Recording API

"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCreateSettlement } from "@/hooks/useSettlements";
import { formatCurrency } from "@/lib/utils";
import { getErrorMessage } from "@/lib/queryClient";
import type { PairwiseDebt } from "@/types/balance";
import { useToast } from "@/hooks/useToast";

interface SettleButtonProps {
  debt: PairwiseDebt;
  groupId: string;
  currentUserId: string;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  className?: string;
}

export function SettleButton({
  debt,
  groupId,
  currentUserId,
  variant = "outline",
  size = "sm",
  className,
}: SettleButtonProps) {
  const { mutate: createSettlement, isPending, error } =
    useCreateSettlement(groupId);

  const isCurrentUserPayer = debt.from.userId === currentUserId;
  const isCurrentUserReceiver = debt.to.userId === currentUserId;

  if (!isCurrentUserPayer && !isCurrentUserReceiver) {
    return null;
  }

  const actionText = isCurrentUserPayer
    ? `I paid ${debt.to.name.split(" ")[0]}`
    : `${debt.from.name.split(" ")[0]} paid me`;

  const { success: toastSuccess, error: toastError } = useToast();

    const handleSettle = () => {
    if (isCurrentUserPayer) {
      createSettlement(
        {
          paidTo: debt.to.userId,
          amount: parseFloat(debt.amount),
          currency: debt.currency,
          note: `Settlement: ${debt.from.name} → ${debt.to.name}`,
        },
        {
          onSuccess: () => {
            toastSuccess(
              "Settlement recorded",
              `${formatCurrency(debt.amount, debt.currency)} marked as paid.`
            );
          },
          onError: (err) => {
            toastError("Settlement failed", getErrorMessage(err));
          },
        }
      );
    } else {
      createSettlement(
        {
          paidTo: debt.from.userId,
          amount: parseFloat(debt.amount),
          currency: debt.currency,
          note: `Settlement received from ${debt.from.name}`,
        },
        {
          onSuccess: () => {
            toastSuccess(
              "Settlement recorded",
              `${formatCurrency(debt.amount, debt.currency)} received.`
            );
          },
          onError: (err) => {
            toastError("Settlement failed", getErrorMessage(err));
          },
        }
      );
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={isPending}
        >
          <Check size={14} className="mr-1" />
          {isPending ? "Settling..." : "Settle"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Record settlement?</AlertDialogTitle>
          <AlertDialogDescription>
            {actionText}{" "}
            <span className="font-semibold">
              {formatCurrency(debt.amount, debt.currency)}
            </span>
            .
            <br />
            <br />
            This will update balances for everyone in the group.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {getErrorMessage(error)}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSettle}
            disabled={isPending}
          >
            {isPending ? "Recording..." : actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}