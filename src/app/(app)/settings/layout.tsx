import Link from "next/link";

const NAV = [
  { href: "/settings", label: "General", exact: true },
  { href: "/settings/business-info", label: "Info del negocio" },
  { href: "/settings/prompts", label: "Prompts IA" },
  { href: "/settings/templates", label: "Plantillas" },
  { href: "/settings/knowledge-base", label: "Base de conocimiento" },
  { href: "/settings/tools", label: "Tools / Conectores" },
  { href: "/settings/channels", label: "Canales (YCloud)" },
  { href: "/settings/team", label: "Equipo" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
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
