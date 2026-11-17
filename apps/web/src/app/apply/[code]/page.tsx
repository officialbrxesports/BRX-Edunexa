import PublicApplyForm from "../../../components/public/PublicApplyForm";

export const metadata = { title: "Apply for admission | BRX EduNexa" };

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <PublicApplyForm code={code} />;
}
