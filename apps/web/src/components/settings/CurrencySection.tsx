// FILE: apps/web/src/components/settings/CurrencySection.tsx
// PURPOSE: Change default currency + timezone
// DEPENDS ON: useUpdateProfile, CurrencyPicker
// LAST UPDATED: F38 - User Settings

"use client";

import { useState } from "react";
import { Globe, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateProfile, getErrorMessage } from "@/hooks/useAuth";
import { CURRENCIES } from "@/lib/currencies";
import type { AuthUser } from "@/types/auth";

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

interface CurrencySectionProps {
  user: AuthUser;
}

export function CurrencySection({ user }: CurrencySectionProps) {
  const [currency, setCurrency] = useState(user.currencyPref);
  const [timezone, setTimezone] = useState(user.timezone);
  const [hasChanges, setHasChanges] = useState(false);

  const { mutate: updateProfile, isPending, error } =
    useUpdateProfile();

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    setHasChanges(true);
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    setHasChanges(true);
  };

    const handleSave = () => {
    updateProfile(
      {
        currencyPref: currency,
        timezone: timezone,
      },
      {
        onSuccess: () => setHasChanges(false),
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins size={16} />
          Preferences
        </CardTitle>
        <CardDescription>
          Default currency and timezone for new expenses
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currency */}
        <div className="space-y-2">
          <Label>Default Currency</Label>
          <Select
            value={currency}
            onValueChange={handleCurrencyChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground w-5">
                      {c.symbol}
                    </span>
                    {c.code} — {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Used as default when creating expenses and viewing
            balances
          </p>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Globe size={12} />
            Timezone
          </Label>
          <Select
            value={timezone}
            onValueChange={handleTimezoneChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Save */}
        {hasChanges && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleSave}
              loading={isPending}
              disabled={isPending}
              size="sm"
            >
              Save preferences
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrency(user.currencyPref);
                setTimezone(user.timezone);
                setHasChanges(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive">
            {getErrorMessage(error)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}