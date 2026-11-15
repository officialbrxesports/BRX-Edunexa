import CollegeAdd from "../../../../components/dashboard/CollegeAdd";
import DashboardAuth from "../../../../components/dashboard/DashboardAuth";

export default function CollegeAddPage() {
  return (
    <DashboardAuth headOnly>
      <CollegeAdd />
    </DashboardAuth>
  );
}
