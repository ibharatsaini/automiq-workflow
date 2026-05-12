import { IExecuteContext, INodeExecutionData, INodeTypeDescription } from "../lib/types";

export abstract class BaseNode {
  abstract readonly description: INodeTypeDescription;

  //Runs node logic with its input
  abstract execute(context: IExecuteContext): Promise<INodeExecutionData[][]>;

  // Transforms responses or output into expected form of object. **SHOULD NOT BE CALLED BY TRIGGER NODES**
  protected standardizeOutput(result: unknown): INodeExecutionData[] {
    if (Array.isArray(result)) {
      return result.map((entry) =>
        entry && typeof entry === "object" && "json" in (entry as object)
          ? (entry as INodeExecutionData)
          : { json: entry as Record<string, unknown> },
      );
    }
    if (result && typeof result === "object" && "json" in (result as object)) {
      return [result as INodeExecutionData];
    }
    if (result && typeof result === "object") {
      return [{ json: result as Record<string, unknown> }];
    }
    return [{ json: { value: result ?? null } }];
  }
}
