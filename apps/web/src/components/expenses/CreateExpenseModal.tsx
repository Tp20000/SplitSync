// FILE: apps/web/src/components/expenses/CreateExpenseModal.tsx
// PURPOSE: Full expense creation modal with split type selection
// DEPENDS ON: react-hook-form, zod, SplitSelector, CategoryPicker, shadcn/ui
// LAST UPDATED: F14 - Expense Form UI

"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Receipt } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CategoryPicker } from "./CategoryPicker";
import {
  SplitSelector,
  getInitialSplitState,
  buildSplitsFromState,
  validateSplitState,
  type SplitState,
} from "./SplitSelector";
import { useCreateExpense } from "@/hooks/useExpenses";
import { useGroupMembers } from "@/hooks/useGroups";
import { useUser } from "@/stores/authStore";
import { getErrorMessage } from "@/lib/queryClient";
import {
  CreateExpenseSchema,
  type CreateExpenseFormInput,
} from "@/lib/validations/expense";
import { getInitials, stringToColor } from "@/lib/utils";
import type { Category } from "@/types/expense";
import { useTypingIndicator } from "@/hooks/useSocket";
import { CurrencyPicker } from "./CurrencyPicker";
import { useToast } from "@/hooks/useToast";

interface CreateExpenseModalProps {
  groupId: string;
  trigger?: React.ReactNode;
}

export function CreateExpenseModal({
  groupId,
  trigger,
}: CreateExpenseModalProps) {
  const [open, setOpen] = useState(false);
  const currentUser = useUser();
  const { data: members } = useGroupMembers(groupId);
  const { mutate: createExpense, isPending, error } =
    useCreateExpense(groupId);

  const { success: toastSuccess, error: toastError } = useToast();

  const { startTyping, stopTyping } = useTypingIndicator(groupId);

  // Split state (managed separately from form)
  const [splitState, setSplitState] = useState<SplitState>(
    getInitialSplitState([])
  );
  const [splitError, setSplitError] = useState<string | null>(null);

  // Initialize split state when members load
  useEffect(() => {
    if (members && members.length > 0) {
      setSplitState(getInitialSplitState(members));
    }
  }, [members]);

  const form = useForm<CreateExpenseFormInput>({
    resolver: zodResolver(CreateExpenseSchema),
    defaultValues: {
      title: "",
      description: "",
      totalAmount: undefined,
      category: "general",
      splitType: "equal",
      paidBy: currentUser?.id ?? "",
    },
  });

    const [currency, setCurrency] = useState(
    currentUser?.currencyPref ?? "INR"
  );

    // Sync currency with user preference
  useEffect(() => {
    if (currentUser?.currencyPref) {
      setCurrency(currentUser.currencyPref);
    }
  }, [currentUser?.currencyPref]);

  // Sync splitType with tabs
  useEffect(() => {
    form.setValue("splitType", splitState.type);
  }, [splitState.type, form]);

  const watchedAmount = form.watch("totalAmount") ?? 0;

  const onSubmit = (data: CreateExpenseFormInput) => {
    setSplitError(null);

    // Validate split state
    const error = validateSplitState(splitState, data.totalAmount);
    if (error) {
      setSplitError(error);
      return;
    }

    const splits = buildSplitsFromState(splitState);

        createExpense(
      {
        title: data.title,
        description: data.description || undefined,
        totalAmount: data.totalAmount,
        currency: currency,     // ← Add this
        category: data.category,
        splitType: splitState.type,
        splits,
        paidBy: data.paidBy || currentUser?.id,
        expenseDate: data.expenseDate || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          if (members) setSplitState(getInitialSplitState(members));
          setSplitError(null);
          setCurrency(currentUser?.currencyPref ?? "INR");
          toastSuccess(
            "Expense added",
            `"${form.getValues("title")}" has been added to the group.`
          );
        },
        onError: (err) => {
          toastError(
            "Failed to add expense",
            getErrorMessage(err)
          );
        },
      }
    );

    

    
  };

  const serverError = error ? getErrorMessage(error) : null;

  return (
        <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          form.reset();
          setSplitError(null);
          setCurrency(currentUser?.currencyPref ?? "INR");
          stopTyping();
        }
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus size={16} />
            Add Expense
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt size={18} />
            Add Expense
          </DialogTitle>
          <DialogDescription>
            Add a new expense and split it with group members.
          </DialogDescription>
        </DialogHeader>

        {/* Errors */}
        {(serverError || splitError) && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError || splitError}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="exp-title">Title *</Label>
            <Input
              id="exp-title"
              placeholder="e.g. Dinner at restaurant"
              disabled={isPending}
              {...form.register("title")}
              onChange={(e) => {
                form.register("title").onChange(e);
                startTyping();
              }}
              onBlur={(e) => {
                form.register("title").onBlur(e);
                stopTyping();
              }}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            )}
          </div>

          {/* Amount + Category row */}
          <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
              <Label htmlFor="exp-amount">Amount *</Label>
              <div className="flex gap-2">
                <Input
                  id="exp-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="tabular-nums flex-1"
                  disabled={isPending}
                  {...form.register("totalAmount", {
                    valueAsNumber: true,
                  })}
                  onChange={(e) => {
                    form.register("totalAmount", {
                      valueAsNumber: true,
                    }).onChange(e);
                    startTyping();
                  }}
                  onBlur={(e) => {
                    form.register("totalAmount", {
                      valueAsNumber: true,
                    }).onBlur(e);
                    stopTyping();
                  }}
                />
                <CurrencyPicker
                  value={currency}
                  onChange={setCurrency}
                  disabled={isPending}
                />
              </div>
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
                    onChange={(val) =>
                      field.onChange(val)
                    }
                    disabled={isPending}
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
                  value={field.value ?? currentUser?.id ?? ""}
                  onValueChange={field.onChange}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Who paid?" />
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

          {/* Description (optional) */}
          <div className="space-y-2">
            <Label htmlFor="exp-desc">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="exp-desc"
              placeholder="Add notes..."
              disabled={isPending}
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
                currency={currency}
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
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={isPending}
            >
              Add expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}