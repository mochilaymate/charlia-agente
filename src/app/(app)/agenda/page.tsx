"use client";
import { useState, useEffect, useCallback } from "react";

interface GEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees?: Array<{ email: string; displayName?: string }>;
}

function fmt(dt: string) {
  return new Date(dt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(dt: string) {
  return new Date(dt).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
}

export default function AgendaPage() {
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

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 86400000);
    const res = await fetch(`/api/agenda?timeMin=${now.toISOString()}&timeMax=${end.toISOString()}`);
    const data = await res.json();
    setConnected(data.connected ?? false);
    setEvents(data.events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected")) { load(); window.history.replaceState({}, "", "/agenda"); }
  }, [load]);

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
    await load();
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    if (!confirm("¿Eliminar esta cita?")) return;
    await fetch(`/api/agenda/${id}`, { method: "DELETE" });
    await load();
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
      const origStart = new Date(ev.start.dateTime);
      const origEnd = new Date(ev.end.dateTime);
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
    await load();
    setRescheduling(false);
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

  const grouped = events.reduce<Record<string, GEvent[]>>((acc, ev) => {
    const day = ev.start.dateTime.slice(0, 10);
    if (!acc[day]) acc[day] = [];
    acc[day].push(ev);
    return acc;
  }, {});

  return (
    <div className="p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Agenda</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>Próximos 30 días</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEmergency(true)}
            className="px-3 py-2 text-sm rounded-lg font-medium"
            style={{ background: "var(--destructive)", color: "white" }}>
            🚨 Emergencia
          </button>
          <button onClick={() => setShowNew(true)}
            className="px-3 py-2 text-sm rounded-lg font-medium"
            style={{ background: "var(--primary)", color: "white" }}>
            + Nueva cita
          </button>
        </div>
      </div>

      {/* Event list */}
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
                  {fmt(ev.start.dateTime)} – {fmt(ev.end.dateTime)}
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
                      <span className="text-xs" style={{ color: "var(--muted)" }}>{fmt(ev.start.dateTime)}</span>
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
