import axios from "axios";
import { useAuthStore } from "@/store/auth.store";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5678",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const auth = useAuthStore.getState().auth;
  if (auth?.token) config.headers["Authorization"] = `Bearer ${auth.token}`;
  if (auth?.subdomain) config.headers["X-Project-Subdomain"] = auth.subdomain;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
export default api;
