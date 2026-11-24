import type { Metadata } from "next";
import { ElectionsList } from "@/components/views/elections-list";

export const metadata: Metadata = { title: "Elections" };

export default function ElectionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <ElectionsList />
    </div>
  );
}
