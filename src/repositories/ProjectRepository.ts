import { PrismaService } from "../services/PrismaService";
import { IProject } from "../lib/project.types";
import type { Project } from "../generated/prisma/client/client";

function toProject(row: Project): IProject {
  return {
    id: row.id,
    name: row.name,
    subdomain: row.subdomain,
    createdAt: row.createdAt.toISOString(),
  };
}

export class ProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { name: string; subdomain: string }): Promise<IProject> {
    const row = await this.prisma.project.create({ data });
    return toProject(row);
  }

  async findById(id: string): Promise<IProject | null> {
    const row = await this.prisma.project.findUnique({ where: { id } });
    return row ? toProject(row) : null;
  }

  async findBySubdomain(subdomain: string): Promise<IProject | null> {
    const row = await this.prisma.project.findUnique({ where: { subdomain } });
    return row ? toProject(row) : null;
  }

  async subdomainExists(subdomain: string): Promise<boolean> {
    const count = await this.prisma.project.count({ where: { subdomain } });
    return count > 0;
  }

  async findAll(): Promise<IProject[]> {
    const rows = await this.prisma.project.findMany({
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toProject);
  }
}
