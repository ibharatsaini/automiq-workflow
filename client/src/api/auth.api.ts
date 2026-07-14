import api from "../lib/axios";
import type { LoginResponse, RegisterResponse, AuthUser } from "@/types";
export const authApi = {
  login: async (d: { email: string; password: string; subdomain: string }) => {
    const res = await api.post<LoginResponse>("/auth/login", d, {
      headers: { "X-Project-Subdomain": d.subdomain },
    });
    return res.data;
  },
  register: async (d: {
    email: string;
    password: string;
    projectName: string;
    subdomain: string;
  }) => {
    console.log({ ...d });
    return (await api.post<RegisterResponse>("/auth/register", d)).data;
  },
  me: async () => (await api.get<AuthUser>("/auth/me")).data,
};
