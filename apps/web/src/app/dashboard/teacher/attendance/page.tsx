import DashboardAuth from "../../../../components/dashboard/DashboardAuth";
import { TeacherAttendancePage } from "../../../../components/dashboard/TeacherTools";

export default function Page() {
  return (
    <DashboardAuth>
      <TeacherAttendancePage />
    </DashboardAuth>
  );
}
