export interface Clinic {
  id: string;
  name: string;
  city: string;
  type: string;
  beds: number;
  tumorBoards: number;
  accreditation: string;
}

export interface Oncologist {
  id: string;
  name: string;
  gender: string;
  subspecialty: string;
  clinicId: string;
  experienceYears: number;
  email: string;
  rating: string;
  isCurrentUser: boolean;
}

export interface Biomarker {
  name: string;
  status: string;
  actionable: boolean;
}

export interface PatientFlags {
  newlyDiagnosed: boolean;
  recurrence: boolean;
  mtbNeeded: boolean;
  reportsPending: boolean;
  followUpDue: boolean;
  criticalFinding: boolean;
  overdueFollowUp: boolean;
}

export interface Patient {
  id: string;
  mrn: string;
  name: string;
  firstName: string;
  gender: string;
  age: number;
  cancerType: string;
  isHeme: boolean;
  stage: string;
  diagnosisDate: string;
  ecog: number;
  treatingOncologistId: string;
  treatingOncologist: string;
  currentTreatment: string;
  currentRegimen: string;
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
  biomarkers: Biomarker[];
  reportStatus: string;
  pendingActions: string[];
  lastVisit: string;
  nextAppointment: string | null;
  carePlanStatus: string;
  clinicId: string;
  phone: string;
  flags: PatientFlags;
  cyclesCompleted: number;
  cyclesTotal: number;
  bloodGroup: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  oncologistId: string;
  datetime: string;
  date: string;
  time: string;
  durationMin: number;
  type: string;
  status: string;
  mode: string;
  reason: string;
  room: string;
  reminderSent: boolean;
  isToday: boolean;
}

export interface ReportBiomarker {
  name: string;
  finding: string;
  tier: string;
}

export interface DiagnosticReport {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  lab: string;
  collectedDate: string;
  reportedDate: string;
  status: string;
  critical: boolean;
  keyBiomarkers: ReportBiomarker[];
  tumorType: string;
  specimen: string;
  reviewedBy: string | null;
  turnaroundDays: number;
  hasTrialMatch: boolean;
}

export interface TimelineEvent {
  id: string;
  patientId: string;
  type: string;
  title: string;
  date: string;
  detail: string;
  author: string;
}

export interface Order {
  id: string;
  patientId: string;
  patientName: string;
  scenario: string;
  category: string;
  tests: string[];
  status: string;
  priority: string;
  orderedBy: string;
  orderedDate: string;
  expectedTat: string;
  lab: string;
  notes: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  regimen: string;
  intent: string;
  cycleLength: string;
  cyclesPlanned: number;
  cyclesDone: number;
  startDate: string;
  nextCycleDate: string;
  supportiveCare: string[];
  monitoringLabs: string[];
  imagingFollowUp: string;
  patientInstructions: string;
  status: string;
  osakhiReminders: boolean;
  prescribedBy: string;
}

export interface OSakhiMessage {
  id: string;
  patientId: string;
  patientName: string;
  category: string;
  text: string;
  datetime: string;
  status: string;
  urgent: boolean;
  sentiment: string;
  channel: string;
  assignedTo: string;
}

export interface PeerReview {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  requestedById: string;
  requestedBy: string;
  reviewerId: string;
  reviewer: string;
  specialty: string;
  question: string;
  status: string;
  requestedDate: string;
  attachedReports: string[];
  recommendation: string | null;
  priority: string;
}

export interface MolecularFinding {
  marker: string;
  result: string;
  actionability: string;
}

export interface TreatmentOption {
  therapy: string;
  evidenceLevel: string;
  rationale: string;
}

export interface MTBCase {
  id: string;
  patientId: string;
  patientName: string;
  cancerType: string;
  stage: string;
  status: string;
  scheduledDate: string;
  priorTreatments: string[];
  molecularFindings: MolecularFinding[];
  clinicalQuestions: string[];
  treatmentOptions: TreatmentOption[];
  evidenceSummary: string;
  recommendation: string | null;
  panel: string[];
}

export interface ChatMessage {
  id: string;
  patientId: string;
  role: "doctor" | "assistant";
  text: string;
  timestamp: string;
}

export interface ChartNote {
  id: string;
  patientId: string;
  text: string;
  author: string;
  timestamp: string;
  source: string;
}

export interface DataMeta {
  generatedFor: string;
  referenceDate: string;
  currentUserId: string;
  disclaimer: string;
}
