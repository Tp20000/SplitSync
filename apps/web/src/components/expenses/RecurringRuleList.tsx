// FILE: apps/web/src/components/expenses/RecurringRuleList.tsx
// PURPOSE: List + manage recurring expense rules
// DEPENDS ON: useRecurringRules, shadcn/ui
// LAST UPDATED: F31 - Recurring Expenses Engine

"use client";

import { useState } from "react";
import {
  RefreshCw,
  Trash2,
  Power,
  PowerOff,
  Plus,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import {
  useRecurringRules,
  useToggleRecurringRule,
  useDeleteRecurringRule,
} from "@/hooks/useRecurring";
import { CreateRecurringModal } from "./CreateRecurringModal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getCategoryLabel } from "./CategoryPicker";
import type { RecurringRule } from "@/types/recurring";

interface RecurringRuleListProps {
  groupId: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export function RecurringRuleList({
  groupId,
}: RecurringRuleListProps) {
  const { data: rules, isLoading } = useRecurringRules(groupId);
  const { mutate: toggleRule, isPending: isToggling } =
    useToggleRecurringRule(groupId);
  const { mutate: deleteRule, isPending: isDeleting } =
    useDeleteRecurringRule(groupId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <RefreshCw size={16} />
            Recurring Expenses
            {rules && rules.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({rules.length})
              </span>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Expenses that repeat automatically
          </p>
        </div>
        <CreateRecurringModal groupId={groupId} />
      </div>

      {/* Empty state */}
      {!rules || rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <RefreshCw
              className="mx-auto mb-3 text-muted-foreground"
              size={28}
            />
            <p className="font-medium text-sm">No recurring rules</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create a rule to auto-add expenses on a schedule.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={(isActive) =>
                toggleRule({ ruleId: rule.id, isActive })
              }
              onDelete={() => deleteRule(rule.id)}
              isToggling={isToggling}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Rule Card
// ─────────────────────────────────────────────

function RuleCard({
  rule,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: {
  rule: RecurringRule;
  onToggle: (isActive: boolean) => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const template = rule.templateData;

  return (
    <Card
      className={!rule.isActive ? "opacity-60" : ""}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium truncate">
                {template.title}
              </p>
              <Badge
                variant={rule.isActive ? "success" : "secondary"}
                className="text-[10px] h-4 shrink-0"
              >
                {rule.isActive ? "Active" : "Paused"}
              </Badge>
              <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                {FREQUENCY_LABELS[rule.frequency] ?? rule.frequency}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {formatCurrency(
                  template.totalAmount,
                  template.currency
                )}
              </span>
              <span>
                {getCategoryLabel(
                  template.category as Parameters<typeof getCategoryLabel>[0]
                )}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                Next: {formatDate(rule.nextRunAt)}
              </span>
              {rule.lastRunAt && (
                <span>
                  Last: {formatDate(rule.lastRunAt)}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              Created by {rule.creator.name}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Toggle active */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title={rule.isActive ? "Pause" : "Resume"}
              onClick={() => onToggle(!rule.isActive)}
              disabled={isToggling}
            >
              {rule.isActive ? (
                <PowerOff size={14} className="text-amber-600" />
              ) : (
                <Power size={14} className="text-green-600" />
              )}
            </Button>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 size={14} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete recurring rule?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{template.title}&quot; will no longer be
                    automatically added. Past expenses are not
                    affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete rule
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}