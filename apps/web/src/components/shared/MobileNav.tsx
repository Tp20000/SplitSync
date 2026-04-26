// FILE: apps/web/src/components/shared/MobileNav.tsx
// PURPOSE: Bottom tab navigation for mobile devices
// DEPENDS ON: next/link, lucide-react, authStore
// LAST UPDATED: F42 - Mobile Responsive UI

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Scale,
  Activity,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  {
    href: "/dashboard",
    label: "Home",
    icon: LayoutDashboard,
  },
  {
    href: "/groups",
    label: "Groups",
    icon: Users,
  },
  {
    href: "/balances",
    label: "Balances",
    icon: Scale,
  },
  {
    href: "/activity",
    label: "Activity",
    icon: Activity,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden safe-bottom">
      <div className="flex items-center justify-around px-2 py-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] font-medium transition-colors touch-target",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}