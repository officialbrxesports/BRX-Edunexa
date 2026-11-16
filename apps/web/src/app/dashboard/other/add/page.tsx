import DashboardAuth from "../../../../components/dashboard/DashboardAuth";
import OtherAdd from "../../../../components/dashboard/OtherAdd";

export default function OtherAddPage() {
  return (
    <DashboardAuth headOnly>
      <OtherAdd />
    </DashboardAuth>
  );
}
