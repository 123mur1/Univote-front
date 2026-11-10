import { PortalShell } from "@/components/portal-shell";
import { ActivityIcon, BallotIcon, ChainIcon, ChartIcon, DatabaseIcon, ListIcon, SettingsIcon, ShieldIcon, UserIcon, UsersIcon } from "@/components/icons";

// The system administrator's console: analytics, accounts, data and settings. "Election office"
// opens the officer tools (elections, applicants, results) with administrator rights.
const nav = [
  { href: "/admin", label: "Overview & analytics", icon: <ChartIcon />, exact: true },
  { href: "/admin/users", label: "Users & access", icon: <UserIcon /> },
  { href: "/admin/registry", label: "Registry & eligibility", icon: <ShieldIcon /> },
  { href: "/admin/elections", label: "Elections", icon: <BallotIcon /> },
  { href: "/officer", label: "Election office", icon: <ListIcon /> },
  { href: "/admin/voters", label: "Voter roll", icon: <UsersIcon /> },
  { href: "/admin/data", label: "Data explorer", icon: <DatabaseIcon /> },
  { href: "/admin/activity", label: "Security & activity", icon: <ActivityIcon /> },
  { href: "/admin/audit", label: "Election audit log", icon: <ChainIcon /> },
  { href: "/admin/settings", label: "System settings", icon: <SettingsIcon /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={nav} role="System administration" requiredRole="admin" homeHref="/admin">
      {children}
    </PortalShell>
  );
}
