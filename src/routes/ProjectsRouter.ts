import { Request, Response } from "express";
import { BaseRouter } from "./BaseRouter.js";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
// import { ProjectMiddleware }  from '../m iddleware/';
import { ProjectService } from "../services/ProjectService";
import { ProjectMiddleware } from "../middleware/ProjectMiddleware.js";

export class ProjectsRouter extends BaseRouter {
  constructor(
    private readonly projectService: ProjectService,
    private readonly authMiddleware: AuthMiddleware,
    private readonly projectMiddleware: ProjectMiddleware,
  ) {
    super();
  }

  protected registerRoutes(): void {
    const authn = this.authMiddleware.authenticate;
    const project = this.projectMiddleware.resolveProject;
    const role = this.projectMiddleware.loadProjectRole;
    const req = this.authMiddleware.require.bind(this.authMiddleware);

    // GET /projects/current — project info (viewer+)
    this.router.get(
      "/current",
      authn,
      project,
      role,
      req("viewer"),
      this.getCurrent.bind(this),
    );

    // POST /projects/current/members — invite member (admin only)
    this.router.post(
      "/current/members",
      authn,
      project,
      role,
      req("admin"),
      this.inviteMember.bind(this),
    );
  }

  private getCurrent(req: Request, res: Response): void {
    res.json(req.project);
  }

  private async inviteMember(req: Request, res: Response): Promise<void> {
    const { email, role, temporaryPassword } = req.body as {
      email?: string;
      role?: string;
      temporaryPassword?: string;
    };
    if (!email || !role) {
      res.status(400).json({ error: "email and role are required" });
      return;
    }

    const validRoles = ["admin", "editor", "viewer"];
    if (!validRoles.includes(role)) {
      res
        .status(400)
        .json({ error: `role must be one of: ${validRoles.join(", ")}` });
      return;
    }

    try {
      const result = await this.projectService.inviteMember(
        req.project!.id,
        email,
        role as any,
        temporaryPassword ?? "ChangeMe123!",
      );
      res.status(201).json(result);
    } catch (err: unknown) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : "Invite failed" });
    }
  }
}
