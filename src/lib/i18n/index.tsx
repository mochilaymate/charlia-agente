"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Lang = "es" | "en";

const translations = {
  es: {
    nav: {
      inbox: "Inbox",
      crm: "CRM",
      content: "Contenido",
      agenda: "Agenda",
      settings: "Configuración",
    },
    settings: {
      title: "Configuración",
      general: "General",
      businessInfo: "Info del negocio",
      prompts: "Prompts IA",
      templates: "Plantillas",
      knowledgeBase: "Base de conocimiento",
      tools: "Tools / Conectores",
      channels: "Canales (YCloud)",
      team: "Equipo",
    },
    team: {
      title: "Gestión de equipo",
      subtitle: "Invitá usuarios por email. Recibirán sus credenciales con una contraseña temporal.",
      emailLabel: "Email del usuario",
      roleLabel: "Rol",
      agent: "Agente",
      manager: "Manager",
      viewer: "Viewer (solo lectura)",
      sendInvite: "Enviar invitación",
      sending: "Enviando…",
      errorDefault: "Error al enviar invitación",
    },
    inbox: {
      title: "Inbox",
      noConversations: "No hay conversaciones",
      searchPlaceholder: "Buscar conversaciones…",
      you: "Tú",
      aiActive: "IA activa",
      humanMode: "Modo humano",
      sendPlaceholder: "Escribí un mensaje…",
      send: "Enviar",
      handoff: "Transferir a humano",
      toggleAI: "Activar IA",
      internalNote: "Nota interna",
    },
    crm: {
      title: "CRM",
      contacts: "Contactos",
      noContacts: "No hay contactos",
      searchPlaceholder: "Buscar contactos…",
      name: "Nombre",
      phone: "Teléfono",
      email: "Email",
      tags: "Etiquetas",
      stage: "Etapa",
    },
    content: {
      title: "Creador de contenido",
      platform: "Plataforma",
      niche: "Nicho",
      topic: "Tema del post",
      tone: "Tono",
      generate: "Generar con IA",
      generating: "Generando…",
      post: "Post generado",
      hashtags: "Hashtags",
      postingTimes: "Mejores horarios para postear",
      trendingIdeas: "Ideas en tendencia",
      uploadImage: "Subir imagen",
      copy: "Copiar",
      copied: "¡Copiado!",
      tones: { professional: "Profesional", casual: "Casual", inspirational: "Inspiracional", humorous: "Humor", educational: "Educativo" },
    },
    agenda: {
      title: "Agenda",
      newEvent: "Nuevo evento",
      today: "Hoy",
      listView: "Lista",
      weekView: "Semana",
      monthView: "Mes",
      noEvents: "No hay eventos en este período",
      connectCalendar: "Conectar Google Calendar",
      eventTitle: "Título del evento",
      start: "Inicio",
      end: "Fin",
      description: "Descripción",
      attendees: "Asistentes",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      reschedule: "Reprogramar",
    },
    common: {
      save: "Guardar",
      cancel: "Cancelar",
      loading: "Cargando…",
      error: "Error",
      success: "Guardado",
      delete: "Eliminar",
      edit: "Editar",
      close: "Cerrar",
      back: "Volver",
    },
  },
  en: {
    nav: {
      inbox: "Inbox",
      crm: "CRM",
      content: "Content",
      agenda: "Calendar",
      settings: "Settings",
    },
    settings: {
      title: "Settings",
      general: "General",
      businessInfo: "Business Info",
      prompts: "AI Prompts",
      templates: "Templates",
      knowledgeBase: "Knowledge Base",
      tools: "Tools / Connectors",
      channels: "Channels (YCloud)",
      team: "Team",
    },
    team: {
      title: "Team Management",
      subtitle: "Invite users by email. They will receive their access credentials with a temporary password.",
      emailLabel: "User email",
      roleLabel: "Role",
      agent: "Agent",
      manager: "Manager",
      viewer: "Viewer (read-only)",
      sendInvite: "Send invitation",
      sending: "Sending…",
      errorDefault: "Error sending invitation",
    },
    inbox: {
      title: "Inbox",
      noConversations: "No conversations",
      searchPlaceholder: "Search conversations…",
      you: "You",
      aiActive: "AI active",
      humanMode: "Human mode",
      sendPlaceholder: "Type a message…",
      send: "Send",
      handoff: "Transfer to human",
      toggleAI: "Enable AI",
      internalNote: "Internal note",
    },
    crm: {
      title: "CRM",
      contacts: "Contacts",
      noContacts: "No contacts",
      searchPlaceholder: "Search contacts…",
      name: "Name",
      phone: "Phone",
      email: "Email",
      tags: "Tags",
      stage: "Stage",
    },
    content: {
      title: "Content Creator",
      platform: "Platform",
      niche: "Niche",
      topic: "Post topic",
      tone: "Tone",
      generate: "Generate with AI",
      generating: "Generating…",
      post: "Generated post",
      hashtags: "Hashtags",
      postingTimes: "Best posting times",
      trendingIdeas: "Trending ideas",
      uploadImage: "Upload image",
      copy: "Copy",
      copied: "Copied!",
      tones: { professional: "Professional", casual: "Casual", inspirational: "Inspirational", humorous: "Humor", educational: "Educational" },
    },
    agenda: {
      title: "Calendar",
      newEvent: "New event",
      today: "Today",
      listView: "List",
      weekView: "Week",
      monthView: "Month",
      noEvents: "No events in this period",
      connectCalendar: "Connect Google Calendar",
      eventTitle: "Event title",
      start: "Start",
      end: "End",
      description: "Description",
      attendees: "Attendees",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      reschedule: "Reschedule",
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      loading: "Loading…",
      error: "Error",
      success: "Saved",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
      back: "Back",
    },
  },
};

export type Translations = typeof translations.es;

interface LangContextValue {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: "es",
  t: translations.es,
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("charlia-lang") as Lang | null;
    if (saved === "en" || saved === "es") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("charlia-lang", l);
  }

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LangContext);
}
