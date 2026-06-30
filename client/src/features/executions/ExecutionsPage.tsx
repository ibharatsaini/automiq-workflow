import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  PlayCircle,
  Search,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { executionsApi } from "@/api/executions.api";
import { workflowsApi } from "@/api/workflows.api";
import { formatDate, formatRelative, formatDuration, cn } from "@/lib/utils";
import type { Execution, ExecutionStatus } from "@/types";

function StatusIcon({ status }: { status: ExecutionStatus }) {
  if (status === "success")
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-red-500" />;
  return <Clock className="h-4 w-4 text-amber-500 animate-pulse" />;
}

function StatusBadge({ status }: { status: ExecutionStatus }) {
  return (
    <Badge
      variant={
        status === "success"
          ? "success"
          : status === "error"
            ? "destructive"
            : "warning"
      }
      className="capitalize text-xs"
    >
      {status}
    </Badge>
  );
}

function ExecutionRow({ execution }: { execution: Execution }) {
  return (
    <Link
      to={`/executions/${execution.id}`}
      className="group flex items-center gap-4 rounded-2xl border bg-card px-5 py-3.5 hover:border-primary/20 hover:shadow-md transition-all duration-200"
    >
      <StatusIcon status={execution.status} />
      <div className="flex-1 min-w-0 grid grid-cols-3 gap-4 items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {execution.workflowName}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {execution.id.slice(0, 12)}…
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-xs">
            {execution.mode}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {formatDate(execution.startedAt)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatRelative(execution.startedAt)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs font-mono text-muted-foreground tabular-nums">
          {formatDuration(execution.startedAt, execution.finishedAt)}
        </span>
        <StatusBadge status={execution.status} />
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Link>
  );
}

export function ExecutionsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workflowFilter, setWorkflowFilter] = useState(
    searchParams.get("workflowId") ?? "all",
  );

  const { data: executions, isLoading } = useQuery({
    queryKey: ["executions", workflowFilter],
    queryFn: () =>
      executionsApi.list(workflowFilter !== "all" ? workflowFilter : undefined),
    refetchInterval: 5000,
  });
  const { data: workflows } = useQuery({
    queryKey: ["workflows"],
    queryFn: workflowsApi.list,
  });

  const filtered = (executions ?? []).filter((e) => {
    const ms =
      e.workflowName.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    const mf = statusFilter === "all" || e.status === statusFilter;
    return ms && mf;
  });

  const counts = {
    success: executions?.filter((e) => e.status === "success").length ?? 0,
    error: executions?.filter((e) => e.status === "error").length ?? 0,
    running: executions?.filter((e) => e.status === "running").length ?? 0,
  };

  return (
    <div className="min-h-full bg-muted/20">
      <PageHeader
        title="Executions"
        description="Monitor all workflow runs in real-time"
      />
      <div className="px-8 py-6 space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            {
              label: "Successful",
              count: counts.success,
              cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
            },
            {
              label: "Failed",
              count: counts.error,
              cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",
            },
            {
              label: "Running",
              count: counts.running,
              cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
            },
          ].map(({ label, count, cls }) => (
            <div
              key={label}
              className={cn(
                "rounded-xl border px-3.5 py-2 text-sm font-semibold",
                cls,
              )}
            >
              <span className="text-lg font-bold">{count}</span>{" "}
              <span className="font-medium opacity-80">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-56 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-background">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="running">Running</SelectItem>
            </SelectContent>
          </Select>
          <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
            <SelectTrigger className="w-52 bg-background">
              <SelectValue placeholder="All workflows" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All workflows</SelectItem>
              {(workflows ?? []).map((wf) => (
                <SelectItem key={wf.id} value={wf.id}>
                  {wf.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Workflow</span>
            <span>Mode</span>
            <span>Started</span>
            <span className="pr-24">Status</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 mb-4">
                <PlayCircle className="h-8 w-8 text-violet-500" />
              </div>
              <h3 className="font-semibold text-lg">No executions found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Trigger a webhook or run a test to see executions here"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((exec) => (
              <ExecutionRow key={exec.id} execution={exec} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
