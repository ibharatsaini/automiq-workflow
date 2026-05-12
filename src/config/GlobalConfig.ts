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
}
