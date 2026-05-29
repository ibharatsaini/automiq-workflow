import cron, { ScheduledTask } from 'node-cron';
import { WorkflowRepository }        from '../repositories/WorkflowRepository';
import { NodeTypes }                 from '../node-types/NodeTypes';
import { WorkflowExecutionService }  from './WorkflowExecutionService';
import { WebhookNode }               from '../node-types/WebhookNode';
import { ScheduleNode }              from '../node-types/ScheduleNode';
import { IWorkflowDefinition, IWebhookConfig } from '../lib/types';

interface IRegisteredWebhook extends IWebhookConfig {
  workflowId: string;
  projectId:  string;
  subdomain:  string;
  nodeName:   string;
}

interface IScheduledJob { nodeName: string; task: ScheduledTask; }

export class ActiveWorkflowManager {
  // Registry key is now "METHOD:subdomain:path" — isolates webhooks per project.
  private readonly webhookRegistry  = new Map<string, IRegisteredWebhook>();
  private readonly scheduledJobsMap = new Map<string, IScheduledJob[]>();

  constructor(
    private readonly workflowRepo:    WorkflowRepository,
    private readonly nodeTypes:       NodeTypes,
    private readonly executionService: WorkflowExecutionService,
  ) {}

  private static key(method: string, subdomain: string, path: string): string {
    return `${method.toUpperCase()}:${subdomain}:${path}`;
  }

  async init(projectId: string, subdomain: string): Promise<void> {
    const ids = await this.workflowRepo.findAllActiveIds(projectId);
    for (const id of ids) {
      try { await this.activate(id, projectId, subdomain); }
      catch (err: unknown) {
        console.error(`[AWM] failed to re-activate "${id}": ${err instanceof Error ? err.message : err}`);
      }
    }
    console.log(`[AWM] activated ${ids.length} workflow(s) for "${subdomain}"`);
  }

  async activate(
    workflowId: string, projectId: string, subdomain: string,
  ): Promise<{ webhooks: IWebhookConfig[]; schedules: string[] }> {
    const workflow = await this.workflowRepo.findById(workflowId, projectId);
    if (!workflow) throw new Error(`Workflow "${workflowId}" not found`);

    const triggerNodes = workflow.nodes.filter(n => n.type === 'webhook' || n.type === 'schedule');
    if (!triggerNodes.length) throw new Error('Workflow has no trigger node');

    const registeredWebhooks: IWebhookConfig[] = [];
    const registeredSchedules: string[]         = [];
    const rollbackKeys: string[]                = [];
    const rollbackJobs: IScheduledJob[]         = [];

    try {
      for (const node of triggerNodes) {
        if (node.type === 'webhook') {
          const wn = this.nodeTypes.getByName('webhook') as WebhookNode;
          const cfg = wn.getWebhookConfig(node.parameters);
          const k   = ActiveWorkflowManager.key(cfg.method, subdomain, cfg.path);

          const existing = this.webhookRegistry.get(k);
          if (existing && existing.workflowId !== workflowId) {
            throw new Error(`Webhook ${cfg.method} /webhook/${cfg.path} already registered`);
          }
          this.webhookRegistry.set(k, { ...cfg, workflowId, projectId, subdomain, nodeName: node.name });
          rollbackKeys.push(k);
          registeredWebhooks.push(cfg);
        }

        if (node.type === 'schedule') {
          const sn = this.nodeTypes.getByName('schedule') as ScheduleNode;
          const { cronExpression } = sn.getScheduleConfig(node.parameters);
          const task = cron.schedule(cronExpression, () => {
            this.executionService.runWorkflow(workflow, node.name, sn.buildTriggerItems(), 'trigger', projectId)
              .catch(err => console.error(`[AWM] scheduled run failed: ${err}`));
          });
          const job: IScheduledJob = { nodeName: node.name, task };
          const jobs = this.scheduledJobsMap.get(workflowId) ?? [];
          jobs.push(job); this.scheduledJobsMap.set(workflowId, jobs);
          rollbackJobs.push(job);
          registeredSchedules.push(cronExpression);
        }
      }
    } catch (err) {
      for (const k of rollbackKeys)   this.webhookRegistry.delete(k);
      for (const j of rollbackJobs)   j.task.stop();
      this.scheduledJobsMap.delete(workflowId);
      throw err;
    }

    await this.workflowRepo.update(workflowId, { active: true });
    return { webhooks: registeredWebhooks, schedules: registeredSchedules };
  }

  async deactivate(workflowId: string): Promise<void> {
    for (const [k, e] of this.webhookRegistry.entries()) {
      if (e.workflowId === workflowId) this.webhookRegistry.delete(k);
    }
    for (const j of this.scheduledJobsMap.get(workflowId) ?? []) j.task.stop();
    this.scheduledJobsMap.delete(workflowId);
    await this.workflowRepo.update(workflowId, { active: false });
  }

  findWebhook(method: string, subdomain: string, path: string): IRegisteredWebhook | undefined {
    return this.webhookRegistry.get(ActiveWorkflowManager.key(method, subdomain, path));
  }
}
