import { PortalShell } from "@/components/portal-shell";
import { BallotIcon, ChainIcon, HomeIcon, UserPlusIcon, UsersIcon } from "@/components/icons";

const nav = [
  { href: "/admin", label: "Monitoring", icon: <HomeIcon />, exact: true },
  { href: "/admin/elections", label: "Elections", icon: <BallotIcon /> },
  { href: "/admin/candidates", label: "Review applicants", icon: <UserPlusIcon /> },
  { href: "/admin/voters", label: "Voter roll", icon: <UsersIcon /> },
  { href: "/admin/audit", label: "Audit log", icon: <ChainIcon /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      nav={nav}
      role="Electoral Commission"
      homeHref="/admin"
      user={{ name: "Jeanne Kamanzi", detail: "Election Officer" }}
    >
      {children}
    </PortalShell>
  );
}
