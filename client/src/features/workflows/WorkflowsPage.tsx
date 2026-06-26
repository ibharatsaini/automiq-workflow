import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  GitBranch,
  Play,
  Trash2,
  MoreHorizontal,
  Webhook,
  Clock,
  ChevronRight,
  Activity,
  Zap,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/PageHeader";
import { workflowsApi } from "@/api/workflows.api";
import { useRole } from "@/hooks/useUserRole";
import { formatRelative, cn } from "@/lib/utils";
import { CreateWorkflowModal } from "./CreateWorkflowModal";
import type { Workflow } from "@/types";

function getTriggerInfo(workflow: Workflow) {
  const t = workflow.nodes.find(
    (n) => n.type === "webhook" || n.type === "schedule",
  );
  if (t?.type === "webhook")
    return {
      icon: Webhook,
      label: `POST /${t.parameters?.path ?? "…"}`,
      color: "text-blue-500",
    };
  if (t?.type === "schedule")
    return {
      icon: Clock,
      label: String(t.parameters?.cronExpression ?? ""),
      color: "text-violet-500",
    };
  return {
    icon: GitBranch,
    label: "No trigger",
    color: "text-muted-foreground",
  };
}

function WorkflowRow({ workflow }: { workflow: Workflow }) {
  const qc = useQueryClient();
  const { isEditor, isAdmin } = useRole();
  const trigger = getTriggerInfo(workflow);
  const TIcon = trigger.icon;

  const activateMut = useMutation({
    mutationFn: () => workflowsApi.activate(workflow.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(`"${workflow.name}" activated`);
    },
    onError: () => toast.error("Activation failed"),
  });
  const deactivateMut = useMutation({
    mutationFn: () => workflowsApi.deactivate(workflow.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(`"${workflow.name}" deactivated`);
    },
    onError: () => toast.error("Deactivation failed"),
  });
  const deleteMut = useMutation({
    mutationFn: () => workflowsApi.delete(workflow.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(`"${workflow.name}" deleted`);
    },
    onError: () => toast.error("Delete failed"),
  });
  const testMut = useMutation({
    mutationFn: () => workflowsApi.test(workflow.id),
    onSuccess: (d) => {
      d.status === "success"
        ? toast.success("Test run succeeded")
        : toast.error(`Test failed: ${d.error}`);
    },
    onError: () => toast.error("Test failed"),
  });

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 transition-all duration-200 hover:shadow-md hover:border-primary/20",
        workflow.active && "border-l-4 border-l-emerald-500",
      )}
    >
      {isEditor && (
        <Switch
          checked={workflow.active}
          onCheckedChange={() =>
            workflow.active ? deactivateMut.mutate() : activateMut.mutate()
          }
          disabled={activateMut.isPending || deactivateMut.isPending}
        />
      )}

      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full shrink-0 transition-all",
          workflow.active
            ? "bg-emerald-500 shadow-sm shadow-emerald-500/60"
            : "bg-muted-foreground/20",
        )}
      />

      <Link
        to={`/workflows/${workflow.id}`}
        className="flex-1 min-w-0 group/link"
      >
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-sm group-hover/link:text-primary transition-colors">
            {workflow.name}
          </span>
          {workflow.active && (
            <Badge variant="success" className="text-[10px] px-1.5 py-0 h-4">
              Live
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className={cn("flex items-center gap-1 text-xs", trigger.color)}>
            <TIcon className="h-3 w-3" />
            <span className="font-mono truncate max-w-[180px]">
              {trigger.label}
            </span>
          </div>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <span className="text-xs text-muted-foreground">
            {workflow.nodes.length} nodes
          </span>
          <span className="text-muted-foreground/40 text-xs">·</span>
          <span className="text-xs text-muted-foreground">
            {formatRelative(workflow.updatedAt)}
          </span>
        </div>
      </Link>

      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-150">
        {isEditor && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => testMut.mutate()}
            disabled={testMut.isPending}
          >
            <Play className="h-3 w-3" />
            {testMut.isPending ? "Running…" : "Test"}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
          asChild
        >
          <Link to={`/workflows/${workflow.id}`}>
            Open <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  if (confirm(`Delete "${workflow.name}"?`)) deleteMut.mutate();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete workflow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export function WorkflowsPage() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const { isEditor } = useRole();
  const { data: workflows, isLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: workflowsApi.list,
  });

  const filtered = (workflows ?? []).filter((w) => {
    const ms = w.name.toLowerCase().includes(search.toLowerCase());
    const mf =
      filter === "all" ? true : filter === "active" ? w.active : !w.active;
    return ms && mf;
  });
  const activeCount = workflows?.filter((w) => w.active).length ?? 0;

  return (
    <div className="min-h-full bg-muted/20">
      <PageHeader
        title="Workflows"
        description="Build, activate and monitor your automation workflows"
        action={
          isEditor && (
            <Button onClick={() => setShowCreate(true)} variant="gradient">
              <Plus className="h-4 w-4" />
              New Workflow
            </Button>
          )
        }
      />

      <div className="px-8 py-6 space-y-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-64 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workflows…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border bg-background p-1">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f}
                {f === "active" && activeCount > 0 && (
                  <span className="ml-1.5 text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full px-1.5 py-0.5">
                    {activeCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 dark:from-blue-900/30 dark:to-violet-900/30 mb-4">
                <GitBranch className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="font-semibold text-lg">
                {search ? "No workflows found" : "No workflows yet"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                {search
                  ? "Try a different search term"
                  : "Create your first workflow to start automating"}
              </p>
              {!search && isEditor && (
                <Button
                  className="mt-5"
                  onClick={() => setShowCreate(true)}
                  variant="gradient"
                >
                  <Plus className="h-4 w-4" />
                  Create workflow
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((wf) => (
              <WorkflowRow key={wf.id} workflow={wf} />
            ))}
          </div>
        )}
      </div>

      <CreateWorkflowModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
