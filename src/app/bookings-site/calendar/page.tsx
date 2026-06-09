import { Calendar } from "@/components/ui/calendar";

const highlightedDates = [
  new Date("2026-07-12"),
  new Date("2026-08-08"),
  new Date("2026-09-19"),
];

export default function BookingCalendarPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Availability Calendar</h1>
        <p className="text-muted-foreground">Highlighted dates represent currently available booking windows.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4 md:p-6">
        <Calendar mode="single" modifiers={{ highlighted: highlightedDates }} />
      </div>
    </div>
  );
}

