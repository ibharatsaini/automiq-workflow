import { Request, Response } from 'express';
import { BaseRouter }         from './BaseRouter.js';
import { CredentialsService } from '../services/CredentialsService';
import { AuthMiddleware }     from '../middleware/AuthMiddleware';
import { ProjectMiddleware }  from '../middleware/ProjectMiddleware';

export class CredentialsRouter extends BaseRouter {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly auth:               AuthMiddleware,
    private readonly projectMiddleware:  ProjectMiddleware,
  ) { super(); }

  protected registerRoutes(): void {
    const authn = this.auth.authenticate;
    const project  = this.projectMiddleware.resolveProject;
    const userRole  = this.projectMiddleware.loadProjectRole;
    const reqRole   = this.auth.requiredRole.bind(this.auth);

    this.router.get('/',       authn, project, userRole, reqRole('viewer'), this.list.bind(this));
    this.router.post('/',      authn, project, userRole, reqRole('editor'), this.create.bind(this));
    this.router.delete('/:id', authn, project, userRole, reqRole('admin'),  this.remove.bind(this));
  }

  private async list(req: Request, res: Response): Promise<void> {
    res.json(await this.credentialsService.list(req.project!.id));
  }

  private async create(req: Request, res: Response): Promise<void> {
    const { name, type, data } = req.body as {
      name?: string; type?: string; data?: Record<string, unknown>;
    };
    if (!name || !type || !data) {
      res.status(400).json({ error: 'name, type, and data are required' }); return;
    }
    res.status(201).json(
      await this.credentialsService.create(name, type, data, req.project!.id),
    );
  }

  private async remove(req: Request, res: Response): Promise<void> {
    await this.credentialsService.delete(req.params['id']!, req.project!.id);
    res.status(204).end();
  }
}
