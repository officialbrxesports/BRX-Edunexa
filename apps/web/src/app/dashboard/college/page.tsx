import CollegeDashboard from "../../../components/dashboard/CollegeDashboard";
import DashboardAuth from "../../../components/dashboard/DashboardAuth";

export default function CollegeDashboardPage() {
  return (
    <DashboardAuth headOnly>
      <CollegeDashboard />
    </DashboardAuth>
  );
}
