import { GlobalConfig } from "../config/GlobalConfig";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { ProjectMiddleware } from "../middleware/ProjectMiddleware";
import { IfNode } from "../node_types/IfNode";
import { NodeTypes } from "../node_types/NodeTypes";
import { ScheduleNode } from "../node_types/ScheduleNode";
import { SlackNode } from "../node_types/SlackNode";
import { TelegramNode } from "../node_types/TelegramNode";
import { WebhookNode } from "../node_types/WebhookNode";
import { CredentialsRepository } from "../repositories/CredentialsRepository";
import { ProjectMemberRepository } from "../repositories/ProjectMemberRepository";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { UserRepository } from "../repositories/UserRepository";
import { AuthRouter } from "../routes/AuthRouter";
import { CredentialsRouter } from "../routes/CredentialsRouter";
import { ProjectsRouter } from "../routes/ProjectsRouter";
import { AuthService } from "../services/AuthService";
import { CredentialsService } from "../services/CredentialsService";
import { PrismaService } from "../services/PrismaService";
import { ProjectService } from "../services/ProjectService";

export class Container {
  readonly config: GlobalConfig;
  // Layer 1
  readonly prisma: PrismaService;
  readonly authService: AuthService;
  readonly projectService: ProjectService;

  //Nodes
  readonly webhookNode: WebhookNode;
  readonly scheduleNode: ScheduleNode;
  readonly ifNode: IfNode;
  readonly telegramNode: TelegramNode;
  readonly slackNode: SlackNode;

  //nodetypes
  readonly nodeTypes: NodeTypes;

  //Routers
  readonly authRouter: AuthRouter;
  readonly projectsRouter: ProjectsRouter;
  readonly credRouter: CredentialsRouter;

  readonly authMiddleware: AuthMiddleware;
  readonly projectMiddleware: ProjectMiddleware;
  readonly credentialsService: CredentialsService;

  readonly userRepo: UserRepository;
  readonly projectRepo: ProjectRepository;
  readonly memeberRepo: ProjectMemberRepository;
  readonly credRepo: CredentialsRepository;


  

  constructor() {
    this.config = new GlobalConfig();
    this.prisma = new PrismaService(this.config);

    this.webhookNode = new WebhookNode();
    this.scheduleNode = new ScheduleNode();
    this.ifNode = new IfNode();
    this.telegramNode = new TelegramNode(this.config);
    this.slackNode = new SlackNode(this.config);

    this.nodeTypes = new NodeTypes(
      this.webhookNode,
      this.scheduleNode,
      this.ifNode,
      this.telegramNode,
      this.slackNode,
    );

    this.userRepo = new UserRepository(this.prisma);
    this.projectRepo = new ProjectRepository(this.prisma)
    this.memeberRepo = new ProjectMemberRepository(this.prisma)
    this.credRepo = new CredentialsRepository(this.prisma)

    this.authService = new AuthService(this.userRepo, this.config);
    this.projectService= new ProjectService(this.projectRepo, this.memeberRepo, this.userRepo)
    this.credentialsService = new CredentialsService(this.credRepo, this.config)

    this.authMiddleware = new AuthMiddleware(this.authService);
    this.projectMiddleware = new ProjectMiddleware(this.projectService)


    this.authRouter = new AuthRouter(this.authService, this.authMiddleware, this.projectService);
    this.projectsRouter = new ProjectsRouter(this.projectService, this.authMiddleware, this.projectMiddleware)
    this.credRouter = new CredentialsRouter(this.credentialsService, this.authMiddleware, this.projectMiddleware)
  }
}
