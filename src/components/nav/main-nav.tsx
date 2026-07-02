"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

interface MainNavProps {
  isAdmin?: boolean;
}

export function MainNav({ isAdmin = false }: MainNavProps) {
  const pathname = usePathname();
  const { lang, t, setLang } = useLanguage();

  const navItems = [
    {
      href: "/inbox",
      label: t.nav.inbox,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
          <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
      ),
    },
    {
      href: "/crm",
      label: t.nav.crm,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      href: "/content",
      label: t.nav.content,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      href: "/agenda",
      label: t.nav.agenda,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    ...(isAdmin
      ? [
          {
            href: "/settings",
            label: t.nav.settings,
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <nav
      className="flex flex-col h-full w-16 items-center py-4 gap-2"
      style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
    >
      {/* Logo */}
      <Link href="/inbox" className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm mb-2 shrink-0" style={{ background: "var(--primary)" }}>
        c°
      </Link>

      {/* Nav items */}
      <div className="flex flex-col gap-1 flex-1 w-full px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "w-full flex items-center justify-center h-10 rounded-lg transition-colors",
                isActive ? "text-white" : "hover:opacity-80"
              )}
              style={
                isActive
                  ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                  : { color: "var(--muted)" }
              }
            >
              {item.icon}
            </Link>
          );
        })}
      </div>

      {/* Language toggle */}
      <button
        onClick={() => setLang(lang === "es" ? "en" : "es")}
        title={lang === "es" ? "Switch to English" : "Cambiar a Español"}
        className="w-10 h-7 rounded-md text-xs font-bold transition-opacity hover:opacity-80 flex items-center justify-center"
        style={{
          background: "var(--surface-elevated)",
          color: "var(--muted)",
          border: "1px solid var(--border)",
        }}
      >
        {lang === "es" ? "EN" : "ES"}
      </button>

      {/* Theme toggle */}
      <ThemeToggle />
    </nav>
  );
}
