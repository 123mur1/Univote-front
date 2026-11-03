import type { Metadata } from "next";
import { ResultsList } from "@/components/views/results-list";

export const metadata: Metadata = { title: "Results" };

export default function ResultsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <ResultsList />
    </div>
  );
}
