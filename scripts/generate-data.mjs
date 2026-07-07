// OncOPD synthetic data generator — deterministic, frontend-only demo.
// Produces linked JSON datasets in /src/data. No real patient data.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data");
mkdirSync(OUT, { recursive: true });

// ---------- Seeded RNG (mulberry32) ----------
let _seed = 0x6f43a2c1;
function rng() {
  _seed |= 0;
  _seed = (_seed + 0x6d2b79f5) | 0;
  let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const rand = (n) => Math.floor(rng() * n);
const pick = (arr) => arr[rand(arr.length)];
const pickN = (arr, n) => {
  const c = [...arr];
  const out = [];
  while (out.length < n && c.length) out.push(c.splice(rand(c.length), 1)[0]);
  return out;
};
const chance = (p) => rng() < p;
const id = (prefix, n) => `${prefix}-${String(n).padStart(4, "0")}`;

// ---------- Reference date ----------
const TODAY = new Date("2026-07-06T09:00:00");
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function iso(d) {
  return d.toISOString().slice(0, 10);
}
function isoT(d) {
  return d.toISOString();
}

// ---------- Vocabularies ----------
const CANCER_TYPES = [
  "NSCLC",
  "Breast Cancer",
  "Colorectal Cancer",
  "Ovarian Cancer",
  "Prostate Cancer",
  "Melanoma",
  "Pancreatic Cancer",
  "Gastric Cancer",
  "Head and Neck Cancer",
  "Leukemia",
  "Lymphoma",
  "Multiple Myeloma",
];

const CANCER_META = {
  NSCLC: {
    biomarkers: ["EGFR exon 19 deletion", "EGFR L858R", "ALK fusion", "ROS1 fusion", "KRAS G12C", "MET exon 14 skipping", "BRAF V600E", "PD-L1 TPS", "TMB-high"],
    treatments: ["Osimertinib", "Alectinib", "Sotorasib", "Pembrolizumab + Carboplatin/Pemetrexed", "Carboplatin/Pemetrexed", "Durvalumab maintenance"],
    regimens: ["Osimertinib 80mg daily", "Alectinib 600mg BID", "Sotorasib 960mg daily", "Pembrolizumab q3w + Pemetrexed"],
  },
  "Breast Cancer": {
    biomarkers: ["HER2 amplification", "BRCA1/2", "PD-L1 TPS", "MSI-high", "HRD positive"],
    treatments: ["AC-T + Trastuzumab", "T-DM1", "CDK4/6 inhibitor + AI", "Olaparib", "Trastuzumab deruxtecan"],
    regimens: ["Palbociclib 125mg + Letrozole", "T-DXd q3w", "Olaparib 300mg BID"],
  },
  "Colorectal Cancer": {
    biomarkers: ["KRAS G12C", "BRAF V600E", "MSI-high", "TMB-high", "HER2 amplification"],
    treatments: ["FOLFOX + Bevacizumab", "FOLFIRI + Cetuximab", "Pembrolizumab (MSI-H)", "Encorafenib + Cetuximab"],
    regimens: ["FOLFOX q2w", "FOLFIRI + Cetuximab q2w", "Pembrolizumab q3w"],
  },
  "Ovarian Cancer": {
    biomarkers: ["BRCA1/2", "HRD positive", "MSI-high"],
    treatments: ["Carboplatin/Paclitaxel", "Olaparib maintenance", "Niraparib maintenance", "Bevacizumab"],
    regimens: ["Carboplatin AUC5 + Paclitaxel q3w", "Niraparib 300mg daily", "Olaparib 300mg BID"],
  },
  "Prostate Cancer": {
    biomarkers: ["BRCA1/2", "HRD positive", "MSI-high"],
    treatments: ["ADT + Abiraterone", "Enzalutamide", "Olaparib", "Docetaxel", "Lu-177 PSMA"],
    regimens: ["Abiraterone 1000mg + Prednisone", "Enzalutamide 160mg daily", "Docetaxel q3w"],
  },
  Melanoma: {
    biomarkers: ["BRAF V600E", "PD-L1 TPS", "TMB-high", "MSI-high"],
    treatments: ["Dabrafenib + Trametinib", "Nivolumab + Ipilimumab", "Pembrolizumab", "Encorafenib + Binimetinib"],
    regimens: ["Dabrafenib 150mg BID + Trametinib 2mg", "Nivolumab + Ipilimumab q3w x4", "Pembrolizumab q3w"],
  },
  "Pancreatic Cancer": {
    biomarkers: ["BRCA1/2", "KRAS G12C", "MSI-high", "HRD positive"],
    treatments: ["FOLFIRINOX", "Gemcitabine + Nab-paclitaxel", "Olaparib maintenance"],
    regimens: ["FOLFIRINOX q2w", "Gemcitabine + Nab-paclitaxel weekly", "Olaparib 300mg BID"],
  },
  "Gastric Cancer": {
    biomarkers: ["HER2 amplification", "PD-L1 TPS", "MSI-high", "TMB-high"],
    treatments: ["FLOT", "Trastuzumab + FOLFOX", "Nivolumab + FOLFOX", "Trastuzumab deruxtecan"],
    regimens: ["FLOT q2w", "Trastuzumab + FOLFOX q2w", "Nivolumab q2w"],
  },
  "Head and Neck Cancer": {
    biomarkers: ["PD-L1 TPS", "TMB-high", "MSI-high"],
    treatments: ["Cisplatin + RT", "Pembrolizumab + Chemo", "Cetuximab + RT", "Nivolumab"],
    regimens: ["Cisplatin 100mg/m2 q3w + RT", "Pembrolizumab q3w + Platinum/5-FU"],
  },
  Leukemia: {
    biomarkers: ["BCR-ABL1", "FLT3-ITD", "NPM1", "IDH1/2", "TP53"],
    treatments: ["Imatinib", "Venetoclax + Azacitidine", "Midostaurin + 7+3", "Dasatinib"],
    regimens: ["Imatinib 400mg daily", "Venetoclax + Azacitidine 28d cycle", "7+3 induction"],
  },
  Lymphoma: {
    biomarkers: ["MYC rearrangement", "BCL2", "CD30", "TP53", "TMB-high"],
    treatments: ["R-CHOP", "Brentuximab + AVD", "Pola-R-CHP", "CAR-T referral"],
    regimens: ["R-CHOP q3w x6", "Brentuximab + AVD q2w", "Pola-R-CHP q3w"],
  },
  "Multiple Myeloma": {
    biomarkers: ["del(17p)", "t(4;14)", "t(11;14)", "1q gain", "TP53"],
    treatments: ["VRd", "DaraVRd", "Carfilzomib-based", "ASCT consolidation"],
    regimens: ["VRd 28d cycle", "Dara-VRd 28d cycle", "KRd 28d cycle"],
  },
};

const STAGES = ["I", "II", "IIA", "IIB", "III", "IIIA", "IIIB", "IV", "IVA", "IVB"];
const HEME_STAGES = ["Low risk", "Intermediate risk", "High risk", "Refractory", "Relapsed"];
const RISK = ["Low", "Moderate", "High", "Critical"];
const ECOG = [0, 0, 1, 1, 1, 2, 2, 3];
const GENDERS = ["Male", "Female"];
const REPORT_STATUS = ["Pending Review", "Reviewed", "Critical", "Awaiting Sample", "Amended"];
const CAREPLAN_STATUS = ["Active", "On Hold", "Under Review", "Completed", "Not Started"];

const FIRST_NAMES_M = ["Arjun", "Rohan", "Vikram", "Aditya", "Suresh", "Rajesh", "Karthik", "Anil", "Manoj", "Deepak", "Sanjay", "Ramesh", "Naveen", "Prakash", "Vivek", "Ashok", "Harish", "Gopal", "Nikhil", "Aravind"];
const FIRST_NAMES_F = ["Priya", "Ananya", "Meera", "Kavya", "Divya", "Lakshmi", "Sneha", "Pooja", "Radha", "Sunita", "Anjali", "Nisha", "Geetha", "Shreya", "Deepa", "Rekha", "Vidya", "Sushma", "Latha", "Bhavana"];
const LAST_NAMES = ["Sharma", "Reddy", "Iyer", "Nair", "Menon", "Rao", "Gupta", "Patel", "Kumar", "Krishnan", "Verma", "Desai", "Pillai", "Mehta", "Bose", "Chatterjee", "Joshi", "Kapoor", "Malhotra", "Shetty"];

const CITY_META = [
  ["Apollo Cancer Centre", "Chennai"],
  ["Tata Memorial Hospital", "Mumbai"],
  ["HCG Oncology", "Bengaluru"],
  ["Rajiv Gandhi Cancer Institute", "New Delhi"],
  ["Kidwai Memorial Institute", "Bengaluru"],
  ["Amrita Institute", "Kochi"],
  ["Cytecare Cancer Hospital", "Bengaluru"],
  ["Basavatarakam Indo-American", "Hyderabad"],
  ["Adyar Cancer Institute", "Chennai"],
  ["Manipal Comprehensive Cancer", "Bengaluru"],
  ["Fortis Memorial", "Gurugram"],
  ["Medanta Cancer Institute", "Gurugram"],
  ["Yashoda Cancer Institute", "Hyderabad"],
  ["Sir Ganga Ram Hospital", "New Delhi"],
  ["Aster CMI", "Bengaluru"],
  ["Narayana Health City", "Bengaluru"],
  ["Max Institute of Oncology", "New Delhi"],
  ["KIMS Cancer Centre", "Hyderabad"],
  ["Ruby Hall Clinic", "Pune"],
  ["Sahyadri Oncology", "Pune"],
];

const SUBSPECIALTIES = ["Medical Oncology", "Thoracic Oncology", "Breast Oncology", "GI Oncology", "GU Oncology", "Gynae-Oncology", "Hemato-Oncology", "Head & Neck Oncology", "Molecular Oncology", "Radiation Oncology"];

// ---------- Clinics ----------
const clinics = CITY_META.map(([name, city], i) => ({
  id: id("CLN", i + 1),
  name,
  city,
  type: chance(0.4) ? "Comprehensive Cancer Center" : "Multispecialty Hospital",
  beds: 120 + rand(600),
  tumorBoards: 2 + rand(6),
  accreditation: pick(["NABH", "NABH + NABL", "JCI", "NABH + JCI"]),
}));

// ---------- Oncologists ----------
const oncologists = Array.from({ length: 30 }, (_, i) => {
  const gender = pick(GENDERS);
  const first = gender === "Male" ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
  const last = pick(LAST_NAMES);
  const sub = pick(SUBSPECIALTIES);
  return {
    id: id("ONC", i + 1),
    name: `Dr. ${first} ${last}`,
    gender,
    subspecialty: sub,
    clinicId: pick(clinics).id,
    experienceYears: 6 + rand(28),
    email: `${first.toLowerCase()}.${last.toLowerCase()}@oncopd.demo`,
    rating: (4 + rng()).toFixed(1),
    isCurrentUser: i === 0,
  };
});
const currentUser = oncologists[0];
currentUser.name = "Dr. Arjun Menon";
currentUser.subspecialty = "Medical Oncology";

// ---------- Patients ----------
const PENDING_ACTIONS = [
  "Review genomics report",
  "Sign off chemotherapy order",
  "Confirm next cycle",
  "Order restaging scan",
  "Discuss MTB recommendation",
  "Renew supportive care prescription",
  "Follow up on liquid biopsy",
  "Reconcile toxicity grade",
  "Schedule teleconsult",
  "Approve germline testing",
];

const patients = Array.from({ length: 100 }, (_, i) => {
  const gender = pick(GENDERS);
  let cancer = pick(CANCER_TYPES);
  // gender-appropriate
  if (cancer === "Prostate Cancer") gender === "Female" && (cancer = "Bladder-adjacent Prostate Cancer".includes("x") ? cancer : cancer);
  if (cancer === "Ovarian Cancer" || cancer === "Breast Cancer") {
    // keep mostly female
  }
  const g = cancer === "Prostate Cancer" ? "Male" : cancer === "Ovarian Cancer" ? "Female" : gender;
  const first = g === "Male" ? pick(FIRST_NAMES_M) : pick(FIRST_NAMES_F);
  const last = pick(LAST_NAMES);
  const meta = CANCER_META[cancer];
  const isHeme = ["Leukemia", "Lymphoma", "Multiple Myeloma"].includes(cancer);
  const stage = isHeme ? pick(HEME_STAGES) : pick(STAGES);
  const risk = pick(RISK);
  const dxOffset = -(30 + rand(900));
  const diagnosisDate = iso(addDays(TODAY, dxOffset));
  const lastVisitOffset = -(1 + rand(90));
  const lastVisit = iso(addDays(TODAY, lastVisitOffset));
  const nextOffset = 1 + rand(60);
  const hasNext = chance(0.8);
  const biomarkers = pickN(meta.biomarkers, 1 + rand(3)).map((b) => ({
    name: b,
    status: b.includes("PD-L1")
      ? `${pick(["<1%", "1-49%", "≥50%", "80%"])} TPS`
      : b.includes("TMB")
      ? `${8 + rand(25)} mut/Mb`
      : pick(["Detected", "Positive", "Amplified", "Not detected"]),
    actionable: chance(0.7),
  }));
  const oncologist = chance(0.45) ? currentUser : pick(oncologists);
  const newlyDiagnosed = dxOffset > -60;
  const recurrence = !newlyDiagnosed && chance(0.25);
  const mtbNeeded = chance(0.4);
  const reportsPending = chance(0.45);
  const followUpDue = hasNext && nextOffset <= 3;
  return {
    id: id("PT", i + 1),
    mrn: `MRN${100000 + i * 37}`,
    name: `${first} ${last}`,
    firstName: first,
    gender: g,
    age: 34 + rand(52),
    cancerType: cancer,
    isHeme,
    stage,
    diagnosisDate,
    ecog: pick(ECOG),
    treatingOncologistId: oncologist.id,
    treatingOncologist: oncologist.name,
    currentTreatment: pick(meta.treatments),
    currentRegimen: pick(meta.regimens),
    riskLevel: risk,
    biomarkers,
    reportStatus: reportsPending ? pick(["Pending Review", "Critical"]) : pick(["Reviewed", "Amended"]),
    pendingActions: pickN(PENDING_ACTIONS, reportsPending ? 2 + rand(2) : rand(2)),
    lastVisit,
    nextAppointment: hasNext ? iso(addDays(TODAY, nextOffset)) : null,
    carePlanStatus: pick(CAREPLAN_STATUS),
    clinicId: oncologist.clinicId,
    phone: `+91 ${70 + rand(29)}${String(rand(100000000)).padStart(8, "0")}`,
    flags: {
      newlyDiagnosed,
      recurrence,
      mtbNeeded,
      reportsPending,
      followUpDue,
      criticalFinding: risk === "Critical" || chance(0.12),
      overdueFollowUp: !hasNext && lastVisitOffset < -45,
    },
    cyclesCompleted: rand(8),
    cyclesTotal: pick([4, 6, 6, 8, 12]),
    bloodGroup: pick(["A+", "B+", "O+", "AB+", "A-", "O-"]),
  };
});

const patientById = Object.fromEntries(patients.map((p) => [p.id, p]));

// ---------- Appointments ----------
const APPT_TYPES = ["Consultation", "Report Review", "Chemotherapy", "Follow-up", "Teleconsultation", "New Patient", "Post-op Review", "MTB Discussion"];
const APPT_STATUS = ["Scheduled", "Checked In", "In Progress", "Completed", "Missed", "Cancelled", "Rescheduled"];
const appointments = Array.from({ length: 250 }, (_, i) => {
  const p = pick(patients);
  const dayOffset = -20 + rand(60);
  const isToday = dayOffset === 0 || (i < 22 && chance(0.9));
  const off = isToday ? 0 : dayOffset;
  const hour = 9 + rand(8);
  const minute = pick([0, 15, 30, 45]);
  const dt = addDays(TODAY, off);
  dt.setHours(hour, minute, 0, 0);
  const past = off < 0;
  const type = pick(APPT_TYPES);
  const status = past
    ? pick(["Completed", "Completed", "Completed", "Missed", "Cancelled"])
    : off === 0
    ? pick(["Checked In", "Scheduled", "In Progress", "Scheduled", "Completed"])
    : "Scheduled";
  return {
    id: id("APT", i + 1),
    patientId: p.id,
    patientName: p.name,
    oncologistId: p.treatingOncologistId,
    datetime: isoT(dt),
    date: iso(dt),
    time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    durationMin: pick([15, 20, 30, 45, 60]),
    type,
    status,
    mode: type === "Teleconsultation" ? "Video" : "In-person",
    reason: pick([
      "Restaging discussion",
      "Cycle review & toxicity check",
      "Genomics report review",
      "New diagnosis workup",
      "Second opinion",
      "Symptom review",
      "Care plan renewal",
    ]),
    room: type === "Teleconsultation" ? "Tele" : `OPD-${1 + rand(8)}`,
    reminderSent: chance(0.6),
    isToday: off === 0,
  };
});

// ---------- Reports ----------
const REPORT_TYPES = ["Genomic Profiling", "Pathology", "IHC", "Liquid Biopsy", "Germline", "Radiology"];
const LABS = ["1Cell.Ai Genomics", "MedGenome", "Datar Cancer Genetics", "In-house Pathology", "Strand Life Sciences", "Roche Foundation One"];
const reports = Array.from({ length: 150 }, (_, i) => {
  const p = pick(patients);
  const type = pick(REPORT_TYPES);
  const meta = CANCER_META[p.cancerType];
  const off = -(1 + rand(120));
  const collected = addDays(TODAY, off - 5);
  const reported = addDays(TODAY, off);
  const keyBiomarkers = pickN(meta.biomarkers, 1 + rand(3));
  const critical = chance(0.18);
  const status = critical ? "Critical" : pick(REPORT_STATUS);
  return {
    id: id("RPT", i + 1),
    patientId: p.id,
    patientName: p.name,
    type,
    lab: pick(LABS),
    collectedDate: iso(collected),
    reportedDate: iso(reported),
    status,
    critical,
    keyBiomarkers: keyBiomarkers.map((b) => ({
      name: b,
      finding: b.includes("PD-L1")
        ? `${pick(["<1%", "1-49%", "≥50%"])} TPS`
        : b.includes("TMB")
        ? `${8 + rand(22)} mut/Mb (${chance(0.5) ? "high" : "intermediate"})`
        : pick(["Detected", "Positive", "Amplified", "Not detected", "VUS"]),
      tier: pick(["Tier IA", "Tier IB", "Tier IIC", "Tier III"]),
    })),
    tumorType: p.cancerType,
    specimen: pick(["FFPE tissue block", "Plasma (ctDNA)", "Bone marrow aspirate", "Peripheral blood", "Core biopsy"]),
    reviewedBy: chance(0.5) ? p.treatingOncologist : null,
    turnaroundDays: 5 + rand(16),
    hasTrialMatch: chance(0.4),
  };
});

// ---------- Timeline events ----------
const EVENT_TYPES = [
  ["diagnosis", "Diagnosis confirmed"],
  ["report", "Report available"],
  ["treatment", "Treatment started"],
  ["cycle", "Chemotherapy cycle administered"],
  ["imaging", "Imaging performed"],
  ["visit", "OPD visit"],
  ["order", "Order placed"],
  ["mtb", "MTB discussion"],
  ["toxicity", "Toxicity event"],
  ["response", "Response assessment"],
  ["message", "Patient message"],
];
const timelineEvents = [];
let evc = 1;
patients.forEach((p) => {
  const n = 2 + rand(4);
  for (let k = 0; k < n; k++) {
    const [etype, label] = pick(EVENT_TYPES);
    const off = -(1 + rand(700));
    timelineEvents.push({
      id: id("EVT", evc++),
      patientId: p.id,
      type: etype,
      title: label,
      date: iso(addDays(TODAY, off)),
      detail: pick([
        `${p.cancerType} — ${p.currentTreatment}`,
        `RECIST: ${pick(["Partial response", "Stable disease", "Progressive disease", "Complete response"])}`,
        `ECOG ${p.ecog}; toxicity grade ${1 + rand(3)}`,
        `Biomarker: ${pick(p.biomarkers).name}`,
        `Cycle ${1 + rand(p.cyclesTotal)} of ${p.cyclesTotal}`,
      ]),
      author: p.treatingOncologist,
    });
  }
});
// top up to 300
while (timelineEvents.length < 300) {
  const p = pick(patients);
  const [etype, label] = pick(EVENT_TYPES);
  timelineEvents.push({
    id: id("EVT", evc++),
    patientId: p.id,
    type: etype,
    title: label,
    date: iso(addDays(TODAY, -(1 + rand(700)))),
    detail: `${p.cancerType} — ${pick(["restaging", "cycle review", "new finding", "follow-up"])}`,
    author: p.treatingOncologist,
  });
}

// ---------- Orders ----------
const TEST_CATALOG = {
  "Genomic Profiling": ["Comprehensive Genomic Profiling (500+ genes)", "Solid Tumor NGS Panel", "Hotspot Panel"],
  "Liquid Biopsy": ["ctDNA Liquid Biopsy", "Guardant360 CDx", "cfDNA Panel"],
  "Germline Testing": ["Hereditary Cancer Germline Panel", "BRCA1/2 Germline", "Lynch Syndrome Panel"],
  HRD: ["HRD Score (Genomic Instability)", "Myriad myChoice CDx"],
  "PD-L1": ["PD-L1 IHC 22C3", "PD-L1 SP263"],
  HER2: ["HER2 IHC + FISH", "HER2 SISH"],
  "RNA Fusion Panel": ["RNA Fusion NGS Panel", "Archer FusionPlex"],
  MRD: ["MRD ctDNA Monitoring", "Signatera bespoke MRD"],
  Pharmacogenomics: ["DPYD Genotyping", "UGT1A1 Genotyping", "PGx Panel"],
  Imaging: ["PET-CT Restaging", "MRI Brain with contrast", "CECT Thorax/Abdomen"],
};
const SCENARIOS = [
  "Newly diagnosed lung cancer",
  "Recurrence",
  "Therapy resistance",
  "Family history",
  "MRD monitoring",
  "Trial eligibility",
  "MTB recommendation",
];
const ORDER_STATUS = ["Draft", "Pending Approval", "Approved", "Sample Collected", "In Lab", "Resulted", "Cancelled"];
const orders = Array.from({ length: 200 }, (_, i) => {
  const p = pick(patients);
  const cat = pick(Object.keys(TEST_CATALOG));
  const off = -(1 + rand(120));
  return {
    id: id("ORD", i + 1),
    patientId: p.id,
    patientName: p.name,
    scenario: pick(SCENARIOS),
    category: cat,
    tests: pickN(TEST_CATALOG[cat], 1 + rand(Math.min(2, TEST_CATALOG[cat].length))),
    status: pick(ORDER_STATUS),
    priority: pick(["Routine", "Routine", "Urgent", "STAT"]),
    orderedBy: p.treatingOncologist,
    orderedDate: iso(addDays(TODAY, off)),
    expectedTat: `${5 + rand(16)} days`,
    lab: pick(LABS),
    notes: pick(["", "", "Prior line progressed", "Fast-track for MTB", "Insurance pre-auth pending"]),
  };
});

// ---------- Prescriptions / Care plans ----------
const SUPPORTIVE = ["Ondansetron 8mg", "Dexamethasone 8mg", "Pegfilgrastim", "Pantoprazole 40mg", "Allopurinol 300mg", "Loperamide PRN", "Paracetamol 650mg"];
const MONITORING = ["CBC with differential", "LFT", "RFT", "Serum electrolytes", "LDH", "Tumor markers", "ECHO (LVEF)", "TSH"];
const prescriptions = Array.from({ length: 150 }, (_, i) => {
  const p = pick(patients);
  const off = -(1 + rand(90));
  return {
    id: id("RX", i + 1),
    patientId: p.id,
    patientName: p.name,
    regimen: p.currentRegimen,
    intent: pick(["Curative", "Adjuvant", "Neoadjuvant", "Palliative", "Maintenance"]),
    cycleLength: pick(["14 days", "21 days", "28 days"]),
    cyclesPlanned: p.cyclesTotal,
    cyclesDone: p.cyclesCompleted,
    startDate: iso(addDays(TODAY, off)),
    nextCycleDate: iso(addDays(TODAY, 1 + rand(21))),
    supportiveCare: pickN(SUPPORTIVE, 2 + rand(3)),
    monitoringLabs: pickN(MONITORING, 2 + rand(3)),
    imagingFollowUp: pick(["PET-CT after 3 cycles", "CT after 2 cycles", "MRI at 8 weeks", "Restaging at cycle 4"]),
    patientInstructions: pick([
      "Report fever >100.4°F immediately. Stay hydrated.",
      "Take anti-emetics 30 min before meals. Avoid raw foods.",
      "Daily oral drug at same time. Do not skip doses.",
      "Watch for diarrhea; start loperamide and report if >4 stools/day.",
    ]),
    status: p.carePlanStatus,
    osakhiReminders: chance(0.5),
    prescribedBy: p.treatingOncologist,
  };
});

// ---------- OSakhi messages ----------
const MSG_CATEGORIES = ["Side Effect", "Report Query", "Medication", "Appointment", "Symptom", "Distress", "General"];
const MSG_TEMPLATES = {
  "Side Effect": ["I have had nausea since yesterday's cycle. Is this normal?", "My hands feel tingly and numb after chemo.", "Severe mouth sores, unable to eat properly."],
  "Report Query": ["Doctor, is my scan report ready?", "What does 'partial response' mean in my report?", "Can you explain my genomic report?"],
  Medication: ["Ran out of anti-nausea tablets, what should I do?", "Can I take paracetamol with my current medicines?", "I missed my morning dose today."],
  Appointment: ["Can I reschedule my visit to next week?", "Confirming my appointment tomorrow at 11am.", "I may be 30 minutes late for my slot."],
  Symptom: ["Fever 101°F since last night with chills.", "Breathlessness while walking short distances.", "Persistent back pain for 3 days."],
  Distress: ["I feel very anxious about my results.", "I'm scared about starting chemotherapy.", "Feeling low and unable to sleep."],
  General: ["Thank you doctor for the care.", "Can my family join the next consultation?", "Where do I collect my medicines?"],
};
const osakhiMessages = Array.from({ length: 300 }, (_, i) => {
  const p = pick(patients);
  const cat = pick(MSG_CATEGORIES);
  const off = -(rand(20));
  const dt = addDays(TODAY, -off);
  dt.setHours(8 + rand(12), rand(60), 0, 0);
  const urgent = cat === "Distress" || cat === "Symptom" ? chance(0.6) : chance(0.1);
  return {
    id: id("MSG", i + 1),
    patientId: p.id,
    patientName: p.name,
    category: cat,
    text: pick(MSG_TEMPLATES[cat]),
    datetime: isoT(dt),
    status: pick(["Unread", "Unread", "Read", "Replied", "Escalated"]),
    urgent,
    sentiment: cat === "Distress" ? "Negative" : pick(["Neutral", "Neutral", "Positive", "Negative"]),
    channel: "OSakhi App",
    assignedTo: p.treatingOncologist,
  };
});

// ---------- Peer review / second opinion ----------
const PR_STATUS = ["Requested", "In Review", "Awaiting Reports", "Recommendation Ready", "Completed"];
const peerReviews = Array.from({ length: 50 }, (_, i) => {
  const p = pick(patients);
  const reviewer = pick(oncologists.filter((o) => o.id !== p.treatingOncologistId));
  const off = -(1 + rand(60));
  return {
    id: id("PR", i + 1),
    patientId: p.id,
    patientName: p.name,
    type: chance(0.5) ? "Second Opinion" : "Peer Review",
    requestedById: p.treatingOncologistId,
    requestedBy: p.treatingOncologist,
    reviewerId: reviewer.id,
    reviewer: reviewer.name,
    specialty: reviewer.subspecialty,
    question: pick([
      "Confirm first-line regimen choice given molecular profile.",
      "Is patient a candidate for clinical trial enrollment?",
      "Second opinion on surgical vs systemic-first approach.",
      "Assess resistance mechanism and next line options.",
      "Validate MTB recommendation before implementation.",
    ]),
    status: pick(PR_STATUS),
    requestedDate: iso(addDays(TODAY, off)),
    attachedReports: pickN(reports.filter((r) => r.patientId === p.id).map((r) => r.id), 1).filter(Boolean),
    recommendation: chance(0.4)
      ? pick([
          "Concur with proposed regimen; add germline testing.",
          "Recommend trial screening before next line.",
          "Suggest switching to targeted therapy per biomarker.",
          "Advise MDT surgical review prior to systemic therapy.",
        ])
      : null,
    priority: pick(["Routine", "Urgent"]),
  };
});

// ---------- MTB cases ----------
const mtbCases = Array.from({ length: 40 }, (_, i) => {
  const p = pick(patients);
  const meta = CANCER_META[p.cancerType];
  const molecular = pickN(meta.biomarkers, 2 + rand(2));
  const off = -(1 + rand(45));
  return {
    id: id("MTB", i + 1),
    patientId: p.id,
    patientName: p.name,
    cancerType: p.cancerType,
    stage: p.stage,
    status: pick(["Pending", "Scheduled", "Discussed", "Recommendation Finalized"]),
    scheduledDate: iso(addDays(TODAY, -off + rand(10))),
    priorTreatments: pickN(meta.treatments, 1 + rand(2)),
    molecularFindings: molecular.map((m) => ({
      marker: m,
      result: m.includes("PD-L1") ? `${pick(["1-49%", "≥50%"])} TPS` : pick(["Positive", "Detected", "Amplified"]),
      actionability: pick(["FDA-approved therapy", "Off-label evidence", "Clinical trial option", "Investigational"]),
    })),
    clinicalQuestions: pickN(
      [
        "Optimal next-line therapy given resistance?",
        "Trial eligibility for the identified alteration?",
        "Role of local therapy alongside systemic treatment?",
        "Germline implications and cascade testing?",
        "Sequencing of targeted vs immunotherapy?",
      ],
      2 + rand(2)
    ),
    treatmentOptions: pickN(meta.treatments, 2 + rand(2)).map((t) => ({
      therapy: t,
      evidenceLevel: pick(["Level 1 (guideline)", "Level 2A", "Level 2B", "Clinical trial"]),
      rationale: pick(["Matches driver alteration", "NCCN category 1", "Phase III benefit", "Emerging biomarker match"]),
    })),
    evidenceSummary: pick([
      "Guideline-concordant options exist for the identified driver; trial enrollment strengthens the plan.",
      "Molecular profile supports targeted therapy with category 1 evidence; monitor for resistance.",
      "Limited standard options; investigational and trial pathways recommended.",
    ]),
    recommendation: chance(0.5)
      ? pick([
          "Initiate matched targeted therapy; screen for trial in parallel.",
          "Proceed with immunotherapy combination; restage at 8 weeks.",
          "Refer for clinical trial; bridge with standard regimen.",
        ])
      : null,
    panel: pickN(oncologists, 3 + rand(3)).map((o) => o.name),
  };
});

// ---------- Write files ----------
const datasets = {
  clinics,
  oncologists,
  patients,
  appointments,
  reports,
  "timeline-events": timelineEvents,
  orders,
  prescriptions,
  "osakhi-messages": osakhiMessages,
  "peer-reviews": peerReviews,
  "mtb-cases": mtbCases,
  meta: {
    generatedFor: "OncOPD demo",
    referenceDate: iso(TODAY),
    currentUserId: currentUser.id,
    disclaimer: "OncOPD — Precision Oncology Platform.",
  },
};

for (const [name, data] of Object.entries(datasets)) {
  writeFileSync(resolve(OUT, `${name}.json`), JSON.stringify(data, null, 2));
}

console.log(
  "OncOPD data generated:",
  Object.entries(datasets)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => `${k}=${v.length}`)
    .join("  ")
);
