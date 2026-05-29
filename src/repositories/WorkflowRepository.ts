import { PrismaService }      from '../services/PrismaService.js';
import { IWorkflowDefinition } from '../lib/types.js';
import type { Workflow }      from '../generated/prisma/client/client';

function toDefinition(row: Workflow): IWorkflowDefinition {
  return {
    id:          row.id,
    name:        row.name,
    active:      row.active,
    nodes:       row.nodes as any,
    connections: row.connections as any,
    settings:    row.settings as any,
  };
}

export class WorkflowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, projectId: string): Promise<IWorkflowDefinition | null> {
    const row = await this.prisma.workflow.findFirst({ where: { id, projectId } });
    return row ? toDefinition(row) : null;
  }

  async findAll(projectId: string): Promise<Workflow[]> {
    return this.prisma.workflow.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllActiveIds(projectId: string): Promise<string[]> {
    const rows = await this.prisma.workflow.findMany({
      where: { projectId, active: true },
      select: { id: true },
    });
    return rows.map(r => r.id);
  }

  async create(data: {
    name: string;
    nodes: unknown;
    connections: unknown;
    settings?: unknown;
    projectId: string;
  }): Promise<Workflow> {
    return this.prisma.workflow.create({
      data: {
        name:        data.name,
        projectId:   data.projectId,
        nodes:       data.nodes       as any,
        connections: data.connections as any,
        settings:    (data.settings ?? {}) as any,
      },
    });
  }

  async update(id: string, data: Partial<{
    name: string; active: boolean; nodes: unknown;
    connections: unknown; settings: unknown;
  }>): Promise<Workflow> {
    return this.prisma.workflow.update({
      where: { id },
      data:  data as any,
    });
  }

  async delete(id: string, projectId: string): Promise<void> {
    const row = await this.prisma.workflow.findFirst({ where: { id, projectId } });
    if (!row) throw new Error('Workflow not found');
    await this.prisma.execution.deleteMany({ where: { workflowId: id } });
    await this.prisma.workflow.delete({ where: { id } });
  }

}
