// FILE: apps/web/src/components/expenses/ExpenseDetail.tsx
// PURPOSE: Side panel showing full expense detail + split breakdown + delete
// DEPENDS ON: shadcn/ui, expense types, hooks
// LAST UPDATED: F15 - Expense List + Detail UI

"use client";

import {
  X,
  Trash2,
  Calendar,
  Tag,
  Receipt,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { getCategoryLabel, getCategoryIcon } from "./CategoryPicker";
import { useDeleteExpense } from "@/hooks/useExpenses";
import { useUser } from "@/stores/authStore";
import {
  formatCurrency,
  formatDate,
  getInitials,
  stringToColor,
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Expense } from "@/types/expense";
import { getErrorMessage } from "@/lib/queryClient";
import { History } from "lucide-react";
import { ExpenseHistory } from "./ExpenseHistory";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { EditExpenseModal } from "./EditExpenseModal";
import { CommentSection } from "./CommentSection";
import { ReceiptUpload } from "./ReceiptUpload";
import { FileImage } from "lucide-react";


interface ExpenseDetailProps {
  expense: Expense;
  groupId: string;
  onClose: () => void;
}

export function ExpenseDetail({
  expense,
  groupId,
  onClose,
}: ExpenseDetailProps) {
  const currentUser = useUser();
  const { mutate: deleteExpense, isPending: isDeleting, error } =
    useDeleteExpense(groupId);

  const CategoryIcon = getCategoryIcon(expense.category);
  const totalAmount = parseFloat(expense.totalAmount);

  const [editOpen, setEditOpen] = useState(false);

  const handleDelete = () => {
    deleteExpense(expense.id, {
      onSuccess: () => onClose(),
    });
  };

  const splitTypeLabel = {
    equal: "Equal",
    exact: "Exact",
    percentage: "Percentage",
    shares: "Shares",
  }[expense.splitType];

    const [receiptUrl, setReceiptUrl] = useState<string | null>(
    expense.receiptUrl
  );

  return (
        <div className="fixed inset-0 z-50 bg-background md:inset-y-0 md:left-auto md:right-0 md:w-full md:max-w-md md:border-l md:shadow-xl animate-slide-in-right">
      {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg font-semibold">Expense Details</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
            title="Edit expense"
          >
            <Pencil size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* Content */}
            <div className="overflow-y-auto h-[calc(100vh-65px)] px-4 md:px-6 py-4 space-y-5 safe-bottom">
        {/* Title + Amount */}
        <div>
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <CategoryIcon size={22} className="text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{expense.title}</h3>
              {expense.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {expense.description}
                </p>
              )}
            </div>
          </div>

          <p className="text-3xl font-bold tabular-nums">
            {formatCurrency(totalAmount, expense.currency)}
          </p>
        </div>

        <Separator />

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="font-medium">
                {formatDate(expense.expenseDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Tag size={14} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="font-medium">
                {getCategoryLabel(expense.category)}
              </p>
            </div>
          </div>
        </div>

                {/* Receipt */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileImage size={14} className="text-muted-foreground" />
            <h4 className="text-sm font-semibold">Receipt</h4>
          </div>
          <ReceiptUpload
            groupId={groupId}
            expenseId={expense.id}
            currentReceiptUrl={receiptUrl}
            onUploadSuccess={(url) => setReceiptUrl(url)}
            onDeleteSuccess={() => setReceiptUrl(null)}
          />
        </div>

        {/* Paid by */}
        <Card>
          <CardContent className="flex items-center gap-3 py-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                backgroundColor: stringToColor(
                  expense.paidByUser.name
                ),
              }}
            >
              {getInitials(expense.paidByUser.name)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {expense.paidByUser.name}
                {expense.paidBy === currentUser?.id && " (you)"}
              </p>
              <p className="text-xs text-muted-foreground">
                Paid the full amount
              </p>
            </div>
            <p className="text-sm font-semibold tabular-nums">
              {formatCurrency(totalAmount, expense.currency)}
            </p>
          </CardContent>
        </Card>

        {/* Split breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm">
              <span>Split Breakdown</span>
              <Badge variant="secondary">{splitTypeLabel}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {expense.splits.map((split) => {
              const owedAmount = parseFloat(split.owedAmount);
              const isCurrentUser =
                split.userId === currentUser?.id;
              const isPayer =
                split.userId === expense.paidBy;

              return (
                <div
                  key={split.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg p-2",
                    isCurrentUser && "bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{
                        backgroundColor: stringToColor(
                          split.user.name
                        ),
                      }}
                    >
                      {getInitials(split.user.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {split.user.name}
                        {isCurrentUser && " (you)"}
                      </p>
                      {split.isSettled && (
                        <Badge
                          variant="success"
                          className="text-[10px] h-4"
                        >
                          Settled
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(owedAmount, expense.currency)}
                    </p>
                    {!isPayer && owedAmount > 0 && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                        <ArrowRight size={8} />
                        {expense.paidByUser.name.split(" ")[0]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>


        {/* Comments */}
        <CommentSection groupId={groupId} expenseId={expense.id} />

        <Separator />

         {/* Audit Trail */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History size={14} className="text-muted-foreground" />
            <h4 className="text-sm font-semibold">Change History</h4>
            <span className="text-xs text-muted-foreground">
              v{expense.version}
            </span>
          </div>

          <ExpenseHistory
            groupId={groupId}
            expenseId={expense.id}
            currency={expense.currency}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {getErrorMessage(error)}
          </div>
        )}

        {/* Delete button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              disabled={isDeleting}
            >
              <Trash2 size={14} />
              Delete expense
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete expense?</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{expense.title}&quot; (
                {formatCurrency(totalAmount, expense.currency)}) will
                be removed. This will affect all balances in the group.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {/* Edit Modal */}
      <EditExpenseModal
        expense={expense}
        groupId={groupId}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onClose}
      />
    </div>
  );
}