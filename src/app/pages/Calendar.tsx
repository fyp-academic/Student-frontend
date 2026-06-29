import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Calendar as BigCalendar, dateFnsLocalizer, View, Views,
} from "react-big-calendar";
import {
  format, parse, startOfWeek, getDay, startOfMonth, endOfMonth,
  endOfWeek, addDays, addMonths, subMonths,
} from "date-fns";
import { enUS } from "date-fns/locale";
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays,
} from "lucide-react";
import { Calendar as MiniCalendar } from "../components/ui/calendar";
import { EventModal, type CalendarOption, type EditableEvent } from "../components/calendar/EventModal";
import { calendarApi } from "../services/api";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../components/calendar/calendar-theme.css";

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { "en-US": enUS } });

interface FeedItem {
  id: string;
  event_id?: string;
  source: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start: string;
  end?: string | null;
  all_day: boolean;
  course_id: string | null;
  course_name: string;
  color: string;
  editable: boolean;
  recurring: boolean;
  link: { type: string; course_id?: string | null; activity_id?: string; session_id?: string };
}

interface RBCEvent {
  id: string; title: string; start: Date; end: Date; allDay: boolean; resource: FeedItem;
}

function rangeFor(view: View, date: Date): { start: Date; end: Date } {
  if (view === Views.WEEK) return { start: startOfWeek(date), end: endOfWeek(date) };
  if (view === Views.AGENDA) return { start: date, end: addDays(date, 30) };
  return { start: addDays(startOfMonth(date), -7), end: addDays(endOfMonth(date), 7) };
}

// Where a derived (read-only) item should take the student.
function deepLink(item: FeedItem): { path: string; state: Record<string, unknown> } | null {
  const state = { courseId: item.link.course_id, activityId: item.link.activity_id };
  switch (item.link.type) {
    case "quiz":       return { path: "/quizzes", state };
    case "assignment": return { path: "/assignments", state };
    case "lesson":
    case "page":
    case "deadline":   return { path: "/lessons", state };
    case "forum":
    case "discussion": return { path: "/course-forum", state };
    case "session":    return { path: "/sessions", state };
    default:           return null;
  }
}

export function Calendar() {
  const navigate = useNavigate();
  // Phones open in Agenda (a readable list); the Week time-grid is too cramped < 640px.
  const [view, setView] = useState<View>(
    () => (typeof window !== 'undefined' && window.innerWidth < 640 ? Views.AGENDA : Views.WEEK)
  );
  const [date, setDate] = useState<Date>(new Date());
  const [items, setItems] = useState<FeedItem[]>([]);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditableEvent | null>(null);

  useEffect(() => {
    calendarApi.calendars().then((r) => setCalendars(r.data.data ?? [])).catch(() => {});
  }, []);

  const load = useCallback(() => {
    const { start, end } = rangeFor(view, date);
    setLoading(true);
    calendarApi.feed({ start: start.toISOString(), end: end.toISOString() })
      .then((r) => setItems(r.data.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [view, date]);

  useEffect(() => { load(); }, [load]);

  const events: RBCEvent[] = useMemo(() => items
    .filter((it) => !hidden.has(it.course_id ?? "personal"))
    .map((it) => ({
      id: it.id,
      title: it.title,
      start: new Date(it.start),
      end: new Date(it.end ?? it.start),
      allDay: it.all_day,
      resource: it,
    })), [items, hidden]);

  const editableCalendars = useMemo(() => calendars.filter((c) => c.editable), [calendars]);

  const openNew = (start: Date, end: Date) => {
    setEditing({
      start, end, all_day: false,
      course_id: editableCalendars[0]?.id ?? "personal",
      recurrence_freq: "none",
    });
    setModalOpen(true);
  };

  const onSelectEvent = (e: RBCEvent) => {
    const it = e.resource;
    if (it.source === "event" && it.editable && it.event_id) {
      setEditing({
        event_id: it.event_id,
        title: it.title,
        description: it.description,
        location: it.location,
        all_day: it.all_day,
        start: new Date(it.start),
        end: it.end ? new Date(it.end) : null,
        course_id: it.course_id,
        recurrence_freq: it.recurring ? "weekly" : "none",
      });
      setModalOpen(true);
      return;
    }
    const link = deepLink(it);
    if (link) navigate(link.path, { state: link.state });
  };

  const toggleCal = (id: string) =>
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const navStep = (dir: -1 | 1) => {
    if (view === Views.WEEK) setDate((d) => addDays(d, dir * 7));
    else if (view === Views.AGENDA) setDate((d) => addDays(d, dir * 30));
    else setDate((d) => (dir === 1 ? addMonths(d, 1) : subMonths(d, 1)));
  };

  const label = view === Views.MONTH
    ? format(date, "MMMM yyyy")
    : view === Views.WEEK
      ? `${format(startOfWeek(date), "MMM d")} – ${format(endOfWeek(date), "MMM d, yyyy")}`
      : `${format(date, "MMM d")} – ${format(addDays(date, 30), "MMM d, yyyy")}`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <CalendarDays className="w-6 h-6 text-green-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Calendar</h1>
          <p className="text-xs text-gray-400">Your deadlines, live sessions, course events and personal reminders in one place.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Main calendar */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <button onClick={() => setDate(new Date())} className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50">Today</button>
              <div className="flex items-center rounded-lg border border-gray-300 bg-white">
                <button onClick={() => navStep(-1)} className="p-1.5 hover:bg-gray-50 rounded-l-lg"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => navStep(1)} className="p-1.5 hover:bg-gray-50 rounded-r-lg"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <span className="text-sm font-semibold text-gray-700 truncate">{label}</span>
              {loading && <span className="text-xs text-gray-400">updating…</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                {([Views.WEEK, Views.MONTH, Views.AGENDA] as View[]).map((v) => (
                  <button key={v} onClick={() => setView(v)}
                    className={`px-3 py-1.5 capitalize ${view === v ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                    {v}
                  </button>
                ))}
              </div>
              <button onClick={() => openNew(new Date(date.setHours(9, 0, 0, 0)), new Date(date.setHours(10, 0, 0, 0)))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
                <Plus className="w-4 h-4" /> Event
              </button>
            </div>
          </div>

          <div className="rbc-cal h-[68vh] min-h-[460px] sm:h-[680px]">
            <BigCalendar
              localizer={localizer}
              events={events}
              date={date}
              view={view}
              onNavigate={setDate}
              onView={setView}
              views={[Views.WEEK, Views.MONTH, Views.AGENDA]}
              selectable
              popup
              onSelectSlot={(slot) => openNew(slot.start as Date, slot.end as Date)}
              onSelectEvent={onSelectEvent}
              eventPropGetter={(e: RBCEvent) => ({
                className: e.resource.editable ? "" : "rbc-event-derived",
                style: { backgroundColor: e.resource.color, color: "#fff" },
              })}
              style={{ height: "100%" }}
            />
          </div>
        </div>

        {/* Right rail */}
        <div className="lg:w-72 flex-shrink-0 space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-2">
            <MiniCalendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className="w-full" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Calendars</h3>
            <div className="space-y-2">
              {calendars.map((c) => {
                const off = hidden.has(c.id);
                return (
                  <button key={c.id} onClick={() => toggleCal(c.id)}
                    className="flex items-center gap-2 w-full text-left text-sm text-gray-700 hover:bg-gray-50 rounded px-1 py-1">
                    <span className="w-4 h-4 rounded flex-shrink-0 border" style={{ backgroundColor: off ? "transparent" : c.color, borderColor: c.color }} />
                    <span className={off ? "line-through text-gray-400" : ""}>{c.name}</span>
                  </button>
                );
              })}
              {calendars.length === 0 && <p className="text-xs text-gray-400">No calendars yet.</p>}
            </div>
          </div>
        </div>
      </div>

      <EventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        calendars={editableCalendars.length ? editableCalendars : [{ id: "personal", name: "Personal", color: "#64748b", editable: true }]}
        initial={editing}
        onSaved={load}
      />
    </div>
  );
}

export default Calendar;
