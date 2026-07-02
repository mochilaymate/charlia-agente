import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const NAV = [
  { href: "/settings", label: "General", labelEn: "General", exact: true },
  { href: "/settings/business-info", label: "Info del negocio", labelEn: "Business Info" },
  { href: "/settings/prompts", label: "Prompts IA", labelEn: "AI Prompts" },
  { href: "/settings/templates", label: "Plantillas", labelEn: "Templates" },
  { href: "/settings/knowledge-base", label: "Base de conocimiento", labelEn: "Knowledge Base" },
  { href: "/settings/tools", label: "Tools / Conectores", labelEn: "Tools / Connectors" },
  { href: "/settings/channels", label: "Canales (YCloud)", labelEn: "Channels (YCloud)" },
  { href: "/settings/team", label: "Equipo", labelEn: "Team" },
];

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: dbUser } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (dbUser?.role !== "admin") redirect("/inbox");

  return (
    <div className="flex h-full">
      <nav className="w-52 shrink-0 border-r flex flex-col pt-4 px-2 gap-0.5"
        style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
          Configuración
        </p>
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}
            className="px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
            style={{ color: "var(--foreground)" }}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
