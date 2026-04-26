// FILE: apps/web/src/components/charts/CategoryBreakdownChart.tsx
// PURPOSE: Pie + bar chart showing spending by category
// DEPENDS ON: recharts, useCategoryBreakdown
// LAST UPDATED: F35 - Analytics Dashboard

"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCategoryBreakdown } from "@/hooks/useAnalytics";
import { formatCurrency, cn } from "@/lib/utils";
import { getCategoryLabel } from "@/components/expenses/CategoryPicker";
import type { Category } from "@/types/expense";

interface CategoryBreakdownChartProps {
  groupId: string;
  currency?: string;
}

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  food: "#f97316",
  transport: "#3b82f6",
  accommodation: "#8b5cf6",
  entertainment: "#ec4899",
  shopping: "#14b8a6",
  utilities: "#f59e0b",
  rent: "#ef4444",
  groceries: "#84cc16",
  drinks: "#06b6d4",
  health: "#10b981",
  education: "#6366f1",
  gifts: "#e11d48",
  travel: "#0ea5e9",
  general: "#94a3b8",
  other: "#64748b",
};

export function CategoryBreakdownChart({
  groupId,
  currency = "INR",
}: CategoryBreakdownChartProps) {
  const { data, isLoading } = useCategoryBreakdown(groupId);

  const breakdown = data?.breakdown ?? [];

  // Take top 8 categories
  const topCategories = breakdown.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Spending by Category
        </CardTitle>
        <CardDescription>
          Where the money goes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        ) : breakdown.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No expense data yet
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pie chart */}
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={topCategories}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {topCategories.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={
                        CATEGORY_COLORS[entry.category] ??
                        "#94a3b8"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value, currency),
                    "Amount",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend + amounts */}
            <div className="space-y-2">
              {topCategories.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center gap-3"
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[item.category] ??
                        "#94a3b8",
                    }}
                  />
                  <span className="flex-1 text-sm capitalize">
                    {getCategoryLabel(item.category as Category)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.percentage}%
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(item.total, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}