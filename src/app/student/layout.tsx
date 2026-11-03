import { PortalShell } from "@/components/portal-shell";
import { BallotIcon, ChainIcon, ChartIcon, HomeIcon, ListIcon, ShieldIcon, UserPlusIcon } from "@/components/icons";
import { currentStudent } from "@/lib/data";

// Every item stays under /student so the sidebar is always shown.
const nav = [
  { href: "/student", label: "Dashboard", icon: <HomeIcon />, exact: true },
  { href: "/student/vote/sug-2026", label: "Cast my vote", icon: <BallotIcon /> },
  { href: "/student/elections", label: "Elections & candidates", icon: <ListIcon /> },
  { href: "/student/results", label: "Results", icon: <ChartIcon /> },
  { href: "/student/verify", label: "Verify my ballot", icon: <ShieldIcon /> },
  { href: "/student/apply", label: "Run for office", icon: <UserPlusIcon /> },
  { href: "/student/audit", label: "Audit log", icon: <ChainIcon /> },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell
      nav={nav}
      role="Student portal"
      homeHref="/student"
      user={{ name: currentStudent.name, detail: currentStudent.studentId }}
    >
      {children}
    </PortalShell>
  );
}
