import { Request, Response, NextFunction, RequestHandler } from "express";
import { AuthService } from "../services/AuthService";
import { UserRole } from "../lib/auth.types.js";

const ROLE_RANK: Record<UserRole, number> = { viewer: 0, editor: 1, admin: 2 };

export class AuthMiddleware {
  constructor(private readonly authService: AuthService) {}

  // Verifies Bearer JWT and sets req.user but without role, it is being set in ProjectMiddleware
  authenticate: RequestHandler = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const header = req.headers["authorization"];
    if (!header?.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ error: "Missing or malformed Authorization header" });
      return;
    }
    try {
      const payload = this.authService.verifyToken(header.slice(7));
      req.user = { id: payload.sub, email: payload.email };
      next();
    } catch (err: unknown) {
      res
        .status(401)
        .json({ error: err instanceof Error ? err.message : "Unauthorized" });
    }
  };

  requiredRole(minimumRole: UserRole): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const role = req.user?.role;
      if (!role) {
        res.status(403).json({ error: "No project role resolved" });
        return;
      }
      if (ROLE_RANK[role] < ROLE_RANK[minimumRole]) {
        res.status(403).json({
          error: `Forbidden — requires "${minimumRole}", you have "${role}"`,
        });
        return;
      }
      next();
    };
  }
}
