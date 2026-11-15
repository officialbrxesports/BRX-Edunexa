import DashboardAuth from "../../../components/dashboard/DashboardAuth";
import TranscriptView from "../../../components/dashboard/TranscriptView";

export default function TranscriptPage() {
  return (
    <DashboardAuth>
      <TranscriptView />
    </DashboardAuth>
  );
}
