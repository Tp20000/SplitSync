// FILE: apps/web/src/components/expenses/CategoryPicker.tsx
// PURPOSE: Category dropdown with icons for expense form
// DEPENDS ON: shadcn/ui Select, lucide-react
// LAST UPDATED: F14 - Expense Form UI

"use client";

import {
  CircleDot,
  Utensils,
  Car,
  Building,
  Film,
  ShoppingBag,
  Lightbulb,
  Home,
  Apple,
  Wine,
  Heart,
  GraduationCap,
  Gift,
  Plane,
  MoreHorizontal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types/expense";

const CATEGORY_CONFIG: Record<
  Category,
  { icon: React.ElementType; label: string }
> = {
  general: { icon: CircleDot, label: "General" },
  food: { icon: Utensils, label: "Food" },
  transport: { icon: Car, label: "Transport" },
  accommodation: { icon: Building, label: "Accommodation" },
  entertainment: { icon: Film, label: "Entertainment" },
  shopping: { icon: ShoppingBag, label: "Shopping" },
  utilities: { icon: Lightbulb, label: "Utilities" },
  rent: { icon: Home, label: "Rent" },
  groceries: { icon: Apple, label: "Groceries" },
  drinks: { icon: Wine, label: "Drinks" },
  health: { icon: Heart, label: "Health" },
  education: { icon: GraduationCap, label: "Education" },
  gifts: { icon: Gift, label: "Gifts" },
  travel: { icon: Plane, label: "Travel" },
  other: { icon: MoreHorizontal, label: "Other" },
};

interface CategoryPickerProps {
  value: Category;
  onChange: (value: Category) => void;
  disabled?: boolean;
}

export function CategoryPicker({
  value,
  onChange,
  disabled,
}: CategoryPickerProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as Category)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(CATEGORY_CONFIG).map(
          ([key, { icon: Icon, label }]) => (
            <SelectItem key={key} value={key}>
              <span className="flex items-center gap-2">
                <Icon size={14} />
                {label}
              </span>
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  );
}

export function getCategoryLabel(category: Category): string {
  return CATEGORY_CONFIG[category]?.label ?? "General";
}

export function getCategoryIcon(category: Category): React.ElementType {
  return CATEGORY_CONFIG[category]?.icon ?? CircleDot;
}

export { CATEGORY_CONFIG };