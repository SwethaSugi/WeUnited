import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateUserClient } from "@/components/admin/create-user-client";

export default async function CreateUserPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/admin");

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, name, location")
    .eq("is_active", true)
    .order("name");

  return <CreateUserClient chapters={chapters ?? []} />;
}
