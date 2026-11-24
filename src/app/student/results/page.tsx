import type { Metadata } from "next";
import { ResultsList } from "@/components/views/results-list";

export const metadata: Metadata = { title: "Results" };

export default function StudentResultsPage() {
  return <ResultsList base="/student" />;
}
