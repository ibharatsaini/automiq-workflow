import { PrismaService } from '../services/PrismaService';
import { IRunData, RunMode, RunStatus } from '../lib/types';
import type { Execution } from '../generated/prisma/client/client';

export class ExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createRunning(params: {
    workflowId:   string;
    workflowName: string;
    mode:         RunMode;
    triggerNode:  string;
    triggerItems: unknown;
    projectId:    string;
  }): Promise<Execution> {
    return this.prisma.execution.create({
      data: {
        workflowId:   params.workflowId,
        workflowName: params.workflowName,
        mode:         params.mode,
        status:       'running',
        triggerNode:  params.triggerNode,
        triggerItems: params.triggerItems as any,
        projectId:    params.projectId,
      },
    });
  }

  async markFinished(id: string, result: {
    status:         RunStatus;
    executionOrder?: string[];
    runData?:       IRunData;
    error?:         string;
  }): Promise<Execution> {
    return this.prisma.execution.update({
      where: { id },
      data: {
        status:         result.status,
        executionOrder: result.executionOrder as any ?? undefined,
        runData:        result.runData        as any ?? undefined,
        error:          result.error,
        finishedAt:     new Date(),
      },
    });
  }

  async findById(id: string): Promise<Execution | null> {
    return this.prisma.execution.findUnique({ where: { id } });
  }

  async findAll(projectId: string, workflowId?: string): Promise<Execution[]> {
    return this.prisma.execution.findMany({
      where: workflowId ? { projectId, workflowId } : { projectId },
      orderBy: { startedAt: 'desc' },
      take: 300,
    });
  }

  async markAsCrashed(ids: string[]): Promise<void> {
    await this.prisma.execution.updateMany({
      where: { id: { in: ids }, status: 'running' },
      data:  { status: 'error', error: 'Worker crashed', finishedAt: new Date() },
    });
  }
}
