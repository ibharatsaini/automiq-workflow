import { PrismaService } from "../services/PrismaService";
import { IUser } from "../lib/auth.types";
import type { User } from "../generated/prisma/client/client";

function toUser(row: User): IUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
  };
}

export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<IUser | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const row = await this.prisma.user.findUnique({ where: { email } });
    return row ? toUser(row) : null;
  }

  async create(data: { email: string; passwordHash: string }): Promise<IUser> {
    const row = await this.prisma.user.create({ data });
    return toUser(row);
  }

  async hasAnyUser(): Promise<boolean> {
    const count = await this.prisma.user.count();
    return count > 0;
  }
}
