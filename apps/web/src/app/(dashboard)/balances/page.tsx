// FILE: apps/web/src/app/(dashboard)/balances/page.tsx
// PURPOSE: Global balances page — server component shell
// DEPENDS ON: BalancesClient
// LAST UPDATED: F18 Fix - Server/Client split

import type { Metadata } from "next";
import { BalancesClient } from "@/components/balances/BalancesClient";

export const metadata: Metadata = {
  title: "Balances",
};

export default function BalancesPage() {
  return <BalancesClient />;
}