import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ActivityLog } from "./activity-log";

export const metadata: Metadata = { title: "Security & activity" };

export default function ActivityPage() {
  return (
    <>
      <PageHeader
        title="Security & activity"
        description="Every sign-in, failed attempt, idle sign-out, refused vote or sign-up, and administrative change."
      />
      <ActivityLog />
    </>
  );
}
