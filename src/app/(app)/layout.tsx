import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MainNav } from "@/components/nav/main-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      <MainNav />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
