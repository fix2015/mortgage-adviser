import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import { CookieConsent } from "@/components/legal/CookieConsent";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ChatPage } from "@/pages/ChatPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { CalculatorPage } from "@/pages/CalculatorPage";
import { ComparePage } from "@/pages/ComparePage";
import { StrategyPage } from "@/pages/StrategyPage";
import { AdminPage } from "@/pages/AdminPage";
import { TermsPage } from "@/pages/TermsPage";
import { PrivacyPage } from "@/pages/PrivacyPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { MovingCostPage } from "@/pages/MovingCostPage";
import { PredictionsPage } from "@/pages/PredictionsPage";
import { HealthCheckPage } from "@/pages/HealthCheckPage";
import { ReferencePage } from "@/pages/ReferencePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/admin" element={<AdminPage />} />

              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="chat" element={<ChatPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="calculator" element={<CalculatorPage />} />
                <Route path="compare" element={<ComparePage />} />
                <Route path="strategy" element={<StrategyPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="moving-costs" element={<MovingCostPage />} />
                <Route path="predictions" element={<PredictionsPage />} />
                <Route path="health-check" element={<HealthCheckPage />} />
                <Route path="reference" element={<ReferencePage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <CookieConsent />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
