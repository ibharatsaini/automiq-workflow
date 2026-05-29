import { BaseNode } from "./BaseNode";
import { resolveValue } from "../lib/expression";
import { IExecuteContext, INodeExecutionData, INodeTypeDescription } from "../lib/types";

type Operation =
  | "equals"
  | "notEquals"
  | "contains"
  | "notContains"
  | "greaterThan"
  | "lessThan"
  | "isEmpty"
  | "isNotEmpty";

export interface ICondition {
  leftValue: unknown;
  operation: Operation;
  rightValue?: unknown;
}

export class IfNode extends BaseNode {
  readonly description: INodeTypeDescription = {
    name: "if",
    displayName: "If",
    group: "transform",
    outputs: ["true", "false"], // two output ports
  };

  private evaluateCondition(item: INodeExecutionData, condition: ICondition): boolean {
    const left = resolveValue(condition.leftValue, item);
    const right = resolveValue(condition.rightValue, item);

    switch (condition.operation) {
      case "equals":
        return left === right;
      case "notEquals":
        return left !== right;
      case "contains":
        return String(left ?? "").includes(String(right ?? ""));
      case "notContains":
        return !String(left ?? "").includes(String(right ?? ""));
      case "greaterThan":
        return Number(left) > Number(right);
      case "lessThan":
        return Number(left) < Number(right);
      case "isEmpty":
        return left === undefined || left === null || left === "";
      case "isNotEmpty":
        return !(left === undefined || left === null || left === "");
      default:
        throw new Error(`IfNode: unsupported operation "${condition.operation as string}"`);
    }
  }

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputItems = context.getInputData();
    const conditions = context.getNodeParameter<ICondition[]>("conditions", []);
    const combinator = context.getNodeParameter<"AND" | "OR">("combinator", "AND");

    if (conditions.length === 0) {
      throw new Error("IfNode: at least one condition is required");
    }

    const trueItems: INodeExecutionData[] = [];
    const falseItems: INodeExecutionData[] = [];

    for (const item of inputItems) {
      const results = conditions.map((c) => this.evaluateCondition(item, c));
      const passed = combinator === "OR" ? results.some(Boolean) : results.every(Boolean);
      (passed ? trueItems : falseItems).push(item);
    }

    // Output 0 = true branch, Output 1 = false branch.
    return [trueItems, falseItems];
  }
}
