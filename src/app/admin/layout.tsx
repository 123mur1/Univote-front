import { PortalShell } from "@/components/portal-shell";
import { ActivityIcon, BallotIcon, ChainIcon, ChartIcon, DatabaseIcon, SettingsIcon, ShieldIcon, UsersIcon } from "@/components/icons";

// The system administrator's console: analytics, data and access control. Election operations
// (reviewing candidates, running elections) belong to the election officer portal.
const nav = [
  { href: "/admin", label: "Overview & analytics", icon: <ChartIcon />, exact: true },
  { href: "/admin/data", label: "Data explorer", icon: <DatabaseIcon /> },
  { href: "/admin/elections", label: "Elections", icon: <BallotIcon /> },
  { href: "/admin/users", label: "Users & access", icon: <UsersIcon /> },
  { href: "/admin/registry", label: "Registry & eligibility", icon: <ShieldIcon /> },
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
