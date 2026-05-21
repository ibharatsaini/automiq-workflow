import { PrismaService }  from '../services/PrismaService.js';
import type { Credential } from '../generated/prisma/client/client';

export class CredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    id: string; name: string; type: string; data: string; projectId: string;
  }): Promise<Credential> {
    return this.prisma.credential.create({ data });
  }

  async findById(id: string, projectId: string): Promise<Credential | null> {
    return this.prisma.credential.findFirst({ where: { id, projectId } });
  }

  async findByType(type: string, projectId: string): Promise<Credential | null> {
    return this.prisma.credential.findFirst({ where: { type, projectId } });
  }

  async findAll(projectId: string): Promise<Pick<Credential, 'id' | 'name' | 'type' | 'createdAt'>[]> {
    return this.prisma.credential.findMany({
      where:   { projectId },
      select:  { id: true, name: true, type: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delete(id: string, projectId: string): Promise<void> {
    const row = await this.prisma.credential.findFirst({ where: { id, projectId } });
    if (!row) throw new Error('Credential not found');
    await this.prisma.credential.delete({ where: { id } });
  }
}
