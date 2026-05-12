import { BaseNode } from "./BaseNode";
import { renderTemplate } from "../lib/expression";
import { GlobalConfig } from "../config/GlobalConfig";
import {
  IExecuteContext,
  INodeExecutionData,
  INodeTypeDescription,
  ITelegramCredential,
} from "../lib/types";

export class TelegramNode extends BaseNode {
  readonly description: INodeTypeDescription = {
    name: "telegram",
    displayName: "Telegram",
    group: "action",
  };

  constructor(private readonly config: GlobalConfig) {
    super();
  }

  private async apiRequest(
    credential: ITelegramCredential,
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const baseUrl = credential.baseUrl ?? this.config.telegramApiBaseUrl;
    const url = `${baseUrl}/bot${credential.accessToken}/${endpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    if (!response.ok || data["ok"] === false) {
      throw new Error(`Telegram API error: ${String(data["description"] ?? response.statusText)}`);
    }
    return data;
  }

  async execute(context: IExecuteContext): Promise<INodeExecutionData[][]> {
    const inputItems = context.getInputData();
    const credential = (await context.getCredentials(
      "telegramApi",
    )) as unknown as ITelegramCredential;
    const chatId = context.getNodeParameter<string>("chatId");
    const textTpl = context.getNodeParameter<string>("text");

    const outputItems: INodeExecutionData[] = [];
    for (const item of inputItems) {
      const text = renderTemplate(textTpl, item);
      const result = await this.apiRequest(credential, "sendMessage", { chat_id: chatId, text });
      outputItems.push({ json: result });
    }
    return [outputItems];
  }
}
