import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RegisterPage } from "./features/auth/RegisterPage";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { AppLayout } from "./components/layout/AppLayout";
import { WorkflowDetailPage } from "./features/workflows/WorkflowDetailPage";
import { WorkflowsPage } from "./features/workflows/WorkflowsPage";
import { GuestRoute, ProtectedRoute } from "./components/routes";
import { ExecutionsPage } from "./features/executions/ExecutionsPage";
import { ExecutionDetailPage } from "./features/executions/ExecutionDetailPage";
import { CredentialsPage } from "./features/credentials/CredentialsPage";

export default function App() {
  return (
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
            <Route path="/executions/:id" element={<ExecutionDetailPage />} />
            <Route path="/credentials" element={<CredentialsPage />} />
          </Route>
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
