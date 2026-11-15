import DashboardAuth from "../../../components/dashboard/DashboardAuth";
import InstituteDashboard from "../../../components/dashboard/InstituteDashboard";

export default function InstituteDashboardPage() {
  return (
    <DashboardAuth headOnly>
      <InstituteDashboard />
    </DashboardAuth>
  );
}
