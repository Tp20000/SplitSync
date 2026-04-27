

import type { Metadata } from "next";
import { ActivityClient } from "@/components/activity/ActivityClient";

export const metadata: Metadata = {
  title: "Activity",
};

export default function ActivityPage() {
  return <ActivityClient />;
}