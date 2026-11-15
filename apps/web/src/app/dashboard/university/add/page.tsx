import CollegeAdd from "../../../../components/dashboard/CollegeAdd";
import DashboardAuth from "../../../../components/dashboard/DashboardAuth";

export default function UniversityAddPage() {
  return (
    <DashboardAuth headOnly>
      <CollegeAdd variant="university" />
    </DashboardAuth>
  );
}
