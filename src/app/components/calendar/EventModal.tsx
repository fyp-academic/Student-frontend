import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../ui/dialog";
import { calendarApi } from "../../services/api";

export interface CalendarOption { id: string; name: string; color: string; editable: boolean }

export interface EditableEvent {
  event_id?: string;
  title?: string;
  description?: string | null;
  location?: string | null;
  all_day?: boolean;
  start: Date;
  end?: Date | null;
  course_id?: string | null;
  recurrence_freq?: string;
  recurrence_interval?: number;
  recurrence_until?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  calendars: CalendarOption[];
  initial: EditableEvent | null;
  onSaved: () => void;
}

const FREQ = [
  { v: "none", l: "Does not repeat" },
  { v: "daily", l: "Daily" },
  { v: "weekly", l: "Weekly" },
  { v: "monthly", l: "Monthly" },
  { v: "yearly", l: "Annually" },
];

const field = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500";
const labelCls = "block text-xs font-semibold text-gray-600 mb-1";

export function EventModal({ open, onClose, calendars, initial, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [fromTime, setFromTime] = useState("09:00");
  const [toTime, setToTime] = useState("10:00");
  const [allDay, setAllDay] = useState(false);
  const [freq, setFreq] = useState("none");
  const [until, setUntil] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [calendarId, setCalendarId] = useState("personal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    const s = initial.start;
    const e = initial.end ?? new Date(s.getTime() + 60 * 60 * 1000);
    setTitle(initial.title ?? "");
    setDate(format(s, "yyyy-MM-dd"));
    setFromTime(format(s, "HH:mm"));
    setToTime(format(e, "HH:mm"));
    setAllDay(initial.all_day ?? false);
    setFreq(initial.recurrence_freq ?? "none");
    setUntil(initial.recurrence_until ?? "");
    setLocation(initial.location ?? "");
    setDescription(initial.description ?? "");
    setCalendarId(initial.course_id ?? "personal");
    setError(null);
  }, [initial]);

  if (!initial) return null;
  const isEdit = !!initial.event_id;

  const submit = async () => {
    if (!title.trim()) { setError("Please enter a title."); return; }
    if (!date) { setError("Please pick a date."); return; }
    setSaving(true);
    setError(null);
    const startAt = allDay ? `${date}T00:00:00` : `${date}T${fromTime}:00`;
    const endAt = allDay ? null : `${date}T${toTime}:00`;
    const payload: Record<string, unknown> = {
      title: title.trim(),
      course_id: calendarId === "personal" ? null : calendarId,
      description: description || null,
      location: location || null,
      all_day: allDay,
      start_at: startAt,
      end_at: endAt,
      recurrence_freq: freq,
      recurrence_interval: 1,
      recurrence_until: freq !== "none" && until ? until : null,
    };
    try {
      if (isEdit) await calendarApi.update(initial.event_id!, payload);
      else await calendarApi.create(payload);
      onSaved();
      onClose();
    } catch (err) {
      const e = err as { response?: { data?: { error?: string; errors?: Record<string, string[]> } } };
      setError(e.response?.data?.error ?? Object.values(e.response?.data?.errors ?? {})[0]?.[0] ?? "Could not save the event.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!initial.event_id) return;
    setSaving(true);
    try {
      await calendarApi.remove(initial.event_id);
      onSaved();
      onClose();
    } catch {
      setError("Could not delete the event.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "New Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className={labelCls}>Title</label>
            <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title…" autoFocus />
          </div>

          <div>
            <label className={labelCls}>Date</label>
            <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded" />
            All day
          </label>

          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>From</label>
                <input type="time" className={field} value={fromTime} onChange={(e) => setFromTime(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>To</label>
                <input type="time" className={field} value={toTime} onChange={(e) => setToTime(e.target.value)} />
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Frequency</label>
            <select className={field} value={freq} onChange={(e) => setFreq(e.target.value)}>
              {FREQ.map((f) => <option key={f.v} value={f.v}>{f.l}</option>)}
            </select>
          </div>

          {freq !== "none" && (
            <div>
              <label className={labelCls}>Repeat until</label>
              <input type="date" className={field} value={until} onChange={(e) => setUntil(e.target.value)} />
            </div>
          )}

          <div>
            <label className={labelCls}>Location</label>
            <input className={field} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
          </div>

          <div>
            <label className={labelCls}>Calendar</label>
            <select className={field} value={calendarId} onChange={(e) => setCalendarId(e.target.value)}>
              {calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          {isEdit ? (
            <button onClick={remove} disabled={saving} className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          ) : <span />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</button>
            <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
