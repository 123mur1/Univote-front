import type { Metadata } from "next";
import { elections } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { RegistryAdmin } from "./registry-admin";

export const metadata: Metadata = { title: "Registry & eligibility" };

export default function RegistryPage() {
  return (
    <>
      <PageHeader
        title="Registry & eligibility"
        description="The registry office's student list decides who can sign up and vote. Keep it current and the rules enforce themselves."
      />
      <RegistryAdmin elections={elections} />
    </>
  );
}
