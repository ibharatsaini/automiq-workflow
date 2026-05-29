import {
  IExecuteContext, INodeExecutionData, INodeType,
  IRunData, IRunExecutionResult, IWorkflowDefinition, IWorkflowNode,
} from '../lib/types';
import { NodeTypes }          from '../node-types/NodeTypes';
import { CredentialsService } from './CredentialsService';

export class WorkflowExecute {
  private readonly nodeExecutionStack: Array<{ nodeName: string; inputItems: INodeExecutionData[] }> = [];
  private readonly runData: IRunData = {};
  private readonly executionOrder: string[] = [];

  constructor(
    private readonly workflow:           IWorkflowDefinition,
    private readonly nodeTypes:          NodeTypes,
    private readonly credentialsService: CredentialsService,
    private readonly projectId:          string,
  ) {}

  private buildContext(node: IWorkflowNode, inputItems: INodeExecutionData[]): IExecuteContext {
    const self = this;
    return {
      getInputData: () => inputItems,
      getNode:      () => node,
      getNodeParameter<T>(name: string, fallback?: T): T {
        const value = node.parameters?.[name];
        return (value === undefined ? fallback : value) as T;
      },
      async getCredentials(type: string): Promise<Record<string, unknown>> {
        const credId = node.credentials?.[type];
        if (!credId) throw new Error(`Node "${node.name}" has no "${type}" credential`);
        return self.credentialsService.getDecrypted(credId, self.projectId);
      },
    };
  }

  private findNode(name: string): IWorkflowNode {
    const node = this.workflow.nodes.find(n => n.name === name);
    if (!node) throw new Error(`Node "${name}" not found`);
    return node;
  }

  private enqueueDownstream(nodeName: string, outputBranches: INodeExecutionData[][]): void {
    const connectionsByOutput = (this.workflow.connections[nodeName] ?? {}).main ?? [];
    connectionsByOutput.forEach((branchConnections, outputIndex) => {
      const items = outputBranches[outputIndex] ?? [];
      if (items.length === 0) return;
      for (const conn of branchConnections ?? []) {
        this.nodeExecutionStack.push({ nodeName: conn.node, inputItems: items });
      }
    });
  }

  async processRunExecutionData(
    startNodeName: string,
    triggerItems:  INodeExecutionData[],
  ): Promise<IRunExecutionResult> {
    const startedAt = new Date().toISOString();
    this.runData[startNodeName] = { startedAt, finishedAt: startedAt, items: triggerItems, branches: [triggerItems] };
    this.executionOrder.push(startNodeName);
    this.enqueueDownstream(startNodeName, [triggerItems]);

    while (this.nodeExecutionStack.length > 0) {
      const { nodeName, inputItems } = this.nodeExecutionStack.shift()!;
      const node:     IWorkflowNode = this.findNode(nodeName);
      const nodeType: INodeType     = this.nodeTypes.getByName(node.type);
      const nodeStartedAt = new Date().toISOString();

      let outputBranches: INodeExecutionData[][];
      try {
        outputBranches = await nodeType.execute(this.buildContext(node, inputItems));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.runData[nodeName] = { startedAt: nodeStartedAt, error: message };
        const wrapped = new Error(`Node "${nodeName}" failed: ${message}`);
        (wrapped as any).runData  = this.runData;
        (wrapped as any).nodeName = nodeName;
        throw wrapped;
      }

      this.runData[nodeName] = {
        startedAt: nodeStartedAt, finishedAt: new Date().toISOString(),
        items: outputBranches[0] ?? [], branches: outputBranches,
      };
      this.executionOrder.push(nodeName);
      this.enqueueDownstream(nodeName, outputBranches);
    }

    return { runData: this.runData, executionOrder: this.executionOrder };
  }
}
