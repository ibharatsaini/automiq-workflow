export type UserRole = "admin" | "editor" | "viewer";
export interface LoginResponse {
  token: string;
  user: AuthUser;
}
export interface RegisterResponse {
  user: AuthUser;
  project: Project;
  message: string;
}
export interface AuthUser {
  id: string;
  email: string;
  role?: UserRole;
}
export interface AuthState {
  token: string;
  user: AuthUser;
  subdomain: string;
  projectId: string;
  projectName: string;
}
export interface Project {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
}
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: UserRole;
  email?: string;
  createdAt: string;
}
export type NodeType =
  "webhook" | "schedule" | "code" | "if" | "telegram" | "slack";

export interface WorkflowNode {
  id: string;
  name: string;
  type: NodeType;
  parameters: Record<string, unknown>;
  credentials?: Record<string, string>;
}
export interface WorkflowConnection {
  node: string;
  type: "main";
  index: number;
}
export interface WorkflowConnections {
  [nodeName: string]: { main: Array<WorkflowConnection[]> };
}
export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: WorkflowNode[];
  connections: WorkflowConnections;
  settings?: Record<string, unknown>;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}
export interface NodeRunData {
  startedAt: string;
  finishedAt?: string;
  items?: Array<{ json: Record<string, unknown> }>;
  branches?: Array<Array<{ json: Record<string, unknown> }>>;
  error?: string;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  mode: ExecutionMode;
  status: ExecutionStatus;
  triggerNode?: string;
  executionOrder?: string[];
  runData?: Record<string, NodeRunData>;
  error?: string;
  projectId: string;
  startedAt: string;
  finishedAt?: string;
}
export interface Credential {
  id: string;
  name: string;
  type: string;
  createdAt: string;
}
export type ExecutionMode = "webhook" | "trigger" | "manual";
export type ExecutionStatus = "running" | "success" | "error";
export interface RunResult { executionId: string; status: 'success' | 'error'; runData?: Record<string, NodeRunData>; executionOrder?: string[]; error?: string }
