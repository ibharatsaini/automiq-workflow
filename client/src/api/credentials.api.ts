import api from "../lib/axios";
import type { Credential } from "@/types";
export const credentialsApi = {
  list: async () => (await api.get<Credential[]>("/credentials")).data,
  create: async (d: {
    name: string;
    type: string;
    data: Record<string, unknown>;
  }) =>
    (
      await api.post<{ id: string; name: string; type: string }>(
        "/credentials",
        d,
      )
    ).data,
  delete: async (id: string) => api.delete(`/credentials/${id}`),
};
