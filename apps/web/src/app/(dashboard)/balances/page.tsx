

import type { Metadata } from "next";
import { BalancesClient } from "@/components/balances/BalancesClient";

export const metadata: Metadata = {
  title: "Balances",
};

export default function BalancesPage() {
  return <BalancesClient />;
}