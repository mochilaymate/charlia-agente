const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3";

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
}

export function getOAuthUrl(workspaceId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
    state: workspaceId,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeCode(code: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json();
}

async function calendarFetch(accessToken: string, path: string, options: RequestInit = {}) {
  const res = await fetch(`${CALENDAR_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Calendar API ${res.status}: ${err}`);
  }
  return res.status === 204 ? null : res.json();
}

export async function listEvents(accessToken: string, timeMin: string, timeMax: string, calendarId = "primary") {
  const params = new URLSearchParams({ timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "50" });
  return calendarFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events?${params}`);
}

export async function createEvent(accessToken: string, event: CalendarEvent, calendarId = "primary") {
  return calendarFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: "POST",
    body: JSON.stringify(event),
  });
}

export async function updateEvent(accessToken: string, eventId: string, event: Partial<CalendarEvent>, calendarId = "primary") {
  return calendarFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(event),
  });
}

export async function deleteEvent(accessToken: string, eventId: string, calendarId = "primary") {
  return calendarFetch(accessToken, `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    method: "DELETE",
  });
}

export function checkOverlap(
  events: Array<{ start: { dateTime: string }; end: { dateTime: string } }>,
  newStart: string,
  newEnd: string,
  maxSimultaneous = 1
): boolean {
  const s = new Date(newStart).getTime();
  const e = new Date(newEnd).getTime();
  const overlapping = events.filter(ev => {
    const es = new Date(ev.start.dateTime).getTime();
    const ee = new Date(ev.end.dateTime).getTime();
    return s < ee && e > es;
  });
  return overlapping.length >= maxSimultaneous;
}
