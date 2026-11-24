import { PermissionGate } from "@/components/permission-gate";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <PermissionGate permission="manageElections">{children}</PermissionGate>;
}
