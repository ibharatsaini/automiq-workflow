import { Request, Response } from "express";
import { BaseRouter } from "./BaseRouter.js";
import { WorkflowRepository } from "../repositories/WorkflowRepository";
import { ActiveWorkflowManager } from "../services/ActiveWorkflowManager";
import { WorkflowExecutionService } from "../services/WorkflowExecutionService";
import { NodeTypes } from "../node-types/NodeTypes";
import { ScheduleNode } from "../node-types/ScheduleNode";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { ProjectMiddleware } from "../middleware/ProjectMiddleware";

export class WorkflowsRouter extends BaseRouter {
  constructor(
    private readonly workflowRepo: WorkflowRepository,
    private readonly activeManager: ActiveWorkflowManager,
    private readonly executionService: WorkflowExecutionService,
    private readonly nodeTypes: NodeTypes,
    private readonly auth: AuthMiddleware,
    private readonly projectMiddleware: ProjectMiddleware,
  ) {
    super();
  }

  protected registerRoutes(): void {
    const authn = this.auth.authenticate;
    const proj = this.projectMiddleware.resolveProject;
    const role = this.projectMiddleware.loadProjectRole;
    const reqRole = this.auth.requiredRole.bind(this.auth);

    this.router.get(
      "/",
      [authn, proj, role, reqRole("viewer")],
      this.list.bind(this),
    );
    this.router.get(
      "/:id",
      [authn, proj, role, reqRole("viewer")],
      this.getOne.bind(this),
    );
    this.router.post(
      "/",
      [authn, proj, role, reqRole("editor")],
      this.create.bind(this),
    );
    this.router.post(
      "/:id/activate",
      [authn, proj, role, reqRole("editor")],
      this.activate.bind(this),
    );
    this.router.post(
      "/:id/deactivate",
      [authn, proj, role, reqRole("editor")],
      this.deactivate.bind(this),
    );
    this.router.post(
      "/:id/test",
      [authn, proj, role, reqRole("editor")],
      this.test.bind(this),
    );
    this.router.delete(
      "/:id",
      [authn, proj, role, reqRole("admin")],
      this.remove.bind(this),
    );
  }

  private projectId(req: Request): string {
    return req.project!.id;
  }

  private async list(req: Request, res: Response): Promise<void> {
    res.json(await this.workflowRepo.findAll(this.projectId(req)));
  }

  private async getOne(req: Request, res: Response): Promise<void> {
    const wf = await this.workflowRepo.findById(
      req.params["id"]!,
      this.projectId(req),
    );
    if (!wf) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(wf);
  }

  private async create(req: Request, res: Response): Promise<void> {
    const { name, nodes, connections, settings } = req.body as any;
    if (!name || !nodes || !connections) {
      res.status(400).json({ error: "name, nodes, and connections required" });
      return;
    }
    res
      .status(201)
      .json(
        await this.workflowRepo.create({
          name,
          nodes,
          connections,
          settings,
          projectId: this.projectId(req),
        }),
      );
  }

  private async activate(req: Request, res: Response): Promise<void> {
    try {
      const proj = req.project!;
      const result = await this.activeManager.activate(
        req.params["id"]!,
        proj.id,
        proj.subdomain,
      );
      res.json({ active: true, ...result });
    } catch (err: unknown) {
      res
        .status(400)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  }

  private async deactivate(req: Request, res: Response): Promise<void> {
    await this.activeManager.deactivate(req.params["id"]!);
    res.json({ active: false });
  }

  private async test(req: Request, res: Response): Promise<void> {
    const wf = await this.workflowRepo.findById(
      req.params["id"]!,
      this.projectId(req),
    );
    if (!wf) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const triggerNode = wf.nodes.find(
      (n) => n.type === "webhook" || n.type === "schedule",
    );
    if (!triggerNode) {
      res.status(400).json({ error: "No trigger node" });
      return;
    }

    const items =
      triggerNode.type === "schedule"
        ? (
            this.nodeTypes.getByName("schedule") as ScheduleNode
          ).buildTriggerItems()
        : [{ json: (req.body as Record<string, unknown>) ?? {} }];

    const result = await this.executionService.runWorkflow(
      wf,
      triggerNode.name,
      items,
      "manual",
      this.projectId(req),
    );
    res.status(result.status === "success" ? 200 : 500).json(result);
  }

  private async remove(req: Request, res: Response): Promise<void> {
    const wf = await this.workflowRepo.findById(
      req.params["id"]!,
      this.projectId(req),
    );
    if (wf?.active) await this.activeManager.deactivate(wf.id);
    await this.workflowRepo.delete(req.params["id"]!, this.projectId(req));
    res.status(204).end();
  }
}
