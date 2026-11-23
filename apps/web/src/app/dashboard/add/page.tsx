import { redirect } from "next/navigation";

/** Everything that used to live in "Add" is now inside the dashboard itself. */
export default function AddPage() {
  redirect("/dashboard");
}
