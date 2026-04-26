// FILE: apps/web/src/components/expenses/CreateRecurringModal.tsx
// PURPOSE: Modal to create a recurring expense rule
// DEPENDS ON: react-hook-form, zod, SplitSelector, useCreateRecurringRule
// LAST UPDATED: F31 - Recurring Expenses Engine

"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, RefreshCw } from "lucide-react";
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
import { useCreateRecurringRule } from "@/hooks/useRecurring";
import { useGroupMembers } from "@/hooks/useGroups";
import { useUser } from "@/stores/authStore";
import { getErrorMessage } from "@/lib/queryClient";
import { CATEGORIES } from "@/lib/validations/expense";
import type { Category } from "@/types/expense";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const FormSchema = z.object({
  title: z.string().min(1, "Title required").max(100).trim(),
  totalAmount: z
    .number({ invalid_type_error: "Amount required" })
    .positive("Must be positive"),
  category: z.string().default("general"),
  splitType: z.string().default("equal"),
  paidBy: z.string().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  startDate: z.string().optional(),
});

type FormInput = z.infer<typeof FormSchema>;

interface CreateRecurringModalProps {
  groupId: string;
}

export function CreateRecurringModal({
  groupId,
}: CreateRecurringModalProps) {
  const [open, setOpen] = useState(false);
  const currentUser = useUser();
  const { data: members } = useGroupMembers(groupId);
  const {
    mutate: createRule,
    isPending,
    error,
  } = useCreateRecurringRule(groupId);

  const [splitState, setSplitState] = useState<SplitState>(
    getInitialSplitState([])
  );
  const [splitError, setSplitError] = useState<string | null>(null);

  useEffect(() => {
    if (members && members.length > 0) {
      setSplitState(getInitialSplitState(members));
    }
  }, [members]);

  const form = useForm<FormInput>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: "",
      totalAmount: undefined,
      category: "general",
      splitType: "equal",
      paidBy: currentUser?.id ?? "",
      frequency: "monthly",
      startDate: new Date().toISOString().split("T")[0],
    },
  });

  const watchedAmount = form.watch("totalAmount") ?? 0;

    const onSubmit = (data: FormInput) => {
    setSplitError(null);
    const validationError = validateSplitState(
      splitState,
      data.totalAmount
    );
    if (validationError) {
      setSplitError(validationError);
      return;
    }

    const splits = buildSplitsFromState(splitState);

    // Parse date properly
    let startDate: string | undefined;
    if (data.startDate) {
      const parsed = new Date(data.startDate);
      if (!isNaN(parsed.getTime())) {
        startDate = parsed.toISOString();
      }
    }

    // Filter empty paidBy
    const paidBy =
      data.paidBy && data.paidBy.length > 0
        ? data.paidBy
        : currentUser?.id;

        createRule(
      {
        title: data.title,
        totalAmount: data.totalAmount,
        currency: currentUser?.currencyPref ?? "INR",
        category: data.category,
        splitType: splitState.type,
        splits,
        paidBy: data.paidBy,
        frequency: data.frequency,
        startDate: data.startDate
          ? new Date(data.startDate).toISOString()
          : undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          if (members) setSplitState(getInitialSplitState(members));
        },
      }
    );
  };

  const serverError = error ? getErrorMessage(error) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus size={14} />
          Add Rule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw size={18} />
            Create Recurring Expense
          </DialogTitle>
          <DialogDescription>
            This expense will be automatically added on your chosen
            schedule.
          </DialogDescription>
        </DialogHeader>

        {(serverError || splitError) && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {serverError ?? splitError}
          </div>
        )}

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {/* Title */}
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="e.g. Monthly Rent"
              disabled={isPending}
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
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                disabled={isPending}
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
                    value={field.value as Category}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>
          </div>

          {/* Frequency + Start Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Frequency *</Label>
              <Controller
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                disabled={isPending}
                {...form.register("startDate")}
              />
            </div>
          </div>

          <Separator />

          {/* Split */}
          <div className="space-y-2">
            <Label>Split between</Label>
            {members && members.length > 0 ? (
              <SplitSelector
                members={members}
                totalAmount={watchedAmount}
                currency="INR"
                splitState={splitState}
                onSplitStateChange={setSplitState}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Loading members...
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
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
              Create rule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}