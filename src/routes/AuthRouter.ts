import { Request, Response } from "express";
import { BaseRouter } from "./BaseRouter.js";
import { AuthService } from "../services/AuthService";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { ProjectService } from "../services/ProjectService";

export class AuthRouter extends BaseRouter {
  constructor(
    private readonly authService: AuthService,
    private readonly authMiddleware: AuthMiddleware,
    private readonly projectService: ProjectService,
  ) {
    super();
  }

  protected registerRoutes(): void {
    // Public
    this.router.post("/login", this.login.bind(this));
    // Creates user + project + subdomain in one step
    this.router.post("/register", this.register.bind(this));
    // Authenticated
    this.router.get(
      "/me",
      this.authMiddleware.authenticate,
      this.me.bind(this),
    );
  }

  private async login(req: Request, res: Response): Promise<void> {
    console.log(`Login inside.`)
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };
    if (!email || !password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }
    try {
      res.json(await this.authService.login(email, password));
    } catch (err: unknown) {
      res
        .status(401)
        .json({ error: err instanceof Error ? err.message : "Login failed" });
    }
  }

  private async register(req: Request, res: Response): Promise<void> {
    console.log(`inside this`);
    const { email, password, projectName, subdomain } = req.body as {
      email?: string;
      password?: string;
      projectName?: string;
      subdomain?: string;
    };

    if (!email || !password || !projectName || !subdomain) {
      res
        .status(400)
        .json({
          error: "email, password, projectName, and subdomain are required",
        });
      return;
    }

    try {
      // 1. Create the user account.
      console.log(`Auth router`);
      const user = await this.authService.register(email, password);
      console.log(`user router`);
      // 2. Create the project with the requested subdomain.
      const project = await this.projectService.createProject(
        projectName,
        subdomain,
        user.id,
      );

      res.status(201).json({
        user: { id: user.id, email: user.email },
        project: {
          id: project.id,
          name: project.name,
          subdomain: project.subdomain,
        },
        message: `Project created. Use subdomain "${project.subdomain}" in the X-Project-Subdomain header or as a DNS subdomain.`,
      });
    } catch (err: unknown) {
      res
        .status(400)
        .json({
          error: err instanceof Error ? err.message : "Registration failed",
        });
    }
  }

  private me(req: Request, res: Response): void {
    res.json(req.user);
  }
}
