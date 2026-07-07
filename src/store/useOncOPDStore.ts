import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChartNote, ChatMessage, Order, PeerReview } from "@/lib/types";

interface MsgOverlay {
  status?: string;
  reply?: string;
  repliedAt?: string;
}

interface OncOPDState {
  // created records (delta over seed data)
  createdOrders: Order[];
  createdPeerReviews: PeerReview[];
  chartNotes: ChartNote[];
  chatHistory: Record<string, ChatMessage[]>;
  mtbBriefs: Record<string, { text: string; savedAt: string }>;
  msgOverlays: Record<string, MsgOverlay>;
  rxReminderOverlays: Record<string, boolean>;
  apptStatusOverlays: Record<string, string>;
  // ui prefs
  activeOncologistId: string | null;

  // actions
  addOrder: (o: Order) => void;
  addPeerReview: (p: PeerReview) => void;
  addChartNote: (n: ChartNote) => void;
  pushChat: (patientId: string, msg: ChatMessage) => void;
  clearChat: (patientId: string) => void;
  saveMtbBrief: (mtbId: string, text: string) => void;
  setMsgOverlay: (msgId: string, overlay: MsgOverlay) => void;
  toggleRxReminder: (rxId: string, value: boolean) => void;
  setApptStatus: (apptId: string, status: string) => void;
  resetDemo: () => void;
}

const nowIso = () => new Date().toISOString();

export const useOncOPDStore = create<OncOPDState>()(
  persist(
    (set) => ({
      createdOrders: [],
      createdPeerReviews: [],
      chartNotes: [],
      chatHistory: {},
      mtbBriefs: {},
      msgOverlays: {},
      rxReminderOverlays: {},
      apptStatusOverlays: {},
      activeOncologistId: null,

      addOrder: (o) => set((s) => ({ createdOrders: [o, ...s.createdOrders] })),
      addPeerReview: (p) => set((s) => ({ createdPeerReviews: [p, ...s.createdPeerReviews] })),
      addChartNote: (n) => set((s) => ({ chartNotes: [n, ...s.chartNotes] })),
      pushChat: (patientId, msg) =>
        set((s) => ({
          chatHistory: {
            ...s.chatHistory,
            [patientId]: [...(s.chatHistory[patientId] ?? []), msg],
          },
        })),
      clearChat: (patientId) =>
        set((s) => {
          const next = { ...s.chatHistory };
          delete next[patientId];
          return { chatHistory: next };
        }),
      saveMtbBrief: (mtbId, text) =>
        set((s) => ({ mtbBriefs: { ...s.mtbBriefs, [mtbId]: { text, savedAt: nowIso() } } })),
      setMsgOverlay: (msgId, overlay) =>
        set((s) => ({ msgOverlays: { ...s.msgOverlays, [msgId]: { ...s.msgOverlays[msgId], ...overlay } } })),
      toggleRxReminder: (rxId, value) =>
        set((s) => ({ rxReminderOverlays: { ...s.rxReminderOverlays, [rxId]: value } })),
      setApptStatus: (apptId, status) =>
        set((s) => ({ apptStatusOverlays: { ...s.apptStatusOverlays, [apptId]: status } })),
      resetDemo: () =>
        set({
          createdOrders: [],
          createdPeerReviews: [],
          chartNotes: [],
          chatHistory: {},
          mtbBriefs: {},
          msgOverlays: {},
          rxReminderOverlays: {},
          apptStatusOverlays: {},
        }),
    }),
    { name: "oncopd-demo-v1" }
  )
);
