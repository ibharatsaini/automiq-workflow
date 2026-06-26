import api from "./axios";
import type { Execution } from "@/types";
export const executionsApi = {
  list: async (workflowId?: string) =>
    (
      await api.get<Execution[]>("/executions", {
        params: workflowId ? { workflowId } : undefined,
      })
    ).data,
  get: async (id: string) =>
    (await api.get<Execution>(`/executions/${id}`)).data,
};

