// OncOPD AI engine — deterministic chart-derived summaries.
import type {
  DiagnosticReport,
  MTBCase,
  Patient,
  Prescription,
  TimelineEvent,
} from "./types";
import { formatDate } from "./utils";

export const SYNTHETIC_TAG = "AI-generated summary — review before making clinical decisions.";

interface Ctx {
  patient: Patient;
  reports: DiagnosticReport[];
  timeline: TimelineEvent[];
  prescriptions: Prescription[];
  mtb?: MTBCase;
}

const bullets = (arr: string[]) => arr.map((s) => `• ${s}`).join("\n");

function biomarkerLine(p: Patient) {
  if (!p.biomarkers.length) return "No actionable biomarkers on file.";
  return p.biomarkers.map((b) => `${b.name} (${b.status}${b.actionable ? ", actionable" : ""})`).join("; ");
}

export function summarize60(ctx: Ctx): string {
  const { patient: p, reports, prescriptions } = ctx;
  const latestRx = prescriptions[0];
  return [
    `**60-Second Summary — ${p.name}**`,
    "",
    bullets([
      `${p.age}y ${p.gender}, ${p.cancerType}, Stage ${p.stage} (${p.isHeme ? "hematologic" : "solid tumor"}).`,
      `Diagnosed ${formatDate(p.diagnosisDate)}; ECOG ${p.ecog}; risk level ${p.riskLevel}.`,
      `Current therapy: ${p.currentTreatment} (${p.currentRegimen}). Cycle ${p.cyclesCompleted}/${p.cyclesTotal}.`,
      `Molecular: ${biomarkerLine(p)}.`,
      `Reports on file: ${reports.length} (${reports.filter((r) => r.status === "Critical").length} flagged critical).`,
      latestRx ? `Care plan: ${latestRx.intent}, ${latestRx.status}. Next cycle ${formatDate(latestRx.nextCycleDate)}.` : "No active care plan recorded.",
      `Pending actions: ${p.pendingActions.length ? p.pendingActions.join(", ") : "none"}.`,
    ]),
    "",
    `_${SYNTHETIC_TAG}_`,
  ].join("\n");
}

export function whatChanged(ctx: Ctx): string {
  const { patient: p, timeline, reports } = ctx;
  const since = p.lastVisit;
  const recent = [...timeline]
    .filter((e) => e.date >= since || true)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  const newReports = reports.filter((r) => r.reportedDate >= since);
  const changes: string[] = [];
  newReports.forEach((r) => changes.push(`New ${r.type} report (${formatDate(r.reportedDate)}) — ${r.status}${r.critical ? " ⚠ critical finding" : ""}.`));
  recent.forEach((e) => changes.push(`${formatDate(e.date)} — ${e.title}: ${e.detail}.`));
  if (p.flags.recurrence) changes.push("Flagged for possible recurrence — restaging advised.");
  if (p.flags.followUpDue) changes.push("Follow-up now due.");
  return [
    `**What changed since last visit (${formatDate(since)})?**`,
    "",
    changes.length ? bullets(changes.slice(0, 6)) : "• No significant interval changes detected.",
    "",
    `_${SYNTHETIC_TAG}_`,
  ].join("\n");
}

export function openQuestions(ctx: Ctx): string {
  const { patient: p, reports } = ctx;
  const q: string[] = [];
  if (p.biomarkers.some((b) => b.actionable)) q.push(`Is the patient on the optimal matched therapy for ${p.biomarkers.find((b) => b.actionable)?.name}?`);
  if (reports.some((r) => r.status === "Pending Review")) q.push("Unreviewed report present — does it change the current line of therapy?");
  if (p.flags.mtbNeeded) q.push("Should this case be escalated to the Molecular Tumor Board?");
  if (p.ecog >= 2) q.push(`Performance status ECOG ${p.ecog} — reassess treatment intensity and supportive care.`);
  if (p.flags.recurrence) q.push("Confirm recurrence vs pseudo-progression before switching lines.");
  if (reports.some((r) => r.hasTrialMatch)) q.push("A trial match exists — is the patient eligible and interested?");
  q.push("Are germline/cascade testing implications addressed with the family?");
  return [
    `**Open clinical questions — ${p.name}**`,
    "",
    bullets(q.slice(0, 6)),
    "",
    `_${SYNTHETIC_TAG}_`,
  ].join("\n");
}

export function patientFriendly(ctx: Ctx, report?: DiagnosticReport): string {
  const { patient: p } = ctx;
  const marker = report?.keyBiomarkers?.[0] ?? { name: p.biomarkers[0]?.name ?? "a marker", finding: "detected" };
  return [
    `**Explanation for ${p.firstName} (plain language)**`,
    "",
    `You have ${p.cancerType.toLowerCase()}. Your tests show a change called **${marker.name}**. Think of it like a specific "switch" inside the cancer cells that we can often target with the right medicine.`,
    "",
    `Because of this, your team is using **${p.currentTreatment}**. This is chosen to match your cancer's biology, which usually works better than a one-size-fits-all approach.`,
    "",
    `What this means for you: we will keep a close eye on how you feel and repeat scans to check the medicine is working. Please tell us about any side effects early — most can be managed.`,
    "",
    `Questions are welcome. You can message us anytime through OSakhi.`,
    "",
    `_${SYNTHETIC_TAG}_`,
  ].join("\n");
}

export function mtbSummary(ctx: Ctx): string {
  const { patient: p, reports, prescriptions } = ctx;
  const molecular = p.biomarkers.map((b) => `${b.name}: ${b.status}`).join("; ");
  return [
    `**MTB-Ready Case Summary — ${p.name} (${p.mrn})**`,
    "",
    `**Diagnosis:** ${p.cancerType}, Stage ${p.stage}. Dx ${formatDate(p.diagnosisDate)}. ECOG ${p.ecog}.`,
    `**Prior/Current treatment:** ${p.currentTreatment} — ${p.currentRegimen} (cycle ${p.cyclesCompleted}/${p.cyclesTotal}).`,
    `**Molecular findings:** ${molecular || "pending"}.`,
    `**Reports:** ${reports.length} on file; ${reports.filter((r) => r.hasTrialMatch).length} with trial signal.`,
    `**Care plan:** ${prescriptions[0]?.intent ?? "—"}, ${p.carePlanStatus}.`,
    "",
    `**Key questions for the board:**`,
    bullets([
      "Confirm optimal matched therapy vs standard of care.",
      "Assess clinical trial eligibility for actionable alterations.",
      "Define monitoring and resistance-surveillance plan.",
    ]),
    "",
    `_${SYNTHETIC_TAG}_`,
  ].join("\n");
}

// ---------- ChatEMR intent routing ----------
export function chatEMRRespond(question: string, ctx: Ctx): string {
  const q = question.toLowerCase();
  const { patient: p, reports } = ctx;

  if (/(diagnos|stage)/.test(q)) {
    return [
      `${p.name} has **${p.cancerType}, Stage ${p.stage}**, diagnosed ${formatDate(p.diagnosisDate)}. Current ECOG performance status is ${p.ecog}, risk level ${p.riskLevel}.`,
      "",
      `_${SYNTHETIC_TAG}_`,
    ].join("\n");
  }
  if (/(mutation|biomarker|molecular|gene|marker)/.test(q)) {
    return [
      `Molecular findings for ${p.firstName}:`,
      "",
      bullets(p.biomarkers.map((b) => `${b.name} — ${b.status}${b.actionable ? " (actionable)" : ""}`)),
      "",
      `_${SYNTHETIC_TAG}_`,
    ].join("\n");
  }
  if (/(treatment|therapy|received|regimen|drug|medicine)/.test(q)) {
    return [
      `${p.firstName} is on **${p.currentTreatment}** (${p.currentRegimen}), cycle ${p.cyclesCompleted} of ${p.cyclesTotal}. Care plan status: ${p.carePlanStatus}.`,
      "",
      `_${SYNTHETIC_TAG}_`,
    ].join("\n");
  }
  if (/(chang|since last|update|new)/.test(q)) {
    return whatChanged(ctx);
  }
  if (/(latest report|summariz|summary of|report)/.test(q)) {
    const r = reports[0];
    if (!r) return `No reports on file for ${p.name}.\n\n_${SYNTHETIC_TAG}_`;
    return [
      `Latest report — **${r.type}** (${r.lab}, ${formatDate(r.reportedDate)}), status ${r.status}.`,
      "",
      bullets(r.keyBiomarkers.map((b) => `${b.name}: ${b.finding} — ${b.tier}`)),
      r.hasTrialMatch ? "\nA clinical trial match signal is present." : "",
      "",
      `_${SYNTHETIC_TAG}_`,
    ].join("\n");
  }
  if (/(mtb|tumor board|board)/.test(q)) {
    return mtbSummary(ctx);
  }
  if (/(explain|simple|patient-friendly|layman)/.test(q)) {
    return patientFriendly(ctx);
  }
  if (/(60|second|overview|summar)/.test(q)) {
    return summarize60(ctx);
  }
  return [
    `I can answer questions about ${p.firstName}'s diagnosis, molecular profile, treatments, latest reports, interval changes, and MTB prep. Try one of the suggested prompts below.`,
    "",
    `_${SYNTHETIC_TAG}_`,
  ].join("\n");
}

// ---------- Order Wizard suggestions ----------
const SCENARIO_TESTS: Record<string, string[]> = {
  "Newly diagnosed lung cancer": ["Comprehensive Genomic Profiling (500+ genes)", "PD-L1 IHC 22C3", "RNA Fusion NGS Panel"],
  Recurrence: ["ctDNA Liquid Biopsy", "Comprehensive Genomic Profiling (500+ genes)", "PET-CT Restaging"],
  "Therapy resistance": ["ctDNA Liquid Biopsy", "RNA Fusion NGS Panel", "Comprehensive Genomic Profiling (500+ genes)"],
  "Family history": ["Hereditary Cancer Germline Panel", "BRCA1/2 Germline", "Lynch Syndrome Panel"],
  "MRD monitoring": ["Signatera bespoke MRD", "MRD ctDNA Monitoring"],
  "Trial eligibility": ["Comprehensive Genomic Profiling (500+ genes)", "HRD Score (Genomic Instability)", "PD-L1 IHC 22C3"],
  "MTB recommendation": ["Comprehensive Genomic Profiling (500+ genes)", "HRD Score (Genomic Instability)", "ctDNA Liquid Biopsy"],
};

export function suggestTests(scenario: string, patient?: Patient): { test: string; reason: string }[] {
  const base = SCENARIO_TESTS[scenario] ?? ["Comprehensive Genomic Profiling (500+ genes)"];
  const reasons: Record<string, string> = {
    "Comprehensive Genomic Profiling (500+ genes)": "Broad driver detection to match targeted therapy.",
    "PD-L1 IHC 22C3": "Predictive biomarker for immunotherapy eligibility.",
    "RNA Fusion NGS Panel": "Detects actionable gene fusions (ALK/ROS1/RET/NTRK).",
    "ctDNA Liquid Biopsy": "Non-invasive profiling; captures resistance alterations.",
    "PET-CT Restaging": "Assess disease burden and response.",
    "Hereditary Cancer Germline Panel": "Evaluate inherited risk; informs cascade testing.",
    "BRCA1/2 Germline": "PARP inhibitor eligibility and family screening.",
    "Lynch Syndrome Panel": "MMR/MSI-driven hereditary risk assessment.",
    "Signatera bespoke MRD": "Tumor-informed minimal residual disease tracking.",
    "MRD ctDNA Monitoring": "Serial surveillance for molecular relapse.",
    "HRD Score (Genomic Instability)": "Homologous recombination deficiency for PARP benefit.",
  };
  const patientBoost: string[] = [];
  if (patient?.cancerType === "Breast Cancer" || patient?.cancerType === "Gastric Cancer") patientBoost.push("HER2 IHC + FISH");
  return [...new Set([...base, ...patientBoost])].map((t) => ({
    test: t,
    reason: reasons[t] ?? "Recommended for this scenario.",
  }));
}
