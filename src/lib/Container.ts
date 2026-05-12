import { GlobalConfig } from "../config/GlobalConfig";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { IfNode } from "../node_types/IfNode";
import { NodeTypes } from "../node_types/NodeTypes";
import { ScheduleNode } from "../node_types/ScheduleNode";
import { SlackNode } from "../node_types/SlackNode";
import { TelegramNode } from "../node_types/TelegramNode";
import { WebhookNode } from "../node_types/WebhookNode";
import { UserRepository } from "../repositories/UserRepository";
import { AuthRouter } from "../routes/AuthRouter";
import { AuthService } from "../services/AuthService";
import { PrismaService } from "../services/PrismaService";

export class Container {
  readonly config: GlobalConfig;
  // Layer 1
  readonly prisma: PrismaService;
  readonly authService: AuthService;

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

  readonly authMiddleware: AuthMiddleware;

  readonly userRepo: UserRepository;

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

    this.authService = new AuthService(this.userRepo, this.config);
    this.authMiddleware = new AuthMiddleware(this.authService);

    this.authRouter = new AuthRouter(this.authService, this.authMiddleware);
  }
}
