import { PrismaService }        from '../services/PrismaService.js';
import { IProjectMember }       from '../lib/project.types.js';
import { UserRole }             from '../lib/auth.types.js';
import type { ProjectMember }   from '../generated/prisma/client/client';

function toMember(row: ProjectMember & { user?: { email: string } }): IProjectMember & { email?: string } {
  return {
    id:        row.id,
    projectId: row.projectId,
    userId:    row.userId,
    role:      row.role as UserRole,
    createdAt: row.createdAt.toISOString(),
    email:     row.user?.email,
  };
}

export class ProjectMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(data: { projectId: string; userId: string; role: UserRole }): Promise<IProjectMember> {
    const row = await this.prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: data.projectId, userId: data.userId } },
      update: { role: data.role },
      create: data,
    });
    return toMember(row);
  }

  async findByProjectAndUser(projectId: string, userId: string): Promise<IProjectMember | null> {
    const row = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return row ? toMember(row) : null;
  }

  async findAllByProject(projectId: string): Promise<Array<IProjectMember & { email?: string }>> {
    const rows = await this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toMember);
  }

  async remove(projectId: string, userId: string): Promise<void> {
    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });
  }
}
