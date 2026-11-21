import DashboardAuth from "../../../../components/dashboard/DashboardAuth";
import { TeacherNotesPage } from "../../../../components/dashboard/TeacherTools";

export default function Page() {
  return (
    <DashboardAuth>
      <TeacherNotesPage />
    </DashboardAuth>
  );
}
