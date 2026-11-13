import { redirect } from "next/navigation";

// Classes & Sections now opens inside the school dashboard.
export default function ClassesRedirectPage() {
  redirect("/dashboard/school");
}
