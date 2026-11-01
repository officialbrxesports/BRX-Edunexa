import CollegeDashboardOverview from "../../../components/dashboard/CollegeDashboardOverview";
import DashboardAuth from "../../../components/dashboard/DashboardAuth";

export default function CollegeDashboardPage() {
  return (
    <DashboardAuth>
      <CollegeDashboardOverview />
    </DashboardAuth>
  );
}
