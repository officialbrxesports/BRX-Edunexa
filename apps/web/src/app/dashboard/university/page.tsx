import CollegeDashboard from "../../../components/dashboard/CollegeDashboard";
import DashboardAuth from "../../../components/dashboard/DashboardAuth";

export default function UniversityDashboardPage() {
  return (
    <DashboardAuth headOnly>
      <CollegeDashboard variant="university" />
    </DashboardAuth>
  );
}
