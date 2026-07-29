import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { Container } from "./lib/Container";

async function bootstrap(): Promise<void> {
  const container = new Container();
  const { port, corsOrigins } = container.config;
  await container.prisma.connect();
  console.log("[server] database connected!");
  // console.log

  const app = express();
  app.use(express.json());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        console.log(
          `Hello1`,
          origin,
          corsOrigins,
          corsOrigins.includes(origin),
        );
        if (corsOrigins.includes(origin)) {
          console.log(`Hello`, origin);
          return callback(null, true);
        }

        callback(new Error(`CORS: origin "${origin}" not allowed`));
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Project-Subdomain"],
      credentials: true,
    }),
  );
  //   console.log(`lsdfj`)
  app.use("/auth", container.authRouter.router);
  app.use("/projects", container.projectsRouter.router);
  app.use("/workflows", container.workflowRouter.router);
  app.use("/webhook", container.webhookRouter.router);
  app.use("/executions", container.executionRouter.router);
  app.use("/credentials", container.credRouter.router);

  app.get("/", (_, res) => {
    res.json({
      service: "automiq-api",
    });
  });

  app.listen(port, () => {
    console.log(`[server] http://localhost:${port}`);
  });

  process.on("SIGTERM", async () => {
    await container.prisma.disconnect();
    process.exit(0);
  });
}

bootstrap().catch((err: unknown) => {
  console.error("[server] fatal:", err);
  process.exit(1);
});
