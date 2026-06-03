import { GlobalConfig } from "../config/GlobalConfig";
import { AuthMiddleware } from "../middleware/AuthMiddleware";
import { ProjectMiddleware } from "../middleware/ProjectMiddleware";
import { CodeNode } from "../node-types/CodeNode";
import { IfNode } from "../node-types/IfNode";
import { NodeTypes } from "../node-types/NodeTypes";
import { ScheduleNode } from "../node-types/ScheduleNode";
import { SlackNode } from "../node-types/SlackNode";
import { TelegramNode } from "../node-types/TelegramNode";
import { WebhookNode } from "../node-types/WebhookNode";
import { CredentialsRepository } from "../repositories/CredentialsRepository";
import { ExecutionRepository } from "../repositories/ExecutionRepository";
import { ProjectMemberRepository } from "../repositories/ProjectMemberRepository";
import { ProjectRepository } from "../repositories/ProjectRepository";
import { UserRepository } from "../repositories/UserRepository";
import { WorkflowRepository } from "../repositories/WorkflowRepository";
import { AuthRouter } from "../routes/AuthRouter";
import { CredentialsRouter } from "../routes/CredentialsRouter";
import { ExecutionsRouter } from "../routes/ExecutionsRouter";
import { ProjectsRouter } from "../routes/ProjectsRouter";
import { WebhookRouter } from "../routes/WebhookRouter";
import { WorkflowsRouter } from "../routes/WorkflowsRouter";
import { CodeSandbox } from "../sandbox/CodeSandbox";
import { ScalingService } from "../scaling/ScalingService";
import { ActiveWorkflowManager } from "../services/ActiveWorkflowManager";
import { AuthService } from "../services/AuthService";
import { CredentialsService } from "../services/CredentialsService";
import { PrismaService } from "../services/PrismaService";
import { ProjectService } from "../services/ProjectService";
import { WorkflowExecutionService } from "../services/WorkflowExecutionService";

export class Container {
  readonly config: GlobalConfig;
  // Layer 1
  readonly prisma: PrismaService;
  readonly authService: AuthService;
  readonly projectService: ProjectService;
  readonly executionService: WorkflowExecutionService;
  readonly activeWorkflowMgr: ActiveWorkflowManager;
  readonly scalingService: ScalingService;

  //Nodes
  readonly webhookNode: WebhookNode;
  readonly scheduleNode: ScheduleNode;
  readonly ifNode: IfNode;
  readonly codeNode: CodeNode;
  readonly telegramNode: TelegramNode;
  readonly slackNode: SlackNode;


  //nodetypes
  readonly nodeTypes: NodeTypes;


  //sandbox
  readonly codeSandbox: CodeSandbox;

  //Routers
  readonly authRouter: AuthRouter;
  readonly projectsRouter: ProjectsRouter;
  readonly credRouter: CredentialsRouter;
  readonly workflowRouter: WorkflowsRouter;
  readonly webhookRouter:     WebhookRouter;
  readonly executionRouter: ExecutionsRouter;

  readonly authMiddleware: AuthMiddleware;
  readonly projectMiddleware: ProjectMiddleware;
  readonly credentialsService: CredentialsService;

  readonly userRepo: UserRepository;
  readonly projectRepo: ProjectRepository;
  readonly memeberRepo: ProjectMemberRepository;
  readonly credRepo: CredentialsRepository;
  readonly workflowRepo: WorkflowRepository;
  readonly executionRepo: ExecutionRepository;

  constructor() {
    this.config = new GlobalConfig();
    this.prisma = new PrismaService(this.config);

    this.codeSandbox = new CodeSandbox();

    this.webhookNode = new WebhookNode();
    this.scheduleNode = new ScheduleNode();
    this.ifNode = new IfNode();
    this.telegramNode = new TelegramNode(this.config);
    this.slackNode = new SlackNode(this.config);
    this.codeNode = new CodeNode(this.codeSandbox)

    this.nodeTypes = new NodeTypes(
      this.webhookNode,
      this.scheduleNode,
      this.ifNode,
      this.codeNode,
      this.telegramNode,
      this.slackNode,
    );

    this.userRepo = new UserRepository(this.prisma);
    this.projectRepo = new ProjectRepository(this.prisma);
    this.memeberRepo = new ProjectMemberRepository(this.prisma);
    this.credRepo = new CredentialsRepository(this.prisma);
    this.workflowRepo = new WorkflowRepository(this.prisma);
    this.executionRepo = new ExecutionRepository(this.prisma);

    this.authService = new AuthService(this.userRepo, this.config);
    this.projectService = new ProjectService(
      this.projectRepo,
      this.memeberRepo,
      this.userRepo,
    );
    this.credentialsService = new CredentialsService(
      this.credRepo,
      this.config,
    );
    this.scalingService = new ScalingService(this.config)
    this.executionService = new WorkflowExecutionService(
      this.config,
      this.executionRepo,
      this.nodeTypes,
      this.credentialsService,
      this.scalingService
    );
    this.activeWorkflowMgr = new ActiveWorkflowManager(
      this.workflowRepo,
      this.nodeTypes,
      this.executionService,
    );

    this.authMiddleware = new AuthMiddleware(this.authService);
    this.projectMiddleware = new ProjectMiddleware(this.projectService);

    this.authRouter = new AuthRouter(
      this.authService,
      this.authMiddleware,
      this.projectService,
    );
    this.projectsRouter = new ProjectsRouter(
      this.projectService,
      this.authMiddleware,
      this.projectMiddleware,
    );
    this.credRouter = new CredentialsRouter(
      this.credentialsService,
      this.authMiddleware,
      this.projectMiddleware,
    );
    this.workflowRouter = new WorkflowsRouter(
      this.workflowRepo,
      this.activeWorkflowMgr,
      this.executionService,
      this.nodeTypes,
      this.authMiddleware,
      this.projectMiddleware,
    );
    this.webhookRouter = new WebhookRouter(this.activeWorkflowMgr,this.workflowRepo,this.executionService,this.nodeTypes,this.projectMiddleware);
    this.executionRouter = new ExecutionsRouter(this.executionRepo,this.authMiddleware,this.projectMiddleware)


    this.authRouter.setup();
    this.projectsRouter.setup();
    this.workflowRouter.setup();
    this.webhookRouter.setup();
    this.executionRouter.setup();
    this.credRouter.setup();
  }
}
