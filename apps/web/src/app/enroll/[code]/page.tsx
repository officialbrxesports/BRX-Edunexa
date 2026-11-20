import PublicProgramApplyForm from "../../../components/public/PublicProgramApplyForm";

export const metadata = { title: "Apply for admission | BRX EduNexa" };

export default async function EnrollPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return <PublicProgramApplyForm code={code} />;
}
