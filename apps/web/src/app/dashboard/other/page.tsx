import DashboardAuth from "../../../components/dashboard/DashboardAuth";
import OtherDashboard from "../../../components/dashboard/OtherDashboard";

export default function OtherDashboardPage() {
  return (
    <DashboardAuth headOnly>
      <OtherDashboard />
    </DashboardAuth>
  );
}
