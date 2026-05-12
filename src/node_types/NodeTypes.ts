import { INodeType } from "../lib/types";
import { WebhookNode } from "./WebhookNode";
import { ScheduleNode } from "./ScheduleNode";
import { IfNode } from "./IfNode";
import { TelegramNode } from "./TelegramNode";
import { SlackNode } from "./SlackNode";

export class NodeTypes {
  private readonly registry = new Map<string, INodeType>();

  constructor(
    webhookNode: WebhookNode,
    scheduleNode: ScheduleNode,
    ifNode: IfNode,
    telegramNode: TelegramNode,
    slackNode: SlackNode,
  ) {
    this.register(webhookNode);
    this.register(scheduleNode);
    this.register(ifNode);
    this.register(telegramNode);
    this.register(slackNode);
  }

  private register(node: INodeType): void {
    this.registry.set(node.description.name, node);
  }

  /** Throws error if the type is not registered  */
  getByName(type: string): INodeType {
    const node = this.registry.get(type);
    if (!node) throw new Error(`Unknown node type: "${type}"`);
    return node;
  }

  getAll(): INodeType[] {
    return Array.from(this.registry.values());
  }
}
