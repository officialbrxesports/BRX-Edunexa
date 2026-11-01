import DashboardOverview from "../../components/dashboard/DashboardOverview";
import DashboardAuth from "../../components/dashboard/DashboardAuth";

export default function DashboardPage() {
  return (
    <DashboardAuth>
      <DashboardOverview type="other" />
    </DashboardAuth>
  );
}
