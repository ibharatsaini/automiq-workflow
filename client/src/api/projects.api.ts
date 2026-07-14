import api from "../lib/axios";
import type { Project, ProjectMember, UserRole } from "@/types";
export const projectsApi = {
  getCurrent: async () => (await api.get<Project>("/projects/current")).data,
  getMembers: async () =>
    (await api.get<ProjectMember[]>("/projects/current/members")).data,
  inviteMember: async (d: {
    email: string;
    role: UserRole;
    temporaryPassword: string;
  }) =>
    (
      await api.post<{
        userId: string;
        email: string;
        role: UserRole;
        isNewUser: boolean;
      }>("/projects/current/members", d)
    ).data,
  removeMember: async (userId: string) =>
    api.delete(`/projects/current/members/${userId}`),
};
