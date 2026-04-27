// FILE: apps/web/src/components/settlements/UpiPaymentModal.tsx
// PURPOSE: UPI payment modal with QR code + deep links
// DEPENDS ON: shadcn/ui
// LAST UPDATED: Payment Integration

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  Smartphone,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCreateSettlement } from "@/hooks/useSettlements";
import { getErrorMessage } from "@/lib/queryClient";
import type { PairwiseDebt } from "@/types/balance";

interface UpiPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debt: PairwiseDebt;
  groupId: string;
  currentUserId: string;
}

// ─────────────────────────────────────────────
// UPI Apps config
// ─────────────────────────────────────────────

const UPI_APPS = [
  {
    name: "GPay",
    id: "gpay",
    color: "bg-blue-500",
    logo: "G",
    scheme: "tez://upi/pay",
    packageAndroid: "com.google.android.apps.nbu.paisa.user",
  },
  {
    name: "PhonePe",
    id: "phonepe",
    color: "bg-purple-600",
    logo: "Pe",
    scheme: "phonepe://pay",
    packageAndroid: "com.phonepe.app",
  },
  {
    name: "Paytm",
    id: "paytm",
    color: "bg-sky-500",
    logo: "Pt",
    scheme: "paytmmp://pay",
    packageAndroid: "net.one97.paytm",
  },
  {
    name: "BHIM",
    id: "bhim",
    color: "bg-orange-500",
    logo: "B",
    scheme: "upi://pay",
    packageAndroid: "in.org.npci.upiapp",
  },
];

export function UpiPaymentModal({
  open,
  onOpenChange,
  debt,
  groupId,
  currentUserId,
}: UpiPaymentModalProps) {
  const [recipientUpi, setRecipientUpi] = useState("");
  const [paymentStep, setPaymentStep] = useState<
    "setup" | "pay" | "confirm"
  >("setup");
  const [copied, setCopied] = useState(false);

  const { mutate: createSettlement, isPending } =
    useCreateSettlement(groupId);

  const amount = parseFloat(debt.amount);
  const isCurrentUserPayer = debt.from.userId === currentUserId;

  // Reset on open
  useEffect(() => {
    if (open) {
      setPaymentStep("setup");
      setRecipientUpi("");
    }
  }, [open]);

  // ── Build UPI payment link ──
  const buildUpiLink = (scheme: string): string => {
    const params = new URLSearchParams({
      pa: recipientUpi,           // payee UPI ID
      pn: debt.to.name,           // payee name
      am: amount.toFixed(2),      // amount
      cu: debt.currency,          // currency
      tn: `SplitSync - ${groupId.slice(0, 8)}`, // note
    });
    return `${scheme}?${params.toString()}`;
  };

  // ── Generic UPI deep link (works with any app) ──
  const genericUpiLink = (): string => {
    const params = new URLSearchParams({
      pa: recipientUpi,
      pn: debt.to.name,
      am: amount.toFixed(2),
      cu: debt.currency,
      tn: `SplitSync payment`,
    });
    return `upi://pay?${params.toString()}`;
  };

  const handleCopyUpi = async () => {
    await navigator.clipboard.writeText(recipientUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAppPay = (scheme: string) => {
    const link = buildUpiLink(scheme);
    window.location.href = link;
    // After 2 seconds, assume user has gone to the app
    setTimeout(() => setPaymentStep("confirm"), 2000);
  };

  const handleMarkPaid = () => {
    createSettlement(
      {
        paidTo: debt.to.userId,
        amount,
        currency: debt.currency,
        note: `Paid via UPI to ${recipientUpi}`,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone size={20} />
            Pay via UPI
          </DialogTitle>
          <DialogDescription>
            Pay{" "}
            <span className="font-semibold">
              {formatCurrency(amount, debt.currency)}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {debt.to.name}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Amount display */}
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-3xl font-bold tabular-nums text-primary">
            {formatCurrency(amount, debt.currency)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {debt.from.name} → {debt.to.name}
          </p>
        </div>

        {/* STEP 1: Enter recipient UPI */}
        {paymentStep === "setup" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {debt.to.name}&apos;s UPI ID
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. alice@okaxis or 9876543210@ybl"
                  value={recipientUpi}
                  onChange={(e) =>
                    setRecipientUpi(e.target.value)
                  }
                  className="font-mono"
                />
                {recipientUpi && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => void handleCopyUpi()}
                  >
                    {copied ? (
                      <CheckCircle2 size={14} className="text-green-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Ask {debt.to.name} for their UPI ID
                (format: name@bank or phone@upi)
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => setPaymentStep("pay")}
              disabled={!recipientUpi.includes("@")}
            >
              Continue to Pay
            </Button>

            <Separator />

            {/* Skip UPI — just mark as paid manually */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">
                Already paid outside the app?
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkPaid}
                disabled={isPending}
              >
                Mark as settled manually
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose payment app */}
        {paymentStep === "pay" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Choose your UPI app to pay
            </p>

            {/* UPI App buttons */}
            <div className="grid grid-cols-2 gap-3">
              {UPI_APPS.map((app) => (
                <Button
                  key={app.id}
                  variant="outline"
                  className="h-14 gap-3 text-base"
                  onClick={() => handleAppPay(app.scheme)}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${app.color} text-white text-xs font-bold`}
                  >
                    {app.logo}
                  </div>
                  {app.name}
                </Button>
              ))}
            </div>

            <Separator />

            {/* Generic UPI link */}
            <div className="space-y-2">
              <p className="text-xs text-center text-muted-foreground">
                Or open with any UPI app
              </p>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  window.location.href = genericUpiLink();
                  setTimeout(() => setPaymentStep("confirm"), 2000);
                }}
              >
                <ExternalLink size={14} />
                Open UPI App
              </Button>
            </div>

            <Separator />

            {/* Already paid? */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setPaymentStep("confirm")}
            >
              I&apos;ve already paid →
            </Button>
          </div>
        )}

        {/* STEP 3: Confirm payment */}
        {paymentStep === "confirm" && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2
                size={32}
                className="text-green-600"
              />
            </div>

            <div>
              <p className="font-semibold">
                Did you complete the payment?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm to update balances for everyone in
                the group.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">
                  {formatCurrency(amount, debt.currency)}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">
                  {debt.to.name}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-muted-foreground">
                  UPI ID
                </span>
                <span className="font-mono text-xs">
                  {recipientUpi}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPaymentStep("pay")}
                disabled={isPending}
              >
                Not yet
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleMarkPaid}
                disabled={isPending}
                loading={isPending}
              >
                {isPending ? "Saving..." : "Yes, paid! ✓"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}