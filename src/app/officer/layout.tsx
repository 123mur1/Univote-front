import type { Metadata } from "next";
import { PortalShell } from "@/components/portal-shell";
import { BallotIcon, ChainIcon, DatabaseIcon, HomeIcon, UserPlusIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Election office" };

const nav = [
  { href: "/officer", label: "Dashboard", icon: <HomeIcon />, exact: true, section: "Overview" },
  { href: "/officer/elections", label: "Elections & results", icon: <BallotIcon />, section: "Elections" },
  { href: "/officer/candidates", label: "Review applicants", icon: <UserPlusIcon />, permission: "reviewCandidates", section: "Elections" },
  { href: "/officer/registry", label: "Eligibility list", icon: <DatabaseIcon />, permission: "viewVoterRoll", section: "Voters" },
  { href: "/officer/voters", label: "Voter roll", icon: <UsersIcon />, permission: "viewVoterRoll", section: "Voters" },
  { href: "/officer/audit", label: "Audit log", icon: <ChainIcon />, permission: "viewAuditLog", section: "Integrity" },
] as const;

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={[...nav]} role="Electoral Commission" requiredRole="officer" allowedRoles={["admin"]} homeHref="/officer">
      {children}
    </PortalShell>
  );
}
