import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Loader2,
  GitBranch,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { executionsApi } from "@/api/executions.api";
import { formatDate, formatDuration, cn } from "@/lib/utils";
import type { Execution, ExecutionStatus, NodeRunData } from "@/types";

function StatusIcon({
  status,
  size = "md",
}: {
  status: ExecutionStatus;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  if (status === "success")
    return <CheckCircle2 className={cn(cls, "text-emerald-500")} />;
  if (status === "error")
    return <XCircle className={cn(cls, "text-red-500")} />;
  return <Clock className={cn(cls, "text-amber-500 animate-pulse")} />;
}

function JsonTree({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [collapsed, setCollapsed] = useState(depth > 1);
  if (data === null || data === undefined)
    return <span className="text-muted-foreground italic text-xs">null</span>;
  if (typeof data === "boolean")
    return (
      <span
        className={cn(
          "text-xs font-mono",
          data ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
        )}
      >
        {String(data)}
      </span>
    );
  if (typeof data === "number")
    return (
      <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
        {data}
      </span>
    );
  if (typeof data === "string")
    return (
      <span className="text-xs font-mono text-amber-700 dark:text-amber-400 break-all">
        "{data}"
      </span>
    );
  if (Array.isArray(data)) {
    if (!data.length)
      return (
        <span className="text-xs text-muted-foreground font-mono">[]</span>
      );
    return (
      <span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          <span className="text-xs font-mono">Array[{data.length}]</span>
        </button>
        {!collapsed && (
          <div className="ml-4 border-l border-border pl-3 mt-1 space-y-1">
            {data.map((item, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-xs text-muted-foreground shrink-0 font-mono">
                  {i}:
                </span>
                <JsonTree data={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }
  if (typeof data === "object") {
    const entries = Object.entries(data as Record<string, unknown>);
    if (!entries.length)
      return (
        <span className="text-xs text-muted-foreground font-mono">{"{}"}</span>
      );
    return (
      <span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          <span className="text-xs font-mono">
            Object{`{${entries.length}}`}
          </span>
        </button>
        {!collapsed && (
          <div className="ml-4 border-l border-border pl-3 mt-1 space-y-1">
            {entries.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-xs text-violet-600 dark:text-violet-400 shrink-0 font-mono font-semibold">
                  {k}:
                </span>
                <JsonTree data={v} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }
  return <span className="text-xs font-mono">{String(data)}</span>;
}

function NodeRunCard({
  nodeName,
  runData,
  index,
}: {
  nodeName: string;
  runData: NodeRunData;
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);
  const hasError = !!runData.error;
  const itemCount = runData.items?.length ?? 0;

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden",
        hasError ? "border-red-200 dark:border-red-800" : "border-border",
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors",
          hasError
            ? "bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50"
            : "bg-card hover:bg-muted/40",
        )}
      >
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm",
            hasError
              ? "bg-red-500"
              : "bg-gradient-to-br from-blue-500 to-violet-600",
          )}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{nodeName}</p>
          <p className="text-xs text-muted-foreground">
            {hasError
              ? `Error: ${runData.error}`
              : `${itemCount} item${itemCount !== 1 ? "s" : ""} · ${formatDuration(runData.startedAt, runData.finishedAt)}`}
          </p>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t bg-background p-4">
          {hasError ? (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
              <p className="text-sm text-red-700 dark:text-red-400 font-mono">
                {runData.error}
              </p>
            </div>
          ) : runData.items?.length ? (
            <div className="space-y-3">
              {runData.items.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-muted/50 border border-border p-3"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Item {i + 1}
                  </p>
                  <JsonTree data={item.json} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No output items
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: execution, isLoading } = useQuery({
    queryKey: ["executions", id],
    queryFn: () => executionsApi.get(id!),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === "running" ? 2000 : false,
  });

  if (isLoading)
    return (
      <div className="min-h-full">
        <div className="flex h-14 items-center gap-3 border-b px-8">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="px-8 py-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
    );

  if (!execution)
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="font-semibold text-lg">Execution not found</p>
          <Link to="/executions">
            <Button className="mt-4" variant="outline">
              Back to Executions
            </Button>
          </Link>
        </div>
      </div>
    );

  const order = execution.executionOrder ?? [];
  const runData = execution.runData ?? {};

  return (
    <div className="min-h-full bg-muted/20">
      <div className="flex h-14 items-center gap-3 border-b bg-card/80 backdrop-blur-sm px-8 sticky top-0 z-10">
        <Link to="/executions">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <StatusIcon status={execution.status} />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">
              {execution.workflowName}
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {execution.id}
            </p>
          </div>
        </div>
        <Link to={`/workflows/${execution.workflowId}`}>
          <Button variant="outline" size="sm">
            <GitBranch className="h-3.5 w-3.5 mr-1.5" />
            Open Workflow
          </Button>
        </Link>
      </div>

      <div className="px-8 py-6 space-y-6 max-w-4xl">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: "Status",
              value: (
                <Badge
                  variant={
                    execution.status === "success"
                      ? "success"
                      : execution.status === "error"
                        ? "destructive"
                        : "warning"
                  }
                  className="capitalize"
                >
                  {execution.status}
                </Badge>
              ),
            },
            {
              label: "Mode",
              value: (
                <Badge variant="outline" className="capitalize">
                  {execution.mode}
                </Badge>
              ),
            },
            {
              label: "Started",
              value: (
                <span className="text-sm">
                  {formatDate(execution.startedAt)}
                </span>
              ),
            },
            {
              label: "Duration",
              value: (
                <span className="text-sm font-mono">
                  {formatDuration(execution.startedAt, execution.finishedAt)}
                </span>
              ),
            },
          ].map(({ label, value }) => (
            <Card key={label} className="shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1.5">{label}</p>
                {value}
              </CardContent>
            </Card>
          ))}
        </div>

        {execution.error && !Object.keys(runData).length && (
          <Card className="border-red-200 dark:border-red-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-600">
                Execution Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs text-red-600 font-mono whitespace-pre-wrap">
                {execution.error}
              </pre>
            </CardContent>
          </Card>
        )}

        {order.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Execution Flow
            </p>
            <div className="flex items-center gap-1.5 flex-wrap p-4 rounded-2xl bg-card border">
              {order.map((n, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-xs bg-muted border border-border rounded-lg px-2.5 py-1 font-medium">
                    {n}
                  </span>
                  {i < order.length - 1 && (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {order.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Node Output
            </p>
            <div className="space-y-3">
              {order.map((name, i) => {
                const d = runData[name];
                if (!d) return null;
                return (
                  <NodeRunCard
                    key={name}
                    nodeName={name}
                    runData={d}
                    index={i}
                  />
                );
              })}
            </div>
          </div>
        )}

        {execution.status === "running" && !order.length && (
          <div className="flex items-center gap-3 text-muted-foreground p-4 rounded-2xl bg-card border">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Execution in progress…</span>
          </div>
        )}
      </div>
    </div>
  );
}
