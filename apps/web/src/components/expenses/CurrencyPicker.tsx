// FILE: apps/web/src/components/expenses/CurrencyPicker.tsx
// PURPOSE: Currency dropdown for expense form
// DEPENDS ON: shadcn/ui Select, currencies
// LAST UPDATED: F33 - Multi-Currency Support

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/lib/currencies";

interface CurrencyPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function CurrencyPicker({
  value,
  onChange,
  disabled,
}: CurrencyPickerProps) {
  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-24">
        <SelectValue placeholder="INR" />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground">
                {c.symbol}
              </span>
              {c.code}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}