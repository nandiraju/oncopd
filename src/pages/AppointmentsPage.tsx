import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Video, Clock, XCircle, Bell, RefreshCw, Check } from "lucide-react";
import { seedPatients } from "@/lib/data-service";
import { useAppointments } from "@/lib/selectors";
import { useOncOPDStore } from "@/store/useOncOPDStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { PageHeader, FilterChip, StatCard } from "@/components/shared/common";
import { formatDate, initials, cn } from "@/lib/utils";

type View = "today" | "upcoming" | "teleconsult" | "missed" | "reportreview";

export function AppointmentsPage() {
  const [view, setView] = useState<View>("today");
  const [toast, setToast] = useState("");
  const appts = useAppointments();
  const setStatus = useOncOPDStore((s) => s.setApptStatus);

  const today = appts.filter((a) => a.isToday);
  const upcoming = appts.filter((a) => a.date > "2026-07-06");
  const missed = appts.filter((a) => a.status === "Missed");
  const tele = appts.filter((a) => a.type === "Teleconsultation");
  const reportReview = appts.filter((a) => a.type === "Report Review");

  const shown = useMemo(() => {
    switch (view) {
      case "upcoming": return upcoming;
      case "teleconsult": return tele;
      case "missed": return missed;
      case "reportreview": return reportReview;
      default: return today;
    }
  }, [view, today, upcoming, tele, missed, reportReview]);

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  return (
    <div>
      <PageHeader title="Appointments" subtitle="Today's schedule, follow-ups, teleconsults & reminders" />

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Today" value={today.length} icon={CalendarDays} accent="gold" onClick={() => setView("today")} active={view === "today"} />
        <StatCard label="Upcoming" value={upcoming.length} icon={Clock} accent="info" onClick={() => setView("upcoming")} active={view === "upcoming"} />
        <StatCard label="Teleconsults" value={tele.length} icon={Video} accent="success" onClick={() => setView("teleconsult")} active={view === "teleconsult"} />
        <StatCard label="Report reviews" value={reportReview.length} icon={CalendarDays} accent="warning" onClick={() => setView("reportreview")} active={view === "reportreview"} />
        <StatCard label="Missed" value={missed.length} icon={XCircle} accent="danger" onClick={() => setView("missed")} active={view === "missed"} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm capitalize">{view === "reportreview" ? "Report review visits" : `${view} appointments`} · {shown.length}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {shown.map((a) => {
            const p = seedPatients.find((x) => x.id === a.patientId);
            return (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/50 bg-background/30 p-3">
                <div className="w-16 shrink-0 text-center">
                  <div className="text-sm font-semibold text-gold">{a.time}</div>
                  <div className="text-[10px] text-muted-foreground">{formatDate(a.date)}</div>
                </div>
                <Avatar className="h-9 w-9">{p ? initials(p.name) : "?"}</Avatar>
                <div className="min-w-0 flex-1">
                  <Link to={`/patients/${a.patientId}`} className="truncate text-sm font-medium hover:text-gold">{a.patientName}</Link>
                  <div className="truncate text-xs text-muted-foreground">{a.type} · {a.reason} · {a.room}</div>
                </div>
                {a.mode === "Video" && <Badge variant="info"><Video className="h-3 w-3" /> Video</Badge>}
                <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                <div className="flex gap-1">
                  {a.status !== "Completed" && a.status !== "Missed" && (
                    <Button variant="ghost" size="sm" onClick={() => { setStatus(a.id, "Completed"); notify(`${a.patientName} marked completed`); }}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => { setStatus(a.id, "Rescheduled"); notify(`${a.patientName} flagged for reschedule`); }}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="sm" className="border-gold/30" onClick={() => notify(`OSakhi reminder sent to ${a.patientName}`)}>
                    <Bell className="h-3.5 w-3.5" /> Remind
                  </Button>
                </div>
              </div>
            );
          })}
          {!shown.length && <EmptyState icon={<CalendarDays className="h-6 w-6" />} title="No appointments in this view" />}
        </CardContent>
      </Card>

      {toast && (
        <div className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-gold/40 bg-popover px-4 py-2 text-sm shadow-lg animate-fade-in">
          <span className="text-gold">✓</span> {toast}
        </div>
      )}
    </div>
  );
}
