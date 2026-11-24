import { PortalShell } from "@/components/portal-shell";
import { ActivityIcon, BallotIcon, ChainIcon, ChartIcon, DatabaseIcon, ListIcon, SettingsIcon, ShieldIcon, UserIcon, UsersIcon } from "@/components/icons";

// The system administrator's console: analytics, accounts, data and settings. "Election office"
// opens the officer tools (elections, applicants, results) with administrator rights.
const nav = [
<<<<<<< HEAD
  { href: "/admin", label: "Overview & analytics", icon: <ChartIcon />, exact: true, section: "Overview" },
  { href: "/admin/users", label: "Users & access", icon: <UserIcon />, section: "People & data" },
  { href: "/admin/registry", label: "Registry & eligibility", icon: <ShieldIcon />, section: "People & data" },
  { href: "/admin/data", label: "Data explorer", icon: <DatabaseIcon />, section: "People & data" },
  { href: "/admin/elections", label: "Elections", icon: <BallotIcon />, section: "Elections" },
  { href: "/officer", label: "Election office", icon: <ListIcon />, section: "Elections" },
  { href: "/admin/voters", label: "Voter roll", icon: <UsersIcon />, section: "Elections" },
  { href: "/admin/activity", label: "Security & activity", icon: <ActivityIcon />, section: "Security" },
  { href: "/admin/audit", label: "Election audit log", icon: <ChainIcon />, section: "Security" },
  { href: "/admin/settings", label: "System settings", icon: <SettingsIcon />, section: "Security" },
=======
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
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={nav} role="System administration" requiredRole="admin" homeHref="/admin">
      {children}
    </PortalShell>
  );
}
