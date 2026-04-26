// FILE: apps/web/src/components/charts/MemberSpendingChart.tsx
// PURPOSE: Bar chart comparing member spending contributions
// DEPENDS ON: recharts, useMemberSpending
// LAST UPDATED: F35 - Analytics Dashboard

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
import { useMemberSpending } from "@/hooks/useAnalytics";
import { formatCurrency } from "@/lib/utils";

interface MemberSpendingChartProps {
  groupId: string;
  currency?: string;
}

export function MemberSpendingChart({
  groupId,
  currency = "INR",
}: MemberSpendingChartProps) {
  const { data: members, isLoading } = useMemberSpending(groupId);

  const chartData = (members ?? []).map((m) => ({
    name: m.name.split(" ")[0],
    Paid: m.totalPaid,
    Owed: m.totalOwed,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Member Contributions
        </CardTitle>
        <CardDescription>
          How much each member paid vs owes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-56 animate-pulse rounded-lg bg-muted" />
        ) : chartData.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            No expense data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  formatCurrency(v, currency).replace(/\.00$/, "")
                }
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value, currency),
                  name,
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px" }}
              />
              <Bar
                dataKey="Paid"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="Owed"
                fill="#f97316"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}