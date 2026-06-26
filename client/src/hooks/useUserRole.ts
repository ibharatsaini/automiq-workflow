import { useAuthStore } from "@/store/auth.store";
import type { UserRole } from "@/types";
const RANK: Record<UserRole, number> = { viewer: 0, editor: 1, admin: 2 };
export function useRole() {
  const role = useAuthStore((s) => s.auth?.user.role);
  const hasRole = (min: UserRole) => !!role && RANK[role] >= RANK[min];
  return {
    role,
    isAdmin: hasRole("admin"),
    isEditor: hasRole("editor"),
    isViewer: hasRole("viewer"),
    hasRole,
  };
}
