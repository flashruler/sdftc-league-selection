import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminPageClient from "./AdminPageClient";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const auth = cookieStore.get("sdftc_admin_auth")?.value;
  if (auth !== "1") {
    redirect("/admin/login?next=/admin");
  }
  return <AdminPageClient />;
}
