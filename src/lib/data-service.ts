import clinicsJson from "@/data/clinics.json";
import oncologistsJson from "@/data/oncologists.json";
import patientsJson from "@/data/patients.json";
import appointmentsJson from "@/data/appointments.json";
import reportsJson from "@/data/reports.json";
import timelineJson from "@/data/timeline-events.json";
import ordersJson from "@/data/orders.json";
import prescriptionsJson from "@/data/prescriptions.json";
import osakhiJson from "@/data/osakhi-messages.json";
import peerReviewsJson from "@/data/peer-reviews.json";
import mtbJson from "@/data/mtb-cases.json";
import metaJson from "@/data/meta.json";
import type {
  Appointment,
  Clinic,
  DataMeta,
  DiagnosticReport,
  MTBCase,
  OSakhiMessage,
  Oncologist,
  Order,
  Patient,
  PeerReview,
  Prescription,
  TimelineEvent,
} from "./types";

export const clinics = clinicsJson as Clinic[];
export const oncologists = oncologistsJson as Oncologist[];
export const seedPatients = patientsJson as Patient[];
export const seedAppointments = appointmentsJson as Appointment[];
export const seedReports = reportsJson as DiagnosticReport[];
export const seedTimeline = timelineJson as TimelineEvent[];
export const seedOrders = ordersJson as Order[];
export const seedPrescriptions = prescriptionsJson as Prescription[];
export const seedOsakhi = osakhiJson as OSakhiMessage[];
export const seedPeerReviews = peerReviewsJson as PeerReview[];
export const seedMtb = mtbJson as MTBCase[];
export const meta = metaJson as DataMeta;

export const REFERENCE_DATE = meta.referenceDate;
export const currentUser =
  oncologists.find((o) => o.id === meta.currentUserId) ?? oncologists[0];

export function getClinic(id: string) {
  return clinics.find((c) => c.id === id);
}
export function getOncologist(id: string) {
  return oncologists.find((o) => o.id === id);
}

export const DISCLAIMER = meta.disclaimer;
