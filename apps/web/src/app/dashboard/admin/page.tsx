import DashboardAuth from "../../../components/dashboard/DashboardAuth";
import PlatformAdminHome from "../../../components/dashboard/PlatformAdminHome";

export default function PlatformAdminPage() {
  return (
    <DashboardAuth platformOnly>
      <PlatformAdminHome />
    </DashboardAuth>
  );
}
