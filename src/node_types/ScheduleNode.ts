import cron from "node-cron";
import { BaseNode } from "./BaseNode";
import {
  IExecuteContext,
  INodeExecutionData,
  INodeTypeDescription,
  IScheduleConfig,
} from "../lib/types";

export class ScheduleNode extends BaseNode {
  readonly description: INodeTypeDescription = {
    name: "schedule",
    displayName: "Schedule Trigger",
    group: "trigger",
  };

  getScheduleConfig(parameters: Record<string, unknown>): IScheduleConfig {
    const expr = parameters["cronExpression"] as string | undefined;
    if (!expr) throw new Error('Schedule node is missing a "cronExpression" parameter');
    if (!cron.validate(expr)) {
      throw new Error(`Schedule node has an invalid cron expression: "${expr}"`);
    }
    return { cronExpression: expr };
  }

  /** Items injected into the execution stack each time the cron fires. */
  buildTriggerItems(): INodeExecutionData[] {
    return [{ json: { triggeredAt: new Date().toISOString() } }];
  }

  async execute(_context: IExecuteContext): Promise<INodeExecutionData[][]> {
    throw new Error("ScheduleNode.execute() should never be called by the engine");
  }
}
