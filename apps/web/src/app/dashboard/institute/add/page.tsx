import DashboardAuth from "../../../../components/dashboard/DashboardAuth";
import InstituteAdd from "../../../../components/dashboard/InstituteAdd";

export default function InstituteAddPage() {
  return (
    <DashboardAuth headOnly>
      <InstituteAdd />
    </DashboardAuth>
  );
}
