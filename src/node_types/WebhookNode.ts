import { Request } from 'express';
import { BaseNode } from './BaseNode';
import { IExecuteContext, INodeExecutionData, INodeTypeDescription, IWebhookConfig } from '../lib/types';

export class WebhookNode extends BaseNode {
  readonly description: INodeTypeDescription = {
    name: 'webhook',
    displayName: 'Webhook',
    group: 'trigger',
  };

  /** Called by ActiveWorkflowManager to register the path/method. */
  getWebhookConfig(parameters: Record<string, unknown>): IWebhookConfig {
    const webhookPath = parameters['path'] as string | undefined;
    if (!webhookPath) throw new Error('Webhook node is missing a "path" parameter');
    return {
      path: webhookPath,
      method: String(parameters['method'] ?? 'POST').toUpperCase(),
      responseMode: (parameters['responseMode'] as 'lastNode' | 'immediately') ?? 'lastNode',
    };
  }

  /** Called by WebhookRouter to produce trigger items from a request. */
  webhookToItems(req: Request): INodeExecutionData[] {
    return [
      {
        json: {
          headers: req.headers as Record<string, unknown>,
          params: req.params as Record<string, unknown>,
          query: req.query as Record<string, unknown>,
          body: (req.body as Record<string, unknown>) ?? {},
        },
      },
    ];
  }

  /** Never called, just had to be here because of BaseNode inheritance — WebhookNode is a trigger, not executed by the engine. */
  async execute(_context: IExecuteContext): Promise<INodeExecutionData[][]> {
    throw new Error('WebhookNode.execute() should never be called by the engine as it is a tigger node');
  }
}
