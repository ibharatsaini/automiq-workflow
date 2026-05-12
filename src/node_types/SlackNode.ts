import { BaseNode } from "./BaseNode";
import { renderTemplate } from "../lib/expression";
import { GlobalConfig } from "../config/GlobalConfig";
import {
  IExecuteContext,
  INodeExecutionData,
  INodeTypeDescription,
} from "../lib/types";

interface SlackCredential {
  botToken: string;
  baseUrl?: string;
}

export class SlackNode extends BaseNode {
  readonly description: INodeTypeDescription = {
    name: "slack",
    displayName: "Slack",
    group: "action",
  };

  constructor(private readonly config: GlobalConfig) {
    super();
  }

  private async apiRequest(
    credential: SlackCredential,
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const baseUrl = credential.baseUrl ?? this.config.slackApiBaseUrl;
    const url = `${baseUrl}/${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${credential.botToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!response.ok || data["ok"] === false) {
      throw new Error(
        `Slack API error: ${String(data["error"] ?? response.statusText)}`,
      );
    }
    return data;
  }

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputItems = context.getInputData();
    const credential = (await context.getCredentials(
      "slackApi",
    )) as unknown as SlackCredential;
    const channel = context.getNodeParameter<string>("channel");
    const textTpl = context.getNodeParameter<string>("text");

    const outputItems: INodeExecutionData[] = [];
    for (const item of inputItems) {
      const text = renderTemplate(textTpl, item);
      const result = await this.apiRequest(credential, "chat.postMessage", {
        channel,
        text,
      });
      outputItems.push({ json: result });
    }
    return [outputItems];
  }
}
