// FILE: apps/web/src/app/(dashboard)/groups/[groupId]/page.tsx
// PURPOSE: Full group detail page with tabs — members, expenses, balances
// DEPENDS ON: useGroup, useGroupMembers, MemberList, InviteCodeCard, Tabs
// LAST UPDATED: F12 - Group Members UI

"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Receipt,
  Scale,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { GroupTypeIcon } from "@/components/groups/GroupTypeIcon";
import { MemberList } from "@/components/groups/MemberList";
import { InviteCodeCard } from "@/components/groups/InviteCodeCard";
import { useGroup, useLeaveGroup, useGroupMembers } from "@/hooks/useGroups";
import { useUser } from "@/stores/authStore";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { BalanceList } from "@/components/groups/BalanceList";
import { useGroupBalances } from "@/hooks/useBalances";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useGroupRoom } from "@/hooks/useSocket";
import { useRealtimeExpenses } from "@/hooks/useRealtimeExpenses";
import { useRealtimeGroup } from "@/hooks/useRealtimeGroup";
import { LiveActivityToast } from "@/components/shared/LiveActivityToast";
import { OnlineMembers } from "@/components/groups/OnlineMembers";
import { useOnlineUsers } from "@/hooks/useSocket";
import { TypingIndicator } from "@/components/groups/TypingIndicator";
import { Banknote } from "lucide-react";
import { SettlementHistory } from "@/components/settlements/SettlementHistory";
import { RecurringRuleList } from "@/components/expenses/RecurringRuleList";
import { RefreshCw } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { ExportPdfButton } from "@/components/groups/ExportPdfButton";


export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const currentUser = useUser();
  const { data: group, isLoading } = useGroup(groupId);
  const { data: members } = useGroupMembers(groupId);
  const { mutate: leaveGroup, isPending: isLeaving } =
    useLeaveGroup(groupId);
  const { data: balanceData } = useGroupBalances(groupId);
    // Real-time: join socket room + listen for events
  useGroupRoom(groupId);
  useRealtimeExpenses(groupId);
  useRealtimeGroup(groupId);
    const { count: onlineCount } = useOnlineUsers(groupId);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 animate-pulse rounded bg-muted" />
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  // ── Not found ──
  if (!group) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Group not found</p>
        <Link href="/groups">
          <Button variant="outline" className="mt-4">
            Back to groups
          </Button>
        </Link>
      </div>
    );
  }

  const isAdmin = group.userRole === "admin";
  const currentUserId = currentUser?.id ?? "";

  const handleLeave = () => {
    leaveGroup(undefined, {
      onSuccess: () => router.push("/groups"),
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/groups">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={18} />
            </Button>
          </Link>
                  <div className="flex items-center gap-3">
          <GroupTypeIcon type={group.type} size={20} />
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              {group.description && (
                <p className="text-sm text-muted-foreground">
                  {group.description}
                </p>
              )}
              {members && (
                <OnlineMembers
                  groupId={groupId}
                  members={members}
                />
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pl-0 overflow-x-auto scrollbar-none">
          {isAdmin && (
            <Button variant="outline" size="sm" className="gap-2">
              <Settings size={14} />
              Settings
            </Button>
          )}

          {/* Export PDF */}
          {group && (
            <ExportPdfButton
              groupId={groupId}
              groupName={group.name}
            />
          )}

          {/* Analytics button */}
          <Link href={`/groups/${groupId}/analytics`}>
            <Button variant="outline" size="sm" className="gap-2">
              <BarChart3 size={14} />
              Analytics
            </Button>
          </Link>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive hover:text-destructive"
                disabled={isLeaving}
              >
                <LogOut size={14} />
                Leave
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave group?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will lose access to all expenses and balances
                  in &quot;{group.name}&quot;. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLeave}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {isLeaving ? "Leaving..." : "Leave group"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users size={12} />
              Members
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">
              {group.memberCount}
            </p>
            {(onlineCount > 0 || true) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                {onlineCount + 1} online
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Receipt size={12} />
              Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-bold">
              {group.expenseCount ?? 0}
            </p>
          </CardContent>
        </Card>

                <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Scale size={12} />
              Your Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {(() => {
              const userBal = balanceData?.members?.find(
                (m) => m.userId === currentUserId
              );
              const net = userBal
                ? parseFloat(userBal.netBalance)
                : 0;

              return (
                <>
                  <p
                    className={cn(
                      "text-2xl font-bold tabular-nums",
                      net > 0.01
                        ? "balance-positive"
                        : net < -0.01
                          ? "balance-negative"
                          : "balance-zero"
                    )}
                  >
                    {net > 0 && "+"}
                    {formatCurrency(Math.abs(net), balanceData?.currency ?? "INR")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {net > 0.01
                      ? "others owe you"
                      : net < -0.01
                        ? "you owe others"
                        : "all settled up"}
                  </p>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* ── Typing Indicator ── */}
      <TypingIndicator groupId={groupId} className="px-1" />
      {/* ── Tabs ── */}
      <Tabs defaultValue="expenses">
        <TabsList className="w-full overflow-x-auto scrollbar-none justify-start">
          <TabsTrigger value="expenses" className="gap-2">
            <Receipt size={14} />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="balances" className="gap-2">
            <Scale size={14} />
            Balances
          </TabsTrigger>
          <TabsTrigger value="settlements" className="gap-2">
            <Banknote size={14} />
            Settlements
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-2">
            <Users size={14} />
            Members
          </TabsTrigger>
          <TabsTrigger value="recurring" className="gap-2">
            <RefreshCw size={14} />
            Recurring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settlements">
          <SettlementHistory groupId={groupId} />
        </TabsContent>

        {/* Recurring Tab */}
        <TabsContent value="recurring">
          <RecurringRuleList groupId={groupId} />
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MemberList
                groupId={groupId}
                currentUserId={currentUserId}
                currentUserRole={group.userRole}
              />
            </div>
            <div>
              <InviteCodeCard
                groupId={groupId}
                inviteCode={group.inviteCode}
                isAdmin={isAdmin}
              />
            </div>
          </div>
        </TabsContent>

                {/* Expenses Tab */}
        <TabsContent value="expenses">
          {members ? (
            <ExpenseList groupId={groupId} members={members} />
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          )}
        </TabsContent>

                {/* Balances Tab */}
        <TabsContent value="balances">
          <BalanceList groupId={groupId} />
        </TabsContent>
      </Tabs>
      {/* Real-time activity notifications */}
      <LiveActivityToast groupId={groupId} />
    </div>
  );
}