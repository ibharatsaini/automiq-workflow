export class GlobalConfig {
  // ── Database
  get databaseUrl(): string {
    return (
      process.env.DATABASE_URL ??
      "postgresql://n8nclone:automiq@localhost:5432/n8nclone"
    );
  }

  // ── Node Server Port
  get port(): number {
    return Number(process.env.PORT ?? 5678); 
  }

  get slackApiBaseUrl(): string {
    return process.env.SLACK_API_BASE_URL ?? "https://slack.com/api";
  }

  get telegramApiBaseUrl(): string {
    return process.env.TELEGRAM_API_BASE_URL ?? "https://api.telegram.org";
  }

  get jwtSecret(): string {
    return process.env["JWT_SECRET"] ?? "dev-secret-change-in-production";
  }



  get encryptionKey(): string | undefined {
    return process.env.ENCRYPTION_KEY;
  }

  get executionsMode(): 'regular' | 'queue' {
    return process.env.EXECUTIONS_MODE === 'queue' ? 'queue' : 'regular';
  }

  get bullQueueName(): string {
    return process.env.BULL_QUEUE_NAME ?? 'automiq-clone:execute-workflow';
  }

   get redisHost(): string {
    return process.env.REDIS_HOST ?? '127.0.0.1';
  }

  get redisPort(): number {
    return Number(process.env.REDIS_PORT ?? 6379);
  }

  
}
