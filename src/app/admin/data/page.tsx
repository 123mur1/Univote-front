import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { DataExplorer } from "./data-explorer";

export const metadata: Metadata = { title: "Data explorer" };

export default function DataPage() {
  return (
    <>
      <PageHeader
        title="Data explorer"
        description="Search, filter, sort and export any dataset in the system. Exports contain exactly the rows and columns you see."
      />
      <DataExplorer />
    </>
  );
}
