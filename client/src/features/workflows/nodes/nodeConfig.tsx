import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Webhook, Clock, Code, GitBranch, Send, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NodeType } from "@/types";

export interface NodeConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  group: "trigger" | "transform" | "action";
}

export const NODE_CONFIGS: Record<NodeType, NodeConfig> = {
  webhook: {
    label: "Webhook",
    icon: Webhook,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/50",
    border: "border-blue-200 dark:border-blue-800",
    gradient: "from-blue-500 to-blue-600",
    group: "trigger",
  },
  schedule: {
    label: "Schedule",
    icon: Clock,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/50",
    border: "border-violet-200 dark:border-violet-800",
    gradient: "from-violet-500 to-purple-600",
    group: "trigger",
  },
  code: {
    label: "Code",
    icon: Code,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/50",
    border: "border-slate-200 dark:border-slate-700",
    gradient: "from-slate-500 to-slate-600",
    group: "transform",
  },
  if: {
    label: "If/Else",
    icon: GitBranch,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    border: "border-amber-200 dark:border-amber-800",
    gradient: "from-amber-500 to-orange-500",
    group: "transform",
  },
  telegram: {
    label: "Telegram",
    icon: Send,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/50",
    border: "border-sky-200 dark:border-sky-800",
    gradient: "from-sky-500 to-cyan-600",
    group: "action",
  },
  slack: {
    label: "Slack",
    icon: Hash,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/50",
    border: "border-emerald-200 dark:border-emerald-800",
    gradient: "from-emerald-500 to-teal-600",
    group: "action",
  },
};

interface FlowNodeData {
  label: string;
  type: NodeType;
  parameters: Record<string, unknown>;
  isSelected?: boolean;
}

export const FlowNode = memo(
  ({ data, selected }: NodeProps & { data: FlowNodeData }) => {
    const cfg = NODE_CONFIGS[data.type] ?? NODE_CONFIGS.code;
    const Icon = cfg.icon;
    const isTrigger = cfg.group === "trigger";
    const isIf = data.type === "if";

    const subtitle = () => {
      if (data.type === "webhook")
        return `${data.parameters.method ?? "POST"} /${data.parameters.path ?? ""}`;
      if (data.type === "schedule")
        return String(data.parameters.cronExpression ?? "");
      if (data.type === "code") return "JavaScript";
      if (data.type === "if")
        return `${(data.parameters.conditions as unknown[])?.length ?? 0} condition(s)`;
      if (data.type === "telegram")
        return `Chat ${data.parameters.chatId ?? ""}`;
      if (data.type === "slack") return String(data.parameters.channel ?? "");
      return "";
    };

    return (
      <div
        className={cn(
          "relative rounded-2xl border-2 bg-card shadow-md min-w-[100px] max-w-[230px] transition-all duration-150",
          selected
            ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
            : cfg.border,
          "hover:shadow-lg hover:scale-[1.01]",
        )}
      >
        {!isTrigger && (
          <Handle
            type="target"
            position={Position.Left}
            className="!h-3.5 !w-3.5 !border-2 !border-card !bg-primary !shadow-sm"
          />
        )}

        <div className="px-3 py-2">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                cfg.bg,
              )}
            >
              <Icon className={cn("h-4 w-4", cfg.color)} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate text-foreground">
                {data.label}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                {cfg.label}
              </p>
            </div>
          </div>
          {subtitle() && (
            <div className="mt-2.5 rounded-lg bg-muted/70 px-2.5 py-1.5">
              <p className="text-[10px] font-mono text-muted-foreground truncate">
                {subtitle()}
              </p>
            </div>
          )}
        </div>

        {isIf ? (
          <>
            <Handle
              type="source"
              position={Position.Right}
              id="true"
              style={{ top: "35%" }}
              className="!h-3 !w-3 !border-2 !border-card !bg-emerald-500"
            />
            <Handle
              type="source"
              position={Position.Right}
              id="false"
              style={{ top: "65%" }}
              className="!h-3 !w-3 !border-2 !border-card !bg-red-400"
            />
            <div className="absolute -right-8 flex flex-col gap-4 top-[28%] text-[9px] font-bold">
              <span className="text-emerald-500">true</span>
              <span className="text-red-400">false</span>
            </div>
          </>
        ) : (
          <Handle
            type="source"
            position={Position.Right}
            className="!h-3.5 !w-3.5 !border-2 !border-card !bg-primary !shadow-sm"
          />
        )}
      </div>
    );
  },
);
FlowNode.displayName = "FlowNode";
