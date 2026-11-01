import DashboardOverview from "../../../components/dashboard/DashboardOverview";
import DashboardAuth from "../../../components/dashboard/DashboardAuth";

export default function SchoolDashboardPage() {
  return (
    <DashboardAuth headOnly>
      <DashboardOverview type="school" />
    </DashboardAuth>
  );
}
