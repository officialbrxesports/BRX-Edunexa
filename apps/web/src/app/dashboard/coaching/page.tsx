import CoachingDashboard from "../../../components/dashboard/CoachingDashboard";
import DashboardAuth from "../../../components/dashboard/DashboardAuth";

export default function CoachingPage() {
  return (
    <DashboardAuth headOnly>
      <CoachingDashboard />
    </DashboardAuth>
  );
}
