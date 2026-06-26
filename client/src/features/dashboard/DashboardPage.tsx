import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  GitBranch,
  PlayCircle,
  KeyRound,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ArrowRight,
  Zap,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { workflowsApi } from "@/api/workflows.api";
import { executionsApi } from "@/api/executions.api";
import { credentialsApi } from "@/api/credentials.api";
import { useAuthStore } from "@/store/auth.store";
import { formatRelative, formatDuration, cn } from "@/lib/utils";
import type { ExecutionStatus } from "@/types";

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

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  description?: string;
  trend?: string;
  delay?: string;
}
function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
  description,
  trend,
  delay = "",
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 animate-fade-up",
        delay,
      )}
    >
      <CardContent className="p-0">
        <div className={cn("p-5 bg-gradient-to-br", gradient)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">{title}</p>
              <p className="mt-2 text-3xl font-bold text-white">{value}</p>
              {description && (
                <p className="mt-1 text-xs text-white/70">{description}</p>
              )}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
          {trend && (
            <div className="mt-3 flex items-center gap-1 text-xs text-white/70">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const { auth } = useAuthStore();
  const { data: workflows, isLoading: wfLoading } = useQuery({
    queryKey: ["workflows"],
    queryFn: workflowsApi.list,
  });
  const { data: executions, isLoading: exLoading } = useQuery({
    queryKey: ["executions"],
    queryFn: () => executionsApi.list(),
  });
  const { data: credentials } = useQuery({
    queryKey: ["credentials"],
    queryFn: credentialsApi.list,
  });

  const activeWf = workflows?.filter((w) => w.active).length ?? 0;
  const successEx =
    executions?.filter((e) => e.status === "success").length ?? 0;
  const errorEx = executions?.filter((e) => e.status === "error").length ?? 0;
  const recentExecs = executions?.slice(0, 8) ?? [];
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-full bg-muted/20">
      <PageHeader
        title={`${greeting}, ${auth?.user.email?.split("@")[0] ?? "there"} 👋`}
        description={`${auth?.projectName} · ${auth?.subdomain}.localhost`}
        action={
          <Button asChild variant="gradient" size="sm">
            <Link to="/workflows">
              <Plus className="h-4 w-4" />
              New Workflow
            </Link>
          </Button>
        }
      />

      <div className="px-8 py-6 space-y-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {wfLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))
          ) : (
            <>
              <StatCard
                title="Total Workflows"
                value={workflows?.length ?? 0}
                icon={GitBranch}
                gradient="from-blue-600 to-blue-700"
                description={`${activeWf} active`}
                trend="All time"
                delay="[animation-delay:0ms]"
              />
              <StatCard
                title="Active"
                value={activeWf}
                icon={Activity}
                gradient="from-emerald-500 to-teal-600"
                description="Running right now"
                trend="Live webhooks & schedules"
                delay="[animation-delay:60ms]"
              />
              <StatCard
                title="Executions"
                value={executions?.length ?? 0}
                icon={PlayCircle}
                gradient="from-violet-600 to-purple-700"
                description={`${successEx} ok · ${errorEx} failed`}
                trend="All time"
                delay="[animation-delay:120ms]"
              />
              <StatCard
                title="Credentials"
                value={credentials?.length ?? 0}
                icon={KeyRound}
                gradient="from-orange-500 to-amber-600"
                description="Encrypted integrations"
                trend="AES-256 encrypted"
                delay="[animation-delay:180ms]"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 shadow-sm animate-fade-up [animation-delay:240ms]">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-base">Recent Executions</CardTitle>
                <CardDescription>Latest workflow runs</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/executions" className="flex items-center gap-1">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {exLoading ? (
                <div className="px-6 pb-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : recentExecs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 mb-4">
                    <PlayCircle className="h-7 w-7 text-violet-500" />
                  </div>
                  <p className="font-semibold">No executions yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Activate a workflow and trigger it to see runs here
                  </p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link to="/workflows">Go to Workflows</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {recentExecs.map((exec) => (
                    <Link
                      key={exec.id}
                      to={`/executions/${exec.id}`}
                      className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/40 transition-colors"
                    >
                      <StatusIcon status={exec.status} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {exec.workflowName}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {exec.mode} · {formatRelative(exec.startedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatDuration(exec.startedAt, exec.finishedAt)}
                        </span>
                        <StatusBadge status={exec.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4 animate-fade-up [animation-delay:300ms]">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  {
                    to: "/workflows",
                    icon: GitBranch,
                    label: "New Workflow",
                    desc: "Build automation",
                    gradient: "from-blue-500 to-blue-600",
                  },
                  {
                    to: "/credentials",
                    icon: KeyRound,
                    label: "Add Credential",
                    desc: "Connect a service",
                    gradient: "from-orange-500 to-amber-500",
                  },
                  {
                    to: "/project",
                    icon: Activity,
                    label: "Invite Member",
                    desc: "Grow your team",
                    gradient: "from-violet-500 to-purple-600",
                  },
                ].map(({ to, icon: Icon, label, desc, gradient }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted/60 transition-colors group"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                        gradient,
                      )}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                        {label}
                      </p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-600 to-violet-700 border-0 shadow-lg shadow-blue-500/20 overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Your Workspace
                  </p>
                </div>
                <p className="text-xs text-blue-200 font-mono">
                  {auth?.subdomain}.localhost
                </p>
                <p className="text-xs text-blue-200 mt-1">
                  Webhooks: /webhook/your-path
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs text-white">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeWf} webhook{activeWf !== 1 ? "s" : ""} active
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
