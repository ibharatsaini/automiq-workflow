import api from "./axios";
import type {
  Workflow,
  WorkflowNode,
  WorkflowConnections,
  RunResult,
} from "@/types";
export const workflowsApi = {
  list: async () => (await api.get<Workflow[]>("/workflows")).data,
  get: async (id: string) => (await api.get<Workflow>(`/workflows/${id}`)).data,
  create: async (d: {
    name: string;
    nodes: WorkflowNode[];
    connections: WorkflowConnections;
    settings?: Record<string, unknown>;
  }) => (await api.post<Workflow>("/workflows", d)).data,
  delete: async (id: string) => api.delete(`/workflows/${id}`),
  activate: async (id: string) =>
    (await api.post<{ active: boolean }>(`/workflows/${id}/activate`)).data,
  deactivate: async (id: string) =>
    (await api.post<{ active: boolean }>(`/workflows/${id}/deactivate`)).data,
  test: async (id: string, data?: Record<string, unknown>) =>
    (await api.post<RunResult>(`/workflows/${id}/test`, data ?? {})).data,
};
