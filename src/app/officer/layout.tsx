import type { Metadata } from "next";
import { PortalShell } from "@/components/portal-shell";
import { BallotIcon, ChainIcon, DatabaseIcon, HomeIcon, UserPlusIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Election office" };

const nav = [
  { href: "/officer", label: "Dashboard", icon: <HomeIcon />, exact: true },
  { href: "/officer/elections", label: "Elections & results", icon: <BallotIcon /> },
  { href: "/officer/candidates", label: "Review applicants", icon: <UserPlusIcon />, permission: "reviewCandidates" },
  { href: "/officer/registry", label: "Eligibility list", icon: <DatabaseIcon />, permission: "viewVoterRoll" },
  { href: "/officer/voters", label: "Voter roll", icon: <UsersIcon />, permission: "viewVoterRoll" },
  { href: "/officer/audit", label: "Audit log", icon: <ChainIcon />, permission: "viewAuditLog" },
] as const;

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={[...nav]} role="Electoral Commission" requiredRole="officer" allowedRoles={["admin"]} homeHref="/officer">
      {children}
    </PortalShell>
  );
}
