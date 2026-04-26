// FILE: apps/web/src/components/expenses/EditExpenseModal.tsx
// PURPOSE: Edit expense modal with version conflict detection
// DEPENDS ON: react-hook-form, zod, SplitSelector, useUpdateExpense
// LAST UPDATED: F27 - Optimistic Concurrency Control

"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CategoryPicker } from "./CategoryPicker";
import {
  SplitSelector,
  buildSplitsFromState,
  validateSplitState,
  type SplitState,
} from "./SplitSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateExpense, useExpense } from "@/hooks/useExpenses";
import { useGroupMembers } from "@/hooks/useGroups";
import { useUser } from "@/stores/authStore";
import { getErrorMessage, isApiError } from "@/lib/queryClient";
import {
  CreateExpenseSchema,
  type CreateExpenseFormInput,
} from "@/lib/validations/expense";
import { getInitials, stringToColor } from "@/lib/utils";
import type { Expense, Category, SplitType } from "@/types/expense";
import type { GroupMember } from "@/types/group";

interface EditExpenseModalProps {
  expense: Expense;
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditExpenseModal({
  expense,
  groupId,
  open,
  onOpenChange,
  onSuccess,
}: EditExpenseModalProps) {
  const currentUser = useUser();
  const { data: members } = useGroupMembers(groupId);
  const {
    mutate: updateExpense,
    isPending,
    error,
    reset: resetMutation,
  } = useUpdateExpense(groupId, expense.id);

  // Conflict state
  const [isConflict, setIsConflict] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(
    expense.version
  );

  // Refetch on conflict
  const {
    data: freshExpense,
    refetch: refetchExpense,
  } = useExpense(groupId, expense.id);

  // Active expense data (fresh if conflict was resolved)
  const activeExpense = isConflict && freshExpense
    ? freshExpense
    : expense;

  // Split state
  const [splitState, setSplitState] = useState<SplitState>(
    buildSplitStateFromExpense(activeExpense, members ?? [])
  );
  const [splitError, setSplitError] = useState<string | null>(null);

  const form = useForm<CreateExpenseFormInput>({
    resolver: zodResolver(CreateExpenseSchema),
    defaultValues: {
      title: activeExpense.title,
      description: activeExpense.description ?? "",
      totalAmount: parseFloat(activeExpense.totalAmount),
      category: activeExpense.category,
      splitType: activeExpense.splitType,
      paidBy: activeExpense.paidBy,
    },
  });

  // Reset form when expense changes
  useEffect(() => {
    form.reset({
      title: activeExpense.title,
      description: activeExpense.description ?? "",
      totalAmount: parseFloat(activeExpense.totalAmount),
      category: activeExpense.category,
      splitType: activeExpense.splitType,
      paidBy: activeExpense.paidBy,
    });
    setCurrentVersion(activeExpense.version);
    setSplitState(
      buildSplitStateFromExpense(activeExpense, members ?? [])
    );
  }, [activeExpense, members, form]);

  // Sync split type with tabs
  useEffect(() => {
    form.setValue("splitType", splitState.type);
  }, [splitState.type, form]);

  const watchedAmount = form.watch("totalAmount") ?? 0;

  // Handle conflict resolution
  const handleResolveConflict = useCallback(async () => {
    setIsConflict(false);
    resetMutation();
    await refetchExpense();
  }, [refetchExpense, resetMutation]);

  const onSubmit = (data: CreateExpenseFormInput) => {
    setSplitError(null);
    setIsConflict(false);

    // Validate splits
    const validationError = validateSplitState(
      splitState,
      data.totalAmount
    );
    if (validationError) {
      setSplitError(validationError);
      return;
    }

    const splits = buildSplitsFromState(splitState);

    updateExpense(
      {
        title: data.title,
        description: data.description || undefined,
        totalAmount: data.totalAmount,
        category: data.category,
        splitType: splitState.type,
        splits,
        paidBy: data.paidBy,
        version: currentVersion, // Send current version for OCC
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          onSuccess();
        },
        onError: (err) => {
          // Check for version conflict
          if (isApiError(err, "EXPENSE_LOCKED")) {
            setIsConflict(true);
          }
        },
      }
    );
  };

  const serverError =
    error && !isConflict ? getErrorMessage(error) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil size={18} />
            Edit Expense
          </DialogTitle>
          <DialogDescription>
            Update expense details. Version: {currentVersion}
          </DialogDescription>
        </DialogHeader>

        {/* Version Conflict Warning */}
        {isConflict && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={20}
                className="text-amber-600 shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  Version Conflict
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  This expense was modified by someone else while you
                  were editing. Your changes were not saved.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={() => void handleResolveConflict()}
                >
                  <RefreshCw size={14} />
                  Load latest version and try again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Server error */}
        {serverError && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError}
          </div>
        )}

        {/* Split error */}
        {splitError && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {splitError}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title *</Label>
            <Input
              id="edit-title"
              disabled={isPending || isConflict}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Amount + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                min="0.01"
                className="tabular-nums"
                disabled={isPending || isConflict}
                {...form.register("totalAmount", {
                  valueAsNumber: true,
                })}
              />
              {form.formState.errors.totalAmount && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.totalAmount.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <CategoryPicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending || isConflict}
                  />
                )}
              />
            </div>
          </div>

          {/* Paid by */}
          <div className="space-y-2">
            <Label>Paid by</Label>
            <Controller
              control={form.control}
              name="paidBy"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isPending || isConflict}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {members?.map((member) => (
                      <SelectItem
                        key={member.userId}
                        value={member.userId}
                      >
                        <span className="flex items-center gap-2">
                          <div
                            className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{
                              backgroundColor: stringToColor(
                                member.user.name
                              ),
                            }}
                          >
                            {getInitials(member.user.name)}
                          </div>
                          {member.user.name}
                          {member.userId === currentUser?.id &&
                            " (you)"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Input
              id="edit-desc"
              disabled={isPending || isConflict}
              {...form.register("description")}
            />
          </div>

          <Separator />

          {/* Split selector */}
          <div className="space-y-2">
            <Label>Split between</Label>
            {members && members.length > 0 ? (
              <SplitSelector
                members={members}
                totalAmount={watchedAmount || 0}
                currency={activeExpense.currency}
                splitState={splitState}
                onSplitStateChange={setSplitState}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Loading members...
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={isPending || isConflict}
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────
// Build split state from existing expense
// ─────────────────────────────────────────────

function buildSplitStateFromExpense(
  expense: Expense,
  members: GroupMember[]
): SplitState {
  const allIds = members.map((m) => m.userId);
  const defaultShares: Record<string, number> = {};
  members.forEach((m) => {
    defaultShares[m.userId] = 1;
  });

  const splitUserIds = expense.splits.map((s) => s.userId);

  switch (expense.splitType as SplitType) {
    case "equal":
      return {
        type: "equal",
        equalSelected: splitUserIds,
        exactAmounts: {},
        percentages: {},
        shares: defaultShares,
      };

    case "exact": {
      const exactAmounts: Record<string, string> = {};
      expense.splits.forEach((s) => {
        exactAmounts[s.userId] = s.owedAmount;
      });
      return {
        type: "exact",
        equalSelected: allIds,
        exactAmounts,
        percentages: {},
        shares: defaultShares,
      };
    }

    case "percentage": {
      const percentages: Record<string, string> = {};
      const total = parseFloat(expense.totalAmount);
      expense.splits.forEach((s) => {
        const pct = total > 0
          ? ((parseFloat(s.owedAmount) / total) * 100).toFixed(1)
          : "0";
        percentages[s.userId] = pct;
      });
      return {
        type: "percentage",
        equalSelected: allIds,
        exactAmounts: {},
        percentages,
        shares: defaultShares,
      };
    }

    case "shares": {
      // Reconstruct shares from amounts (approximate)
      const amounts = expense.splits.map((s) =>
        parseFloat(s.owedAmount)
      );
      const minAmount = Math.min(...amounts.filter((a) => a > 0));
      const shares: Record<string, number> = {};
      expense.splits.forEach((s) => {
        const amt = parseFloat(s.owedAmount);
        shares[s.userId] = minAmount > 0
          ? Math.round(amt / minAmount)
          : 1;
      });
      return {
        type: "shares",
        equalSelected: allIds,
        exactAmounts: {},
        percentages: {},
        shares,
      };
    }

    default:
      return {
        type: "equal",
        equalSelected: splitUserIds,
        exactAmounts: {},
        percentages: {},
        shares: defaultShares,
      };
  }
}