// ===============================
// Off The Record — simple site JS
// ===============================

// 1) Set your ticket link here (Posh/Dice/Eventbrite/etc.)
const TICKETS_URL = "https://example.com/your-ticket-link";

// 2) Edit your events here
// Use ISO date strings so countdown works: YYYY-MM-DDTHH:mm:ss (local time)
const EVENTS = [
  {
    title: "OTR: The No-Phone Session",
    dateTime: "2026-03-06T21:30:00",
    venue: "Location Revealed Day-Of",
    city: "New York",
    theme: "Cocktails + House",
    tickets: TICKETS_URL,
    status: "Limited"
  },
  {
    title: "OTR: Midnight Social",
    dateTime: "2026-03-20T22:00:00",
    venue: "Lower Manhattan",
    city: "New York",
    theme: "Disco / Edits",
    tickets: TICKETS_URL,
    status: "Waitlist"
  },
  {
    title: "OTR: After Hours",
    dateTime: "2026-04-03T23:00:00",
    venue: "Brooklyn",
    city: "New York",
    theme: "Dark Grooves",
    tickets: TICKETS_URL,
    status: "On Sale"
  }
];

const $ = (sel) => document.querySelector(sel);

function formatDate(dt) {
  const d = new Date(dt);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(dt) {
  const d = new Date(dt);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function daysUntil(dt) {
  const now = new Date();
  const target = new Date(dt);
  const ms = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function getUpcomingEvents() {
  const now = new Date().getTime();
  return EVENTS
    .slice()
    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
    .filter((e) => new Date(e.dateTime).getTime() >= now);
}

function renderCityFilter(events) {
  const cities = Array.from(new Set(events.map((e) => e.city))).sort();
  const select = $("#cityFilter");
  if (!select) return;

  for (const c of cities) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  }
}

function eventCard(event) {
  const el = document.createElement("article");
  el.className = "event-card";

  const top = document.createElement("div");
  top.className = "event-top";

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = (event.status || "On Sale").toUpperCase();

  const date = document.createElement("span");
  date.className = "event-date";
  date.textContent = `${formatDate(event.dateTime)} • ${formatTime(event.dateTime)}`;

  top.appendChild(badge);
  top.appendChild(date);

  const title = document.createElement("div");
  title.className = "event-title";
  title.textContent = event.title;

  const meta = document.createElement("div");
  meta.className = "event-meta";
  meta.textContent = `${event.venue} • ${event.city} • ${event.theme}`;

  const actions = document.createElement("div");
  actions.className = "event-actions";

  const t1 = document.createElement("span");
  t1.className = "tag";
  t1.textContent = "Phone-free";

  const t2 = document.createElement("a");
  t2.className = "btn btn-small btn-primary";
  t2.href = event.tickets || TICKETS_URL;
  t2.target = "_blank";
  t2.rel = "noopener noreferrer";
  t2.textContent = "Tickets";

  const t3 = document.createElement("button");
  t3.className = "btn btn-small btn-ghost";
  t3.type = "button";
  t3.textContent = "Add to calendar";
  t3.addEventListener("click", () => downloadICS(event));

  actions.appendChild(t1);
  actions.appendChild(t2);
  actions.appendChild(t3);

  el.appendChild(top);
  el.appendChild(title);
  el.appendChild(meta);
  el.appendChild(actions);

  return el;
}

function renderEvents(events) {
  const grid = $("#eventsGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!events.length) {
    const empty = document.createElement("div");
    empty.className = "note";
    empty.textContent = "No events match your filters yet. Check back soon.";
    grid.appendChild(empty);
    return;
  }

  events.forEach((e) => grid.appendChild(eventCard(e)));
}

function wireNav() {
  const btn = $("#navToggle");
  const links = $("#navLinks");
  if (!btn || !links) return;

  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

function wireTickets() {
  const a = $("#ticketsLink");
  if (a) a.href = TICKETS_URL;

  const copyBtn = $("#copyLinkBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(TICKETS_URL);
        copyBtn.textContent = "Copied!";
        setTimeout(() => (copyBtn.textContent = "Copy ticket link"), 1200);
      } catch {
        alert("Copy failed — paste this manually: " + TICKETS_URL);
      }
    });
  }
}

function wireSubscribe() {
  const form = $("#subscribeForm");
  const msg = $("#subscribeMsg");
  if (!form || !msg) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#emailInput").value.trim().toLowerCase();
    if (!email) return;

    const key = "otr_subscribers";
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    if (!list.includes(email)) list.push(email);
    localStorage.setItem(key, JSON.stringify(list));

    msg.textContent = "You’re in. Watch for drops (and keep it off the record).";
    form.reset();
  });
}

function setNextEventHero() {
  const titleEl = $("#nextEventTitle");
  const dateEl = $("#nextEventDate");
  const venueEl = $("#nextEventVenue");
  const cityEl = $("#nextEventCity");
  const daysEl = $("#countdownDays");

  if (titleEl) titleEl.textContent = "Next event coming soon";
  if (dateEl) dateEl.textContent = "";
  if (venueEl) venueEl.textContent = "";
  if (cityEl) cityEl.textContent = "";
  if (daysEl) daysEl.textContent = "Next event coming soon";
}

function wireFilters(allUpcoming) {
  const search = $("#searchInput");
  const city = $("#cityFilter");
  if (!search || !city) return;

  const apply = () => {
    const q = (search.value || "").trim().toLowerCase();
    const c = city.value;

    const filtered = allUpcoming.filter((e) => {
      const hay = `${e.title} ${e.venue} ${e.city} ${e.theme} ${e.status}`.toLowerCase();
      const okQuery = !q || hay.includes(q);
      const okCity = c === "all" || e.city === c;
      return okQuery && okCity;
    });

    renderEvents(filtered);
  };

  search.addEventListener("input", apply);
  city.addEventListener("change", apply);
  apply();
}

// Simple ICS generator (imports into Apple/Google/Outlook)
function downloadICS(event) {
  const start = new Date(event.dateTime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hours

  const toICS = (d) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Off The Record//OTR Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${cryptoRandomId()}@offtherecord
DTSTAMP:${toICS(new Date())}
DTSTART:${toICS(start)}
DTEND:${toICS(end)}
SUMMARY:${escapeICS(event.title)}
LOCATION:${escapeICS(`${event.venue}, ${event.city}`)}
DESCRIPTION:${escapeICS(`Phone-free event. Tickets: ${event.tickets || TICKETS_URL}`)}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^\w]+/g, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function escapeICS(str) {
  return String(str || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function cryptoRandomId() {
  try {
    const arr = new Uint32Array(4);
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map(n => n.toString(16)).join("");
  } catch {
    return String(Math.random()).slice(2);
  }
}

function init() {
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  wireNav();
  wireTickets();
  wireSubscribe();

  setNextEventHero();
}

document.addEventListener("DOMContentLoaded", init);
/* Subtle luxury pulse for primary buttons */
.btn-primary {
  animation: otrPulse 3.8s ease-in-out infinite;
}

@keyframes otrPulse {
  0%, 100% { filter: brightness(1); transform: translateY(0); }
  50% { filter: brightness(1.08); transform: translateY(-1px); }
}

