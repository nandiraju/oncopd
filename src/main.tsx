import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createHashRouter, Navigate } from "react-router-dom";
import "./index.css";

// Apply persisted theme before first paint to avoid flash.
try {
  const raw = localStorage.getItem("oncopd-theme");
  if (raw && JSON.parse(raw)?.state?.theme === "dark") {
    document.documentElement.classList.add("dark");
  }
} catch {
  /* default light */
}

import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { PatientRegistryPage } from "@/pages/PatientRegistryPage";
import { PatientViewPage } from "@/pages/PatientViewPage";
import { OrderWizardPage } from "@/pages/OrderWizardPage";
import { ReportWizardPage } from "@/pages/ReportWizardPage";
import { ChatEMRPage } from "@/pages/ChatEMRPage";
import { AppointmentsPage } from "@/pages/AppointmentsPage";
import { OsakhiPage } from "@/pages/OsakhiPage";
import { PeerReviewPage } from "@/pages/PeerReviewPage";
import { MTBPage } from "@/pages/MTBPage";
import { SettingsPage } from "@/pages/SettingsPage";

const router = createHashRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "patients", element: <PatientRegistryPage /> },
      { path: "patients/:id", element: <PatientViewPage /> },
      { path: "orders", element: <OrderWizardPage /> },
      { path: "reports", element: <ReportWizardPage /> },
      { path: "reports/:reportId", element: <ReportWizardPage /> },
      { path: "chatemr", element: <ChatEMRPage /> },
      { path: "chatemr/:id", element: <ChatEMRPage /> },
      { path: "appointments", element: <AppointmentsPage /> },
      { path: "osakhi", element: <OsakhiPage /> },
      { path: "peer-review", element: <PeerReviewPage /> },
      { path: "mtb", element: <MTBPage /> },
      { path: "mtb/:caseId", element: <MTBPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
