"use client";
import { useState, useEffect, useCallback } from "react";

interface GEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
}

type View = "list" | "week" | "month";

function getdt(ev: GEvent["start"]) {
  return ev.dateTime ?? (ev.date ? ev.date + "T12:00:00" : "");
}
function fmt(dt: string) {
  if (!dt || !dt.includes("T")) return "Todo el día";
  return new Date(dt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfWeek(d: Date) {
  const s = new Date(d);
  const day = s.getDay();
  s.setDate(s.getDate() - (day === 0 ? 6 : day - 1));
  s.setHours(0, 0, 0, 0);
  return s;
}

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export default function AgendaPage() {
  const [view, setView] = useState<View>("list");
  const [anchor, setAnchor] = useState(() => new Date());
  const [events, setEvents] = useState<GEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [form, setForm] = useState({ summary: "", description: "", date: "", startTime: "", endTime: "", attendeeEmail: "" });
  const [saving, setSaving] = useState(false);
  const [emergencyDate, setEmergencyDate] = useState("");
  const [emergencyEvents, setEmergencyEvents] = useState<GEvent[]>([]);
  const [rescheduling, setRescheduling] = useState(false);

  const load = useCallback(async (date: Date, v: View) => {
    setLoading(true);
    let timeMin: Date, timeMax: Date;
    if (v === "list") {
      timeMin = new Date();
      timeMax = new Date(Date.now() + 30 * 86400000);
    } else if (v === "week") {
      timeMin = startOfWeek(date);
      timeMax = new Date(timeMin.getTime() + 7 * 86400000);
    } else {
      timeMin = new Date(date.getFullYear(), date.getMonth(), 1);
      timeMax = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    }
    const res = await fetch(`/api/agenda?timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}`);
    const data = await res.json();
    setConnected(data.connected ?? false);
    setEvents(data.events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(anchor, view); }, [load, anchor, view]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) { load(anchor, view); window.history.replaceState({}, "", "/agenda"); }
  }, [load, anchor, view]);

  function navigate(dir: -1 | 1) {
    setAnchor(prev => {
      const d = new Date(prev);
      if (view === "week") d.setDate(d.getDate() + dir * 7);
      else if (view === "month") d.setMonth(d.getMonth() + dir);
      else d.setDate(d.getDate() + dir * 30);
      return d;
    });
  }

  function navLabel() {
    if (view === "week") {
      const s = startOfWeek(anchor);
      const e = new Date(s.getTime() + 6 * 86400000);
      return `${s.getDate()} ${MONTHS_ES[s.getMonth()].slice(0,3)} – ${e.getDate()} ${MONTHS_ES[e.getMonth()].slice(0,3)} ${e.getFullYear()}`;
    }
    if (view === "month") return `${MONTHS_ES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    return "Próximos 30 días";
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        summary: form.summary,
        description: form.description,
        start: { dateTime: `${form.date}T${form.startTime}:00`, timeZone: "Europe/Madrid" },
        end: { dateTime: `${form.date}T${form.endTime}:00`, timeZone: "Europe/Madrid" },
        ...(form.attendeeEmail ? { attendees: [{ email: form.attendeeEmail }] } : {}),
      }),
    });
    setShowNew(false);
    setForm({ summary: "", description: "", date: "", startTime: "", endTime: "", attendeeEmail: "" });
    await load(anchor, view);
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm("¿Eliminar esta cita?")) return;
    await fetch(`/api/agenda/${id}`, { method: "DELETE" });
    await load(anchor, view);
  }

  async function loadEmergencyDay() {
    if (!emergencyDate) return;
    const start = new Date(`${emergencyDate}T00:00:00`).toISOString();
    const end = new Date(`${emergencyDate}T23:59:59`).toISOString();
    const res = await fetch(`/api/agenda?timeMin=${start}&timeMax=${end}`);
    const data = await res.json();
    setEmergencyEvents(data.events ?? []);
  }

  async function rescheduleDay(newDate: string) {
    if (!newDate) return;
    setRescheduling(true);
    for (const ev of emergencyEvents) {
      const origStart = new Date(getdt(ev.start));
      const origEnd = new Date(getdt(ev.end));
      const duration = origEnd.getTime() - origStart.getTime();
      const newStart = new Date(`${newDate}T${origStart.toTimeString().slice(0, 5)}:00`);
      const newEnd = new Date(newStart.getTime() + duration);
      await fetch(`/api/agenda/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: { dateTime: newStart.toISOString() },
          end: { dateTime: newEnd.toISOString() },
        }),
      });
    }
    setShowEmergency(false);
    setEmergencyEvents([]);
    setEmergencyDate("");
    await load(anchor, view);
    setRescheduling(false);
  }

  function eventsForDay(d: Date) {
    return events.filter(ev => isSameDay(new Date(getdt(ev.start)), d));
  }

  if (loading) return <div className="p-8 text-sm" style={{ color: "var(--muted)" }}>Cargando agenda…</div>;

  if (!connected) {
    return (
      <div className="p-8 flex flex-col items-center gap-4 max-w-md mx-auto mt-16">
        <div className="text-4xl">📅</div>
        <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Conectá tu Google Calendar</h1>
        <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
          Conectá tu calendario para que Charlia pueda agendar, modificar y cancelar citas directamente desde WhatsApp.
        </p>
        <a href="/api/auth/google"
          className="px-6 py-3 rounded-xl font-medium text-sm"
          style={{ background: "var(--primary)", color: "white" }}>
          Conectar Google Calendar
        </a>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────
  const grouped = events.reduce<Record<string, GEvent[]>>((acc, ev) => {
    const day = getdt(ev.start).slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(ev);
    return acc;
  }, {});

  // ── Week view ──────────────────────────────────────────────────────────
  const weekStart = startOfWeek(anchor);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  // ── Month view ─────────────────────────────────────────────────────────
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const firstCell = new Date(monthStart);
  firstCell.setDate(1 - (monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1));
  const monthCells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate() + i);
    return d;
  });
  const today = new Date();

  const EventPill = ({ ev, small = false }: { ev: GEvent; small?: boolean }) => (
    <div
      className={`flex items-center justify-between gap-1 rounded px-1.5 ${small ? "py-0.5" : "py-1 px-2"}`}
      style={{ background: "var(--primary)", opacity: 0.9 }}
    >
      <span className={`truncate font-medium ${small ? "text-[10px]" : "text-xs"}`} style={{ color: "white" }}>
        {!small && <span className="opacity-75 mr-1">{fmt(getdt(ev.start))}</span>}
        {ev.summary}
      </span>
      {!small && (
        <button onClick={() => deleteEvent(ev.id)} className="text-white opacity-60 hover:opacity-100 shrink-0 text-xs">✕</button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>Agenda</h1>
          {/* View tabs */}
          <div className="flex rounded-lg overflow-hidden text-xs" style={{ border: "1px solid var(--border)" }}>
            {(["list", "week", "month"] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-3 py-1.5 font-medium transition-colors"
                style={view === v
                  ? { background: "var(--primary)", color: "white" }
                  : { background: "var(--surface)", color: "var(--muted)" }}>
                {v === "list" ? "Lista" : v === "week" ? "Semana" : "Mes"}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          {view !== "list" && (
            <>
              <button onClick={() => navigate(-1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}>‹</button>
              <span className="text-sm font-medium min-w-40 text-center" style={{ color: "var(--foreground)" }}>{navLabel()}</span>
              <button onClick={() => navigate(1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }}>›</button>
              <button onClick={() => setAnchor(new Date())}
                className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>Hoy</button>
            </>
          )}
          {view === "list" && <span className="text-sm" style={{ color: "var(--muted)" }}>{navLabel()}</span>}
          <div className="w-px h-5 mx-1" style={{ background: "var(--border)" }} />
          <button onClick={() => setShowEmergency(true)}
            className="px-3 py-1.5 text-xs rounded-lg font-medium"
            style={{ background: "var(--destructive)", color: "white" }}>
            🚨 Emergencia
          </button>
          <button onClick={() => setShowNew(true)}
            className="px-3 py-1.5 text-xs rounded-lg font-medium"
            style={{ background: "var(--primary)", color: "white" }}>
            + Nueva cita
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <div className="p-6 max-w-3xl space-y-4">
            {Object.keys(grouped).length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>No hay citas próximas</p>
            ) : Object.entries(grouped).map(([day, dayEvents]) => (
              <div key={day} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                  {fmtDate(day + "T12:00:00")}
                </p>
                {dayEvents.map(ev => (
                  <div key={ev.id} className="flex items-start justify-between p-4 rounded-xl"
                    style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
                    <div>
                      <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{ev.summary}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {fmt(getdt(ev.start))} – {fmt(getdt(ev.end))}
                      </p>
                      {ev.attendees?.map(a => (
                        <p key={a.email} className="text-xs mt-0.5" style={{ color: "var(--primary)" }}>
                          {a.displayName ?? a.email}
                        </p>
                      ))}
                      {ev.description && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>{ev.description}</p>}
                    </div>
                    <button onClick={() => deleteEvent(ev.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: "var(--destructive)", background: "transparent" }}>✕</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── WEEK VIEW ── */}
        {view === "week" && (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              {weekDays.map((d, i) => {
                const isToday = isSameDay(d, today);
                return (
                  <div key={i} className="py-3 text-center" style={{ borderRight: i < 6 ? "1px solid var(--border)" : undefined }}>
                    <p className="text-xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>{DAYS_ES[i]}</p>
                    <p className={`text-lg font-bold mt-0.5 w-9 h-9 rounded-full flex items-center justify-center mx-auto ${isToday ? "text-white" : ""}`}
                      style={isToday ? { background: "var(--primary)", color: "white" } : { color: "var(--foreground)" }}>
                      {d.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-7 flex-1 overflow-auto">
              {weekDays.map((d, i) => {
                const dayEvs = eventsForDay(d);
                const isToday = isSameDay(d, today);
                return (
                  <div key={i} className="p-2 space-y-1 min-h-32"
                    style={{
                      borderRight: i < 6 ? "1px solid var(--border)" : undefined,
                      background: isToday ? "color-mix(in srgb, var(--primary) 4%, transparent)" : undefined,
                    }}>
                    {dayEvs.length === 0 && (
                      <p className="text-[10px] text-center mt-4" style={{ color: "var(--border)" }}>–</p>
                    )}
                    {dayEvs.map(ev => <EventPill key={ev.id} ev={ev} />)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MONTH VIEW ── */}
        {view === "month" && (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              {DAYS_ES.map(d => (
                <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: "repeat(6, minmax(0, 1fr))" }}>
              {monthCells.map((d, i) => {
                const isCurrentMonth = d.getMonth() === anchor.getMonth();
                const isToday = isSameDay(d, today);
                const dayEvs = eventsForDay(d);
                const MAX = 3;
                return (
                  <div key={i} className="p-1.5 space-y-0.5 overflow-hidden"
                    style={{
                      borderRight: (i + 1) % 7 !== 0 ? "1px solid var(--border)" : undefined,
                      borderBottom: i < 35 ? "1px solid var(--border)" : undefined,
                      opacity: isCurrentMonth ? 1 : 0.35,
                    }}>
                    <p className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? "text-white" : ""}`}
                      style={isToday ? { background: "var(--primary)" } : { color: "var(--foreground)" }}>
                      {d.getDate()}
                    </p>
                    {dayEvs.slice(0, MAX).map(ev => <EventPill key={ev.id} ev={ev} small />)}
                    {dayEvs.length > MAX && (
                      <p className="text-[10px] pl-1" style={{ color: "var(--muted)" }}>+{dayEvs.length - MAX} más</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* New event modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <form onSubmit={createEvent} className="w-full max-w-md p-6 rounded-2xl space-y-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>Nueva cita</h2>
            {[
              { key: "summary", label: "Título", type: "text", required: true },
              { key: "description", label: "Descripción", type: "text", required: false },
              { key: "date", label: "Fecha", type: "date", required: true },
              { key: "startTime", label: "Hora inicio", type: "time", required: true },
              { key: "endTime", label: "Hora fin", type: "time", required: true },
              { key: "attendeeEmail", label: "Email del cliente (opcional)", type: "email", required: false },
            ].map(({ key, label, type, required }) => (
              <div key={key} className="space-y-1">
                <label className="text-xs" style={{ color: "var(--muted)" }}>{label}</label>
                <input type={type} required={required}
                  value={(form as Record<string, string>)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
              </div>
            ))}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowNew(false)}
                className="px-4 py-2 text-sm rounded-lg"
                style={{ background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="px-4 py-2 text-sm rounded-lg font-medium disabled:opacity-60"
                style={{ background: "var(--primary)", color: "white" }}>
                {saving ? "Guardando…" : "Crear cita"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Emergency modal */}
      {showEmergency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg p-6 rounded-2xl space-y-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--destructive)" }}>🚨 Reprogramación de emergencia</h2>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Seleccioná el día afectado y el nuevo día. Todas las citas se moverán manteniendo sus horarios.
            </p>
            <div className="space-y-1">
              <label className="text-xs" style={{ color: "var(--muted)" }}>Día a cancelar</label>
              <div className="flex gap-2">
                <input type="date" value={emergencyDate} onChange={e => setEmergencyDate(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg outline-none"
                  style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
                <button onClick={loadEmergencyDay}
                  className="px-3 py-2 text-sm rounded-lg"
                  style={{ background: "var(--primary)", color: "white" }}>Ver citas</button>
              </div>
            </div>
            {emergencyEvents.length > 0 && (
              <>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {emergencyEvents.map(ev => (
                    <div key={ev.id} className="flex justify-between p-3 rounded-lg"
                      style={{ background: "var(--surface-elevated)", border: "1px solid var(--border)" }}>
                      <span className="text-sm" style={{ color: "var(--foreground)" }}>{ev.summary}</span>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{fmt(getdt(ev.start))}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <label className="text-xs" style={{ color: "var(--muted)" }}>Nuevo día</label>
                  <input type="date" id="newDay"
                    className="w-full px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ background: "var(--surface-elevated)", color: "var(--foreground)", border: "1px solid var(--border)" }} />
                </div>
                <button onClick={() => {
                  const nd = (document.getElementById("newDay") as HTMLInputElement).value;
                  rescheduleDay(nd);
                }} disabled={rescheduling}
                  className="w-full py-2 text-sm rounded-lg font-medium disabled:opacity-60"
                  style={{ background: "var(--destructive)", color: "white" }}>
                  {rescheduling ? "Reprogramando…" : `Mover ${emergencyEvents.length} citas al nuevo día`}
                </button>
              </>
            )}
            <button onClick={() => { setShowEmergency(false); setEmergencyEvents([]); }}
              className="w-full py-2 text-sm rounded-lg"
              style={{ background: "var(--surface-elevated)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
