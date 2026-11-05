import { PortalShell } from "@/components/portal-shell";
import { ChartIcon, HomeIcon, ListIcon, ShieldIcon, UserPlusIcon } from "@/components/icons";

// Every item stays under /student so the sidebar is always shown.
const nav = [
  { href: "/student", label: "Dashboard", icon: <HomeIcon />, exact: true },
  { href: "/student/elections", label: "Meet candidates & vote", icon: <ListIcon /> },
  { href: "/student/results", label: "Results", icon: <ChartIcon /> },
  { href: "/student/verify", label: "Verify my ballot", icon: <ShieldIcon /> },
  { href: "/student/apply", label: "Run for office", icon: <UserPlusIcon /> },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell nav={nav} role="Student portal" requiredRole="student" homeHref="/student">
      {children}
    </PortalShell>
  );
}
