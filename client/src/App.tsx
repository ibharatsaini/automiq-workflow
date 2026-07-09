import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute, GuestRoute } from "@/components/routes";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { WorkflowsPage } from "@/features/workflows/WorkflowsPage";
import { WorkflowDetailPage } from "@/features/workflows/WorkflowDetailPage";
import { ExecutionsPage } from "@/features/executions/ExecutionsPage";
import { ExecutionDetailPage } from "@/features/executions/ExecutionDetailPage";
import { CredentialsPage } from "@/features/credentials/CredentialsPage";
import { ProjectSettingsPage } from "@/features/project/ProjectSettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/workflows" element={<WorkflowsPage />} />
                <Route path="/executions" element={<ExecutionsPage />} />
                <Route
                  path="/executions/:id"
                  element={<ExecutionDetailPage />}
                />
                <Route path="/credentials" element={<CredentialsPage />} />
                <Route path="/project" element={<ProjectSettingsPage />} />
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{ duration: 4000 }}
        />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
