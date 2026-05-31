import { Request, Response }        from 'express';
import { BaseRouter }               from './BaseRouter';
import { ActiveWorkflowManager }    from '../services/ActiveWorkflowManager';
import { WorkflowRepository }       from '../repositories/WorkflowRepository';
import { WorkflowExecutionService } from '../services/WorkflowExecutionService';
import { NodeTypes }                from '../node-types/NodeTypes';
import { WebhookNode }              from '../node-types/WebhookNode';
import { ProjectMiddleware }        from '../middleware/ProjectMiddleware';

export class WebhookRouter extends BaseRouter {
  constructor(
    private readonly activeManager:    ActiveWorkflowManager,
    private readonly workflowRepo:     WorkflowRepository,
    private readonly executionService: WorkflowExecutionService,
    private readonly nodeTypes:        NodeTypes,
    private readonly projectMiddleware: ProjectMiddleware,
  ) { super(); }

  protected registerRoutes(): void {
    // resolveProject runs first to identify which project this subdomain belongs to.
    // No auth — webhooks are called by external services.
    this.router.all('/:path', this.projectMiddleware.resolveProject, this.handle.bind(this));
  }

  private async handle(req: Request, res: Response): Promise<void> {
    const method      = req.method.toUpperCase();
    const webhookPath = req.params['path']!;
    const subdomain   = req.project!.subdomain;

    const entry = this.activeManager.findWebhook(method, subdomain, webhookPath);
    if (!entry) {
      res.status(404).json({
        error: `No active workflow for ${method} /webhook/${webhookPath} on "${subdomain}"`,
      });
      return;
    }

    const workflow = await this.workflowRepo.findById(entry.workflowId, entry.projectId);
    if (!workflow) { res.status(500).json({ error: 'workflow not found' }); return; }

    const webhookNode  = this.nodeTypes.getByName('webhook') as WebhookNode;
    const triggerItems = webhookNode.webhookToItems(req);

    const result = await this.executionService.runWorkflow(
      workflow, entry.nodeName, triggerItems, 'webhook', entry.projectId,
    );

    if (result.status === 'error') {
      res.status(500).json({ error: result.error, executionId: result.executionId }); return;
    }

    if (entry.responseMode !== 'lastNode') {
      res.json({ executionId: result.executionId, status: 'success' }); return;
    }

    const order     = result.executionOrder ?? [];
    const lastNode  = order[order.length - 1];
    const runData   = result.runData as Record<string, { items?: Array<{ json: unknown }> }>;
    const lastItems = lastNode ? (runData[lastNode]?.items ?? []) : [];
    res.json(lastItems.length === 1 ? lastItems[0]?.json : lastItems.map(i => i.json));
  }
}
