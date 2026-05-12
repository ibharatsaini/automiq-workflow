import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client/client";
import { GlobalConfig } from "../config/GlobalConfig.js";

export class PrismaService extends PrismaClient {
  private readonly pool: Pool;

  constructor(config: GlobalConfig) {
    const pool = new Pool({
      connectionString: config.databaseUrl,
    });

    const adapter = new PrismaPg(pool);

    super({ adapter });

    this.pool = pool;
  }

  async connect(): Promise<void> {
    await this.$connect();
  }

  async disconnect(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
