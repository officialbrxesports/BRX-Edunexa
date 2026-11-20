import PublicJoinForm from "../../../components/public/PublicJoinForm";

export const metadata = { title: "Apply to join | BRX EduNexa" };

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <PublicJoinForm code={code} />;
}
