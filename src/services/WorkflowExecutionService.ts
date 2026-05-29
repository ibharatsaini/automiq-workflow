// src/services/WorkflowExecutionService.ts
import { GlobalConfig } from "../config/GlobalConfig.js";
import { ExecutionRepository } from "../repositories/ExecutionRepository";
import { NodeTypes } from "../node-types/NodeTypes";
import { CredentialsService } from "./CredentialsService";
import { WorkflowExecute } from "./WorkfowExecute";
import {
  INodeExecutionData,
  IWorkflowDefinition,
  RunMode,
} from "../lib/types";

export interface IRunResult {
  executionId: string;
  status: "success" | "error";
  runData?: unknown;
  executionOrder?: string[];
  error?: string;
}

export class WorkflowExecutionService {
  constructor(
    private readonly config: GlobalConfig,
    private readonly executionRepo: ExecutionRepository,
    private readonly nodeTypes: NodeTypes,
    private readonly credentials: CredentialsService,
  ) {}

  async runWorkflow(
    workflow: IWorkflowDefinition,
    triggerNodeName: string,
    triggerItems: INodeExecutionData[],
    mode: RunMode,
    projectId: string,
  ): Promise<IRunResult> {
    const execution = await this.executionRepo.createRunning({
      workflowId: workflow.id,
      workflowName: workflow.name,
      mode,
      triggerNode: triggerNodeName,
      triggerItems,
      projectId,
    });
    const executionId = execution["id"] as string;

    return this.runInline(
      executionId,
      workflow,
      triggerNodeName,
      triggerItems,
      projectId,
    );
  }

  private async runInline(
    executionId: string,
    workflow: IWorkflowDefinition,
    triggerNodeName: string,
    triggerItems: INodeExecutionData[],
    projectId: string,
  ): Promise<IRunResult> {
    try {
      const engine = new WorkflowExecute(
        workflow,
        this.nodeTypes,
        this.credentials,
        projectId,
      );
      const { runData, executionOrder } = await engine.processRunExecutionData(
        triggerNodeName,
        triggerItems,
      );
      await this.executionRepo.markFinished(executionId, {
        status: "success",
        executionOrder,
        runData,
      });
      return { executionId, status: "success", runData, executionOrder };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const runData = (err as { runData?: unknown }).runData;
      await this.executionRepo.markFinished(executionId, {
        status: "error",
        error: message,
        runData: runData as any,
      });
      return { executionId, status: "error", error: message };
    }
  }

}
