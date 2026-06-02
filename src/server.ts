import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { Container } from "./lib/Container";

async function bootstrap(): Promise<void> {
  const container = new Container();

  await container.prisma.connect();
  console.log("[server] database connected!");
  // console.log

  const app = express();
  app.use(express.json());
  //   console.log(`lsdfj`)
  app.use("/auth", container.authRouter.router);
  app.use("/projects", container.projectsRouter.router)
  app.use('/workflows',   container.workflowRouter.router);
  app.use('/webhook', container.webhookRouter.router);
  app.use("/executions", container.executionRouter.router);
  app.use('/credentials', container.credRouter.router);


  app.get("/", (_, res) => {
    res.json({
      service: "automiq-api",
    });
  });

  const { port } = container.config;

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
