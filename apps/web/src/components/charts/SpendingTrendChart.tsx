// FILE: apps/web/src/components/charts/SpendingTrendChart.tsx
// PURPOSE: Line chart showing spending over time
// DEPENDS ON: recharts, useSpendingTrends
// LAST UPDATED: F35 - Analytics Dashboard

"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSpendingTrends } from "@/hooks/useAnalytics";
import { formatCurrency } from "@/lib/utils";

interface SpendingTrendChartProps {
  groupId: string;
  currency?: string;
}

type Period = "daily" | "weekly" | "monthly";

const PERIOD_LABELS: Record<Period, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export function SpendingTrendChart({
  groupId,
  currency = "INR",
}: SpendingTrendChartProps) {
  const [period, setPeriod] = useState<Period>("monthly");
  const { data, isLoading } = useSpendingTrends(groupId, period);

  const trends = data?.trends ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base">
              Spending Trend
            </CardTitle>
            <CardDescription>
              Group spending over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            {(["daily", "weekly", "monthly"] as Period[]).map(
              (p) => (
                <Button
                  key={p}
                  variant={period === p ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  onClick={() => setPeriod(p)}
                >
                  {PERIOD_LABELS[p]}
                </Button>
              )
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-56 animate-pulse rounded-lg bg-muted" />
        ) : trends.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            No expense data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={trends}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  formatCurrency(v, currency)
                    .replace(/\.00$/, "")
                }
              />
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value, currency),
                  "Total",
                ]}
                labelStyle={{ color: "#0f172a", fontWeight: 600 }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{
                  fill: "#3b82f6",
                  strokeWidth: 0,
                  r: 3,
                }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}