import DashboardAuth from "../../../components/dashboard/DashboardAuth";
import AdmissionFormsLibrary from "../../../components/dashboard/AdmissionFormsLibrary";

export default function AdmissionFormsPage() {
  return (
    <DashboardAuth>
      <AdmissionFormsLibrary />
    </DashboardAuth>
  );
}
