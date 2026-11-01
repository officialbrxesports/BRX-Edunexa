import UniversityDashboardOverview from "../../../components/dashboard/UniversityDashboardOverview";
import DashboardAuth from "../../../components/dashboard/DashboardAuth";

export default function UniversityDashboardPage() {
  return (
    <DashboardAuth>
      <UniversityDashboardOverview />
    </DashboardAuth>
  );
}
