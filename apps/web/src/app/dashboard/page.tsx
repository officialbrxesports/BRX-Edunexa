import DashboardAuth from "../../components/dashboard/DashboardAuth";
import RoleHome from "../../components/dashboard/RoleHome";

export default function DashboardPage() {
  return (
    <DashboardAuth>
      <RoleHome />
    </DashboardAuth>
  );
}
