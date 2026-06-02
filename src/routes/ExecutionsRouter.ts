// src/routes/ExecutionsRouter.ts
import { Request, Response } from 'express';
import { BaseRouter }          from './BaseRouter.js';
import { ExecutionRepository } from '../repositories/ExecutionRepository';
import { AuthMiddleware }      from '../middleware/AuthMiddleware';
import { ProjectMiddleware }   from '../middleware/ProjectMiddleware';

export class ExecutionsRouter extends BaseRouter {
  constructor(
    private readonly executionRepo:     ExecutionRepository,
    private readonly auth:              AuthMiddleware,
    private readonly projectMiddleware: ProjectMiddleware,
  ) { super(); }

  protected registerRoutes(): void {
    const authn = this.auth.authenticate;
    const proj  = this.projectMiddleware.resolveProject;
    const role  = this.projectMiddleware.loadProjectRole;
    const req   = this.auth.requiredRole.bind(this.auth);

    this.router.get('/',    [authn, proj, role, req('viewer')], this.list.bind(this));
    this.router.get('/:id', [authn, proj, role, req('viewer')], this.getOne.bind(this));
  }

  private async list(req: Request, res: Response): Promise<void> {
    const workflowId = req.query['workflowId'] as string | undefined;
    res.json(await this.executionRepo.findAll(req.project!.id, workflowId));
  }

  private async getOne(req: Request, res: Response): Promise<void> {
    const execution = await this.executionRepo.findById(req.params['id']!);
    if (!execution || execution['projectId'] !== req.project!.id) {
      res.status(404).json({ error: 'Not found' }); return;
    }
    res.json(execution);
  }
}
