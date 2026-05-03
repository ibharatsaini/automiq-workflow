

export interface INodeExecutionData {
  json: Record<string, unknown>;
}


export interface IConnection {
  node: string;
  type: 'main';
  index: number;
}

export interface IConnections {
  [nodeName: string]: {
    main: Array<IConnection[]>;
  };
}

export interface IWorkflowNode {
  id: string;
  name: string;
  /** Registry key — e.g. "webhook", "code", "if", "telegram" */
  type: string;
  parameters: Record<string, unknown>;
  /** credentialType → credentialId  e.g. { telegramApi: "uuid..." } */
  credentials?: Record<string, string>;
}

export interface IWorkflowSettings {
  timezone?: string;
  [key: string]: unknown;
}

export interface IWorkflowDefinition {
  id: string;
  name: string;
  active: boolean;
  nodes: IWorkflowNode[];
  connections: IConnections;
  settings?: IWorkflowSettings;
}


export interface IExecuteContext {
  getInputData(): INodeExecutionData[];
  getNodeParameter<T = unknown>(name: string, fallback?: T): T;
  getNode(): IWorkflowNode;
  /** Fetches + decrypts a credential by type. Async because it hits the DB. */
  getCredentials(type: string): Promise<Record<string, unknown>>;
}


export interface INodeTypeDescription {
  name: string;
  displayName: string;
  /** Used by ActiveWorkflowManager to know how to handle activation. */
  group: 'trigger' | 'transform' | 'action';
  /** Named output ports. Defaults to ['main']. If node must have two output["true","false"], declare it. */
  outputs?: string[];
}


export interface INodeType {
  description: INodeTypeDescription;
  execute(context: IExecuteContext): Promise<INodeExecutionData[][]>;
}




export interface IWebhookConfig {
  path:         string;
  method:       string;
  responseMode: 'immediately' | 'lastNode';
}

export interface IScheduleConfig {
  cronExpression: string;
}
