import { useOncOPDStore } from "@/store/useOncOPDStore";
import {
  seedAppointments,
  seedMtb,
  seedOrders,
  seedOsakhi,
  seedPatients,
  seedPeerReviews,
  seedPrescriptions,
  seedReports,
  seedTimeline,
} from "./data-service";
import type { Appointment, OSakhiMessage, Order, PeerReview } from "./types";

export function usePatient(id: string | undefined) {
  return seedPatients.find((p) => p.id === id);
}

export function usePatientReports(id: string) {
  return seedReports
    .filter((r) => r.patientId === id)
    .sort((a, b) => b.reportedDate.localeCompare(a.reportedDate));
}

export function usePatientTimeline(id: string) {
  return seedTimeline
    .filter((e) => e.patientId === id)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function usePatientPrescriptions(id: string) {
  return seedPrescriptions.filter((r) => r.patientId === id);
}

export function usePatientMtb(id: string) {
  return seedMtb.filter((m) => m.patientId === id);
}

export function useAllOrders(): Order[] {
  const created = useOncOPDStore((s) => s.createdOrders);
  return [...created, ...seedOrders];
}

export function useAllPeerReviews(): PeerReview[] {
  const created = useOncOPDStore((s) => s.createdPeerReviews);
  return [...created, ...seedPeerReviews];
}

export function useMessages(): (OSakhiMessage & { reply?: string })[] {
  const overlays = useOncOPDStore((s) => s.msgOverlays);
  return seedOsakhi
    .map((m) => {
      const o = overlays[m.id];
      return o ? { ...m, status: o.status ?? m.status, reply: o.reply } : m;
    })
    .sort((a, b) => b.datetime.localeCompare(a.datetime));
}

export function useAppointments(): Appointment[] {
  const overlays = useOncOPDStore((s) => s.apptStatusOverlays);
  return seedAppointments
    .map((a) => (overlays[a.id] ? { ...a, status: overlays[a.id] } : a))
    .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

export function usePatientContext(id: string) {
  const patient = usePatient(id);
  const reports = usePatientReports(id);
  const timeline = usePatientTimeline(id);
  const prescriptions = usePatientPrescriptions(id);
  if (!patient) return null;
  return { patient, reports, timeline, prescriptions };
}
