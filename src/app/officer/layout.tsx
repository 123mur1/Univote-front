import type { Metadata } from "next";
import { PortalShell } from "@/components/portal-shell";
import { BallotIcon, ChainIcon, DatabaseIcon, HomeIcon, UserPlusIcon, UsersIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Election office" };

const nav = [
<<<<<<< HEAD
  { href: "/officer", label: "Dashboard", icon: <HomeIcon />, exact: true, section: "Overview" },
  { href: "/officer/elections", label: "Elections & results", icon: <BallotIcon />, section: "Elections" },
  { href: "/officer/candidates", label: "Review applicants", icon: <UserPlusIcon />, permission: "reviewCandidates", section: "Elections" },
  { href: "/officer/registry", label: "Eligibility list", icon: <DatabaseIcon />, permission: "viewVoterRoll", section: "Voters" },
  { href: "/officer/voters", label: "Voter roll", icon: <UsersIcon />, permission: "viewVoterRoll", section: "Voters" },
  { href: "/officer/audit", label: "Audit log", icon: <ChainIcon />, permission: "viewAuditLog", section: "Integrity" },
=======
  { href: "/officer", label: "Dashboard", icon: <HomeIcon />, exact: true },
  { href: "/officer/elections", label: "Elections & results", icon: <BallotIcon /> },
  { href: "/officer/candidates", label: "Review applicants", icon: <UserPlusIcon />, permission: "reviewCandidates" },
  { href: "/officer/registry", label: "Eligibility list", icon: <DatabaseIcon />, permission: "viewVoterRoll" },
  { href: "/officer/voters", label: "Voter roll", icon: <UsersIcon />, permission: "viewVoterRoll" },
  { href: "/officer/audit", label: "Audit log", icon: <ChainIcon />, permission: "viewAuditLog" },
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
] as const;

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={[...nav]} role="Electoral Commission" requiredRole="officer" allowedRoles={["admin"]} homeHref="/officer">
      {children}
    </PortalShell>
  );
}
