import CoachingAdd from "../../../../components/dashboard/CoachingAdd";
import DashboardAuth from "../../../../components/dashboard/DashboardAuth";

export default function CoachingAddPage() {
  return (
    <DashboardAuth headOnly>
      <CoachingAdd />
    </DashboardAuth>
  );
}
