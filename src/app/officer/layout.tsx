import type { Metadata } from "next";
import { PortalShell } from "@/components/portal-shell";
import { BallotIcon, HomeIcon, UserPlusIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Election monitoring" };

const nav = [
  { href: "/officer", label: "Monitoring", icon: <HomeIcon />, exact: true },
  { href: "/officer/elections", label: "Elections", icon: <BallotIcon /> },
  { href: "/officer/candidates", label: "Review applicants", icon: <UserPlusIcon />, permission: "reviewCandidates" },
  { href: "/officer/voters", label: "Voter roll", icon: <UsersIcon />, permission: "viewVoterRoll" },
] as const;

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={[...nav]} role="Electoral Commission" requiredRole="officer" homeHref="/officer">
      {children}
    </PortalShell>
  );
}
