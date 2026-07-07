import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Dna,
  Pill,
  FlaskConical,
  CalendarDays,
  Inbox,
  Brain,
  StickyNote,
  MessageSquare,
  FileText,
  Activity,
  ClipboardList,
  AlertTriangle,
  Plus,
  Phone,
  ArrowUpRight,
} from "lucide-react";
import {
  usePatient,
  usePatientReports,
  usePatientTimeline,
  usePatientPrescriptions,
  usePatientMtb,
  useAllOrders,
  useMessages,
  useAppointments,
} from "@/lib/selectors";
import { useOncOPDStore } from "@/store/useOncOPDStore";
import { currentUser } from "@/lib/data-service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Avatar, Progress, Separator, EmptyState, Table, THead, TR, TH, TD, SortTH, useSort } from "@/components/ui/misc";
import { RiskBadge } from "@/components/shared/common";
import { AiChartReview } from "@/components/patients/AiChartReview";
import { ChatEMRPanel } from "@/components/chatemr/ChatEMRPanel";
import { formatDate, formatDateTime, relativeTime, daysUntil, initials, cn, PRIORITY_RANK } from "@/lib/utils";

const TABS = [
  ["overview", "Overview", Activity],
  ["timeline", "Timeline", ClipboardList],
  ["reports", "Reports", FileText],
  ["molecular", "Molecular Profile", Dna],
  ["treatment", "Treatment History", Activity],
  ["orders", "Orders", FlaskConical],
  ["prescriptions", "Prescriptions", Pill],
  ["appointments", "Appointments", CalendarDays],
  ["osakhi", "OSakhi Messages", Inbox],
  ["mtb", "MTB", Brain],
  ["notes", "Notes", StickyNote],
  ["chatemr", "ChatEMR", MessageSquare],
] as const;

export function PatientViewPage() {
  const { id = "" } = useParams();
  const [tab, setTab] = useState("overview");
  const patient = usePatient(id);
  const reports = usePatientReports(id);
  const timeline = usePatientTimeline(id);
  const prescriptions = usePatientPrescriptions(id);
  const mtbCases = usePatientMtb(id);
  const orders = useAllOrders().filter((o) => o.patientId === id);
  const messages = useMessages().filter((m) => m.patientId === id);
  const appts = useAppointments().filter((a) => a.patientId === id);

  const molecularSort = useSort(patient?.biomarkers ?? [], {
    name: (b) => b.name,
    result: (b) => b.status,
    actionable: (b) => (b.actionable ? 1 : 0),
  }, "name");

  const ordersSort = useSort(orders, {
    id: (o) => o.id,
    scenario: (o) => o.scenario,
    tests: (o) => o.tests.join(", "),
    priority: (o) => PRIORITY_RANK[o.priority] ?? 0,
    status: (o) => o.status,
    ordered: (o) => o.orderedDate,
  }, "ordered", "desc");

  const apptsSort = useSort(appts, {
    date: (a) => a.datetime,
    time: (a) => a.time,
    type: (a) => a.type,
    mode: (a) => a.mode,
    reason: (a) => a.reason,
    status: (a) => a.status,
  }, "date", "desc");

  if (!patient) {
    return <EmptyState title="Patient not found" hint="Return to the registry" />;
  }

  return (
    <div>
      <Link to="/patients" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Registry
      </Link>

      {/* Patient header */}
      <Card className="mb-4 overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-gold via-coral to-transparent" />
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <Avatar className="h-14 w-14 text-lg">{initials(patient.name)}</Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">{patient.name}</h1>
              <RiskBadge risk={patient.riskLevel} />
              {patient.flags.criticalFinding && <Badge variant="danger"><AlertTriangle className="h-3 w-3" /> Critical</Badge>}
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {patient.mrn} · {patient.age}y {patient.gender} · {patient.bloodGroup} · <Phone className="inline h-3 w-3" /> {patient.phone}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-4 text-sm">
            <HeaderStat label="Cancer" value={patient.cancerType} />
            <HeaderStat label="Stage" value={patient.stage} />
            <HeaderStat label="ECOG" value={String(patient.ecog)} />
            <HeaderStat label="Oncologist" value={patient.treatingOncologist} />
            <div className="flex gap-2">
              <Button variant="gold" size="sm" onClick={() => setTab("chatemr")}>
                <MessageSquare className="h-4 w-4" /> ChatEMR
              </Button>
              <Button variant="outline" size="sm" onClick={() => setTab("mtb")}>
                <Brain className="h-4 w-4" /> MTB
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          {TABS.map(([key, label, Icon]) => (
            <TabsTrigger key={key} value={key}>
              <span className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" /> {label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview">
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              <AiChartReview patientId={id} />
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard title="Diagnosis & Staging" icon={Activity}>
                  <KV k="Primary" v={patient.cancerType} />
                  <KV k="Stage" v={patient.stage} />
                  <KV k="Diagnosed" v={formatDate(patient.diagnosisDate)} />
                  <KV k="ECOG" v={String(patient.ecog)} />
                  <KV k="Risk" v={patient.riskLevel} />
                </InfoCard>
                <InfoCard title="Current Treatment" icon={Pill}>
                  <KV k="Regimen" v={patient.currentRegimen} />
                  <KV k="Therapy" v={patient.currentTreatment} />
                  <div className="pt-1">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Cycle progress</span>
                      <span>{patient.cyclesCompleted}/{patient.cyclesTotal}</span>
                    </div>
                    <Progress value={(patient.cyclesCompleted / patient.cyclesTotal) * 100} />
                  </div>
                  <KV k="Care plan" v={patient.carePlanStatus} />
                </InfoCard>
              </div>

              <InfoCard title="Biomarkers" icon={Dna}>
                <div className="flex flex-wrap gap-2">
                  {patient.biomarkers.map((b) => (
                    <div key={b.name} className={cn("rounded-lg border px-3 py-2", b.actionable ? "border-gold/30 bg-gold/5" : "border-border/60 bg-background/30")}>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        {b.name}
                        {b.actionable && <Badge variant="gold" className="text-[9px]">actionable</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{b.status}</div>
                    </div>
                  ))}
                </div>
              </InfoCard>
            </div>

            <div className="space-y-4">
              <Card className="ai-panel">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">What changed since last visit?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {timeline.slice(0, 3).map((e) => (
                    <div key={e.id} className="border-l-2 border-gold/40 pl-3">
                      <div className="text-xs text-muted-foreground">{formatDate(e.date)}</div>
                      <div className="font-medium">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{e.detail}</div>
                    </div>
                  ))}
                  {patient.flags.reportsPending && <Badge variant="warning">New report awaiting review</Badge>}
                </CardContent>
              </Card>

              <InfoCard title="Recent Alerts" icon={AlertTriangle}>
                {alertsFor(patient).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md bg-background/30 px-2 py-1.5 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" /> {a}
                  </div>
                ))}
              </InfoCard>

              <InfoCard title="Pending Orders & Actions" icon={ClipboardList}>
                {patient.pendingActions.length ? patient.pendingActions.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm"><span className="text-gold">→</span> {a}</div>
                )) : <p className="text-sm text-muted-foreground">No pending actions.</p>}
                {orders.slice(0, 2).map((o) => (
                  <div key={o.id} className="mt-1 flex items-center justify-between rounded-md bg-background/30 px-2 py-1.5 text-xs">
                    <span>{o.category}</span>
                    <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                  </div>
                ))}
              </InfoCard>
            </div>
          </div>
        </TabsContent>

        {/* TIMELINE */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader><CardTitle className="text-sm">Patient Timeline · {timeline.length} events</CardTitle></CardHeader>
            <CardContent>
              <div className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
                {timeline.map((e) => (
                  <div key={e.id} className="relative flex gap-4 pl-6">
                    <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-gold bg-background" />
                    <div className="flex-1 rounded-lg border border-border/50 bg-background/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{e.title}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{e.detail}</p>
                      <Badge variant="muted" className="mt-1.5 text-[10px] capitalize">{e.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS */}
        <TabsContent value="reports">
          <div className="grid gap-3 md:grid-cols-2">
            {reports.map((r) => (
              <Link key={r.id} to={`/reports/${r.id}`}>
                <Card className="h-full transition-colors hover:border-gold/40">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.type}</span>
                      <Badge variant={r.critical ? "danger" : statusVariant(r.status)}>{r.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{r.lab} · {formatDate(r.reportedDate)}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {r.keyBiomarkers.slice(0, 3).map((b) => (
                        <Badge key={b.name} variant="secondary" className="text-[10px]">{b.name}: {b.finding}</Badge>
                      ))}
                    </div>
                    {r.hasTrialMatch && <Badge variant="gold" className="mt-2">Trial match signal</Badge>}
                  </CardContent>
                </Card>
              </Link>
            ))}
            {!reports.length && <EmptyState title="No reports on file" />}
          </div>
        </TabsContent>

        {/* MOLECULAR */}
        <TabsContent value="molecular">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Dna className="h-4 w-4 text-gold" /> Molecular Profile</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <THead>
                  <TR>
                    <SortTH label="Biomarker" sortId="name" sortKey={molecularSort.sortKey} sortDir={molecularSort.sortDir} onSort={molecularSort.toggle} />
                    <SortTH label="Result" sortId="result" sortKey={molecularSort.sortKey} sortDir={molecularSort.sortDir} onSort={molecularSort.toggle} />
                    <SortTH label="Actionable" sortId="actionable" sortKey={molecularSort.sortKey} sortDir={molecularSort.sortDir} onSort={molecularSort.toggle} />
                    <TH>Implication</TH>
                  </TR>
                </THead>
                <tbody>
                  {molecularSort.sorted.map((b) => (
                    <TR key={b.name}>
                      <TD><span className="font-medium">{b.name}</span></TD>
                      <TD>{b.status}</TD>
                      <TD>{b.actionable ? <Badge variant="gold">Yes</Badge> : <Badge variant="muted">No</Badge>}</TD>
                      <TD><span className="text-xs text-muted-foreground">{b.actionable ? "Matched targeted therapy may apply" : "Monitor; no direct target"}</span></TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TREATMENT */}
        <TabsContent value="treatment">
          <Card>
            <CardHeader><CardTitle className="text-sm">Treatment History</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="rounded-lg border border-border/50 bg-background/30 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{rx.regimen}</span>
                    <Badge variant={statusVariant(rx.status)}>{rx.status}</Badge>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground md:grid-cols-4">
                    <span>Intent: {rx.intent}</span>
                    <span>Cycle: {rx.cyclesDone}/{rx.cyclesPlanned}</span>
                    <span>Started: {formatDate(rx.startDate)}</span>
                    <span>Next: {formatDate(rx.nextCycleDate)}</span>
                  </div>
                </div>
              ))}
              {timeline.filter((e) => ["treatment", "cycle", "response"].includes(e.type)).map((e) => (
                <div key={e.id} className="flex items-center gap-3 text-sm">
                  <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                  <span>{e.title} — {e.detail}</span>
                </div>
              ))}
              {!prescriptions.length && <EmptyState title="No treatment history" />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ORDERS */}
        <TabsContent value="orders">
          <div className="mb-3 flex justify-end">
            <Link to="/orders"><Button variant="gold" size="sm"><Plus className="h-4 w-4" /> New Order</Button></Link>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <THead><TR>
                <SortTH label="Order" sortId="id" sortKey={ordersSort.sortKey} sortDir={ordersSort.sortDir} onSort={ordersSort.toggle} />
                <SortTH label="Scenario" sortId="scenario" sortKey={ordersSort.sortKey} sortDir={ordersSort.sortDir} onSort={ordersSort.toggle} />
                <SortTH label="Tests" sortId="tests" sortKey={ordersSort.sortKey} sortDir={ordersSort.sortDir} onSort={ordersSort.toggle} />
                <SortTH label="Priority" sortId="priority" sortKey={ordersSort.sortKey} sortDir={ordersSort.sortDir} onSort={ordersSort.toggle} />
                <SortTH label="Status" sortId="status" sortKey={ordersSort.sortKey} sortDir={ordersSort.sortDir} onSort={ordersSort.toggle} />
                <SortTH label="Ordered" sortId="ordered" sortKey={ordersSort.sortKey} sortDir={ordersSort.sortDir} onSort={ordersSort.toggle} />
              </TR></THead>
              <tbody>
                {ordersSort.sorted.map((o) => (
                  <TR key={o.id}>
                    <TD><span className="text-xs font-mono">{o.id}</span></TD>
                    <TD>{o.scenario}</TD>
                    <TD><span className="text-xs text-muted-foreground">{o.tests.join(", ")}</span></TD>
                    <TD><Badge variant={o.priority === "STAT" ? "danger" : o.priority === "Urgent" ? "warning" : "muted"}>{o.priority}</Badge></TD>
                    <TD><Badge variant={statusVariant(o.status)}>{o.status}</Badge></TD>
                    <TD><span className="text-xs">{formatDate(o.orderedDate)}</span></TD>
                  </TR>
                ))}
              </tbody>
            </Table>
            {!orders.length && <EmptyState title="No orders" />}
          </CardContent></Card>
        </TabsContent>

        {/* PRESCRIPTIONS */}
        <TabsContent value="prescriptions">
          <PrescriptionsTab prescriptions={prescriptions} />
        </TabsContent>

        {/* APPOINTMENTS */}
        <TabsContent value="appointments">
          <Card><CardContent className="p-0">
            <Table>
              <THead><TR>
                <SortTH label="Date" sortId="date" sortKey={apptsSort.sortKey} sortDir={apptsSort.sortDir} onSort={apptsSort.toggle} />
                <SortTH label="Time" sortId="time" sortKey={apptsSort.sortKey} sortDir={apptsSort.sortDir} onSort={apptsSort.toggle} />
                <SortTH label="Type" sortId="type" sortKey={apptsSort.sortKey} sortDir={apptsSort.sortDir} onSort={apptsSort.toggle} />
                <SortTH label="Mode" sortId="mode" sortKey={apptsSort.sortKey} sortDir={apptsSort.sortDir} onSort={apptsSort.toggle} />
                <SortTH label="Reason" sortId="reason" sortKey={apptsSort.sortKey} sortDir={apptsSort.sortDir} onSort={apptsSort.toggle} />
                <SortTH label="Status" sortId="status" sortKey={apptsSort.sortKey} sortDir={apptsSort.sortDir} onSort={apptsSort.toggle} />
              </TR></THead>
              <tbody>
                {apptsSort.sorted.map((a) => (
                  <TR key={a.id}>
                    <TD>{formatDate(a.date)}</TD>
                    <TD>{a.time}</TD>
                    <TD>{a.type}</TD>
                    <TD><Badge variant="muted">{a.mode}</Badge></TD>
                    <TD><span className="text-xs text-muted-foreground">{a.reason}</span></TD>
                    <TD><Badge variant={statusVariant(a.status)}>{a.status}</Badge></TD>
                  </TR>
                ))}
              </tbody>
            </Table>
            {!appts.length && <EmptyState title="No appointments" />}
          </CardContent></Card>
        </TabsContent>

        {/* OSAKHI */}
        <TabsContent value="osakhi">
          <div className="space-y-2">
            {messages.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-start gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={m.urgent ? "danger" : "muted"}>{m.category}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(m.datetime)}</span>
                    </div>
                    <p className="mt-1 text-sm">{m.text}</p>
                    {m.reply && <p className="mt-1 rounded bg-gold/10 px-2 py-1 text-xs text-gold">Reply: {m.reply}</p>}
                  </div>
                  <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                </CardContent>
              </Card>
            ))}
            {!messages.length && <EmptyState title="No OSakhi messages" />}
            <Link to="/osakhi" className="inline-flex items-center gap-1 text-sm text-gold hover:underline">Open OSakhi inbox <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </div>
        </TabsContent>

        {/* MTB */}
        <TabsContent value="mtb">
          {mtbCases.length ? (
            <div className="space-y-2">
              {mtbCases.map((m) => (
                <Link key={m.id} to={`/mtb/${m.id}`}>
                  <Card className="transition-colors hover:border-gold/40">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <div className="font-medium">{m.cancerType} · Stage {m.stage}</div>
                        <div className="text-xs text-muted-foreground">{m.molecularFindings.length} molecular findings · panel of {m.panel.length}</div>
                      </div>
                      <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No MTB case yet" hint="Create one from the Molecular Tumor Board screen" />
          )}
        </TabsContent>

        {/* NOTES */}
        <TabsContent value="notes">
          <NotesTab patientId={id} />
        </TabsContent>

        {/* CHATEMR */}
        <TabsContent value="chatemr">
          <Card><CardContent className="p-4"><ChatEMRPanel patientId={id} /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function InfoCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-gold" /> {title}</CardTitle></CardHeader>
      <CardContent className="space-y-1.5">{children}</CardContent>
    </Card>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

function alertsFor(p: ReturnType<typeof usePatient>) {
  if (!p) return [];
  const a: string[] = [];
  if (p.flags.criticalFinding) a.push("Critical finding flagged on latest report");
  if (p.flags.reportsPending) a.push("Report pending your review");
  if (p.flags.recurrence) a.push("Possible recurrence — restaging advised");
  if (p.flags.followUpDue) a.push("Follow-up due");
  if (p.ecog >= 2) a.push(`Declining performance status (ECOG ${p.ecog})`);
  if (!a.length) a.push("No active alerts");
  return a;
}

function PrescriptionsTab({ prescriptions }: { prescriptions: ReturnType<typeof usePatientPrescriptions> }) {
  const toggle = useOncOPDStore((s) => s.toggleRxReminder);
  const overlays = useOncOPDStore((s) => s.rxReminderOverlays);
  if (!prescriptions.length) return <EmptyState title="No prescriptions / care plans" />;
  return (
    <div className="space-y-3">
      {prescriptions.map((rx) => {
        const reminders = overlays[rx.id] ?? rx.osakhiReminders;
        return (
          <Card key={rx.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">{rx.regimen}</CardTitle>
              <Badge variant={statusVariant(rx.status)}>{rx.status}</Badge>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 text-sm">
                <KV k="Intent" v={rx.intent} />
                <KV k="Cycle length" v={rx.cycleLength} />
                <KV k="Cycles" v={`${rx.cyclesDone}/${rx.cyclesPlanned}`} />
                <KV k="Next cycle" v={formatDate(rx.nextCycleDate)} />
                <KV k="Imaging follow-up" v={rx.imagingFollowUp} />
              </div>
              <div className="space-y-2">
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Supportive care</div>
                  <div className="flex flex-wrap gap-1">{rx.supportiveCare.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}</div>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">Monitoring labs</div>
                  <div className="flex flex-wrap gap-1">{rx.monitoringLabs.map((s) => <Badge key={s} variant="muted">{s}</Badge>)}</div>
                </div>
              </div>
              <div className="md:col-span-2 rounded-lg border border-border/50 bg-background/30 p-3 text-sm">
                <div className="text-xs font-medium text-muted-foreground">Patient instructions</div>
                <p className="mt-0.5">{rx.patientInstructions}</p>
              </div>
              <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-gold/20 bg-gold/5 px-3 py-2">
                <span className="text-sm">Send reminders through OSakhi</span>
                <button
                  onClick={() => toggle(rx.id, !reminders)}
                  className={cn("relative h-5 w-9 rounded-full transition-colors", reminders ? "bg-gold" : "bg-secondary")}
                >
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", reminders ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function NotesTab({ patientId }: { patientId: string }) {
  // Select the stable array; filter in render to avoid returning a fresh array from the selector.
  const allNotes = useOncOPDStore((s) => s.chartNotes);
  const notes = allNotes.filter((n) => n.patientId === patientId);
  const addNote = useOncOPDStore((s) => s.addChartNote);
  const [text, setText] = useState("");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Add chart note</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Progress note, plan, observation…" rows={5} />
          <Button
            variant="gold"
            size="sm"
            disabled={!text.trim()}
            onClick={() => {
              addNote({ id: `note-${Date.now()}`, patientId, text, author: currentUser.name, timestamp: new Date().toISOString(), source: "Manual" });
              setText("");
            }}
          >
            <Plus className="h-4 w-4" /> Save note
          </Button>
        </CardContent>
      </Card>
      <div className="space-y-2">
        {notes.map((n) => (
          <Card key={n.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{n.author} · {n.source}</span>
                <span>{relativeTime(n.timestamp)}</span>
              </div>
              <p className="mt-1 text-sm">{n.text}</p>
            </CardContent>
          </Card>
        ))}
        {!notes.length && <EmptyState icon={<StickyNote className="h-6 w-6" />} title="No notes yet" hint="Notes you save persist locally" />}
      </div>
    </div>
  );
}
