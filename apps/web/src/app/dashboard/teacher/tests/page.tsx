import DashboardAuth from "../../../../components/dashboard/DashboardAuth";
import { TeacherTestsPage } from "../../../../components/dashboard/TeacherTools";

export default function Page() {
  return (
    <DashboardAuth>
      <TeacherTestsPage />
    </DashboardAuth>
  );
}
