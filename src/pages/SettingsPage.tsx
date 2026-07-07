import { useState } from "react";
import { Settings, RotateCcw, Database, ShieldAlert, User, Building2, Info } from "lucide-react";
import { currentUser, getClinic, clinics, oncologists, seedPatients } from "@/lib/data-service";
import { useOncOPDStore } from "@/store/useOncOPDStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/common";

export function SettingsPage() {
  const reset = useOncOPDStore((s) => s.resetDemo);
  const store = useOncOPDStore();
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const clinic = getClinic(currentUser.clinicId);

  const counts = {
    "Created orders": store.createdOrders.length,
    "Peer reviews": store.createdPeerReviews.length,
    "Chart notes": store.chartNotes.length,
    "ChatEMR threads": Object.keys(store.chatHistory).length,
    "MTB briefs": Object.keys(store.mtbBriefs).length,
    "OSakhi replies": Object.values(store.msgOverlays).filter((o) => o.reply).length,
  };

  const doReset = () => {
    reset();
    setConfirm(false);
    setDone(true);
    setTimeout(() => {
      localStorage.removeItem("oncopd-demo-v1");
      window.location.reload();
    }, 900);
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Demo configuration & local data" />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-gold" /> Current user</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <Row k="Name" v={currentUser.name} />
            <Row k="Subspecialty" v={currentUser.subspecialty} />
            <Row k="Experience" v={`${currentUser.experienceYears} years`} />
            <Row k="Email" v={currentUser.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-gold" /> Facility</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <Row k="Clinic" v={clinic?.name ?? "—"} />
            <Row k="City" v={clinic?.city ?? "—"} />
            <Row k="Accreditation" v={clinic?.accreditation ?? "—"} />
            <Row k="Network" v={`${clinics.length} clinics · ${oncologists.length} oncologists`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Database className="h-4 w-4 text-gold" /> Workspace data</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              {seedPatients.length} patients in your registry. The items below are the records you've created in this workspace.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(counts).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border/50 bg-background/30 px-3 py-2">
                  <div className="text-lg font-bold text-gold">{v}</div>
                  <div className="text-xs text-muted-foreground">{k}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/30">
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><ShieldAlert className="h-4 w-4 text-red-400" /> Reset workspace</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              Clears the orders, replies, notes, chats and briefs you've created and restores the workspace to its initial state.
            </p>
            <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>
              <RotateCcw className="h-4 w-4" /> Reset workspace
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-gold/25 bg-gold/5 p-3 text-sm text-gold/90">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <span className="font-medium">Your data stays on this device.</span>
          <p className="mt-0.5 text-xs text-gold/70">Records you create are stored locally in your browser and are not sent anywhere.</p>
        </div>
      </div>

      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Reset workspace?" description="This clears the records you've created and restores the initial state. This cannot be undone.">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={doReset}><RotateCcw className="h-4 w-4" /> Reset everything</Button>
        </div>
      </Dialog>

      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm dark:bg-slate-950/80">
          <div className="flex items-center gap-2 rounded-lg border border-gold/40 bg-popover px-5 py-3 text-sm">
            <RotateCcw className="h-4 w-4 animate-spin text-gold" /> Resetting demo & reloading…
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
