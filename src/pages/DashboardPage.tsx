import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  AlertTriangle,
  FileWarning,
  Clock,
  Brain,
  Inbox,
  Users2,
  Sparkles,
  Activity,
  ArrowUpRight,
  Stethoscope,
} from "lucide-react";
import { seedPatients, currentUser } from "@/lib/data-service";
import { useAllPeerReviews, useAppointments, useMessages } from "@/lib/selectors";
import { seedMtb } from "@/lib/data-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, riskVariant, statusVariant } from "@/components/ui/badge";
import { Table, THead, TR, TD, EmptyState, SortTH, useSort } from "@/components/ui/misc";
import { StatCard, PatientCell, PageHeader, FilterChip, RiskBadge } from "@/components/shared/common";
import { formatDate, daysUntil, cn, RISK_RANK } from "@/lib/utils";
import type { Patient } from "@/lib/types";

const flagCount = (p: Patient) =>
  Object.values(p.flags).filter(Boolean).length;

type Filter = "today" | "urgent" | "reports" | "followup" | "newdx" | "recurrence" | "mtb";

export function DashboardPage() {
  const [filter, setFilter] = useState<Filter | null>(null);
  const appts = useAppointments();
  const messages = useMessages();
  const peerReviews = useAllPeerReviews();

  const todayAppts = appts.filter((a) => a.isToday && a.status !== "Cancelled");
  const waiting = todayAppts.filter((a) => a.status === "Checked In" || a.status === "In Progress");
  const reportsPending = seedPatients.filter((p) => p.flags.reportsPending);
  const critical = seedPatients.filter((p) => p.flags.criticalFinding);
  const overdue = seedPatients.filter((p) => p.flags.overdueFollowUp);
  const mtbPending = seedMtb.filter((m) => m.status === "Pending" || m.status === "Scheduled");
  const unreadMsgs = messages.filter((m) => m.status === "Unread");
  const openPeer = peerReviews.filter((p) => p.status !== "Completed");

  const filtered = useMemo(() => {
    const byId = new Set(todayAppts.map((a) => a.patientId));
    switch (filter) {
      case "today":
        return seedPatients.filter((p) => byId.has(p.id));
      case "urgent":
        return seedPatients.filter((p) => p.riskLevel === "Critical" || p.riskLevel === "High" || p.flags.criticalFinding);
      case "reports":
        return reportsPending;
      case "followup":
        return seedPatients.filter((p) => p.flags.followUpDue || p.flags.overdueFollowUp);
      case "newdx":
        return seedPatients.filter((p) => p.flags.newlyDiagnosed);
      case "recurrence":
        return seedPatients.filter((p) => p.flags.recurrence);
      case "mtb":
        return seedPatients.filter((p) => p.flags.mtbNeeded);
      default:
        return seedPatients.filter((p) => byId.has(p.id) || p.flags.criticalFinding).slice(0, 40);
    }
  }, [filter, todayAppts, reportsPending]);

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "today", label: "Today", count: new Set(todayAppts.map((a) => a.patientId)).size },
    { key: "urgent", label: "Urgent", count: seedPatients.filter((p) => p.riskLevel === "Critical" || p.riskLevel === "High").length },
    { key: "reports", label: "Reports Pending", count: reportsPending.length },
    { key: "followup", label: "Follow-up Due", count: seedPatients.filter((p) => p.flags.followUpDue || p.flags.overdueFollowUp).length },
    { key: "newdx", label: "New Diagnosis", count: seedPatients.filter((p) => p.flags.newlyDiagnosed).length },
    { key: "recurrence", label: "Recurrence", count: seedPatients.filter((p) => p.flags.recurrence).length },
    { key: "mtb", label: "MTB Needed", count: seedPatients.filter((p) => p.flags.mtbNeeded).length },
  ];

  const worklistAccessors: Record<string, (p: Patient) => string | number | null> = {
    patient: (p) => p.name,
    cancer: (p) => `${p.cancerType} ${p.stage}`,
    risk: (p) => RISK_RANK[p.riskLevel],
    flags: (p) => flagCount(p),
    next: (p) => p.nextAppointment,
  };
  const { sorted: sortedWorklist, sortKey, sortDir, toggle } = useSort(filtered, worklistAccessors, "risk", "desc");
  const th = (sortId: string) => ({ sortId, sortKey, sortDir, onSort: toggle });

  const doctorFirst = currentUser.name.replace("Dr. ", "").split(" ")[0];

  return (
    <div>
      {/* Welcome hero */}
      <div className="mb-6 overflow-hidden rounded-2xl coral-panel card-shadow">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h1 className="text-2xl font-bold tracking-tight text-coral">Welcome back, Dr. {doctorFirst}!</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              You have <span className="font-semibold text-foreground">{todayAppts.length}</span> appointments and{" "}
              <span className="font-semibold text-foreground">{reportsPending.length}</span> reports to review today. Keep the momentum going.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="gold" className="gap-1.5 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5" /> AI worklist prioritized
            </Badge>
            <span className="hidden text-sm text-muted-foreground sm:inline">Monday, 06 July 2026</span>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        <StatCard label="Today's appointments" value={todayAppts.length} icon={CalendarClock} accent="gold" onClick={() => setFilter("today")} active={filter === "today"} />
        <StatCard label="Patients waiting" value={waiting.length} icon={Users2} accent="info" />
        <StatCard label="Reports pending" value={reportsPending.length} icon={FileWarning} accent="warning" onClick={() => setFilter("reports")} active={filter === "reports"} />
        <StatCard label="Critical findings" value={critical.length} icon={AlertTriangle} accent="danger" onClick={() => setFilter("urgent")} active={filter === "urgent"} />
        <StatCard label="Overdue follow-ups" value={overdue.length} icon={Clock} accent="warning" onClick={() => setFilter("followup")} active={filter === "followup"} />
        <StatCard label="MTB pending" value={mtbPending.length} icon={Brain} accent="gold" onClick={() => setFilter("mtb")} active={filter === "mtb"} />
        <StatCard label="OSakhi unread" value={unreadMsgs.length} icon={Inbox} accent="info" />
        <StatCard label="Peer reviews" value={openPeer.length} icon={Users2} accent="success" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Worklist */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-gold" /> Daily OPD Worklist
            </CardTitle>
            <span className="text-xs text-muted-foreground">{filtered.length} patients</span>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <FilterChip label="All" active={filter === null} onClick={() => setFilter(null)} />
              {filters.map((f) => (
                <FilterChip key={f.key} label={f.label} count={f.count} active={filter === f.key} onClick={() => setFilter(f.key)} />
              ))}
            </div>
            <div className="max-h-[560px] overflow-y-auto rounded-lg border border-border/60">
              <Table>
                <THead>
                  <TR>
                    <SortTH label="Patient" {...th("patient")} />
                    <SortTH label="Cancer / Stage" {...th("cancer")} />
                    <SortTH label="Risk" {...th("risk")} />
                    <SortTH label="Flags" {...th("flags")} />
                    <SortTH label="Next visit" {...th("next")} />
                  </TR>
                </THead>
                <tbody>
                  {sortedWorklist.map((p) => (
                    <TR key={p.id}>
                      <TD>
                        <PatientCell patient={p} subtitle={`${p.mrn} · ${p.age}y ${p.gender}`} />
                      </TD>
                      <TD>
                        <div className="text-sm">{p.cancerType}</div>
                        <div className="text-xs text-muted-foreground">Stage {p.stage} · ECOG {p.ecog}</div>
                      </TD>
                      <TD>
                        <RiskBadge risk={p.riskLevel} />
                      </TD>
                      <TD>
                        <div className="flex flex-wrap gap-1">
                          {p.flags.criticalFinding && <Badge variant="danger">Critical</Badge>}
                          {p.flags.reportsPending && <Badge variant="warning">Report</Badge>}
                          {p.flags.newlyDiagnosed && <Badge variant="info">New Dx</Badge>}
                          {p.flags.recurrence && <Badge variant="danger">Recurrence</Badge>}
                          {p.flags.mtbNeeded && <Badge variant="gold">MTB</Badge>}
                          {p.flags.followUpDue && <Badge variant="warning">Follow-up</Badge>}
                        </div>
                      </TD>
                      <TD>
                        <NextVisit date={p.nextAppointment} />
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
              {!filtered.length && <EmptyState title="No patients match this filter" />}
            </div>
          </CardContent>
        </Card>

        {/* Right rail */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarClock className="h-4 w-4 text-gold" /> Next up today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayAppts.slice(0, 6).map((a) => {
                const p = seedPatients.find((x) => x.id === a.patientId)!;
                return (
                  <Link
                    key={a.id}
                    to={`/patients/${a.patientId}`}
                    className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/30 p-2.5 transition-colors hover:border-gold/30"
                  >
                    <div className="w-12 shrink-0 text-center">
                      <div className="text-sm font-semibold text-gold">{a.time}</div>
                      <div className="text-[10px] text-muted-foreground">{a.durationMin}m</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p?.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{a.type} · {a.room}</div>
                    </div>
                    <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                  </Link>
                );
              })}
              {!todayAppts.length && <EmptyState title="No appointments today" />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-red-400" /> Critical findings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {critical.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  to={`/patients/${p.id}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2.5 transition-colors hover:border-red-500/40"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.cancerType} · {p.reportStatus}</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-red-400" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-sky-400" /> OSakhi distress alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {messages.filter((m) => m.urgent).slice(0, 4).map((m) => (
                <Link
                  key={m.id}
                  to="/osakhi"
                  className="block rounded-lg border border-border/50 bg-background/30 p-2.5 transition-colors hover:border-gold/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{m.patientName}</span>
                    <Badge variant="danger">{m.category}</Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{m.text}</p>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NextVisit({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-muted-foreground">—</span>;
  const d = daysUntil(date);
  return (
    <div>
      <div className="text-sm">{formatDate(date)}</div>
      <div className={cn("text-xs", d != null && d <= 1 ? "text-gold" : "text-muted-foreground")}>
        {d === 0 ? "Today" : d === 1 ? "Tomorrow" : d != null && d > 0 ? `in ${d}d` : "overdue"}
      </div>
    </div>
  );
}
