import type { Metadata } from "next";
import { ElectionsList } from "@/components/views/elections-list";

export const metadata: Metadata = { title: "Elections" };

export default function StudentElectionsPage() {
  return <ElectionsList base="/student" />;
}
