import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Trash2,
  Crown,
  Edit2,
  Eye,
  Loader2,
  Copy,
  Check,
  Globe,
  Building2,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { projectsApi } from "@/api/projects.api";
import { useAuthStore } from "@/store/auth.store";
import { useRole } from "@/hooks/useUserRole";
import { formatDate, cn } from "@/lib/utils";
import type { UserRole, ProjectMember } from "@/types";

const ROLES: Record<
  UserRole,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    desc: string;
  }
> = {
  admin: {
    label: "Admin",
    icon: Crown,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    desc: "Full access — manage workflows, credentials and team members",
  },
  editor: {
    label: "Editor",
    icon: Edit2,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    desc: "Create and run workflows, manage credentials",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-700",
    desc: "Read-only access to all resources",
  },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLES[role];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        cfg.color,
        cfg.bg,
        cfg.border,
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

const inviteSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["admin", "editor", "viewer"]),
  temporaryPassword: z.string().min(8, "Min 8 characters"),
});
type InviteForm = z.infer<typeof inviteSchema>;

function InviteMemberModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: "editor" },
  });
  const role = watch("role") as UserRole;

  const inviteMut = useMutation({
    mutationFn: projectsApi.inviteMember,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ["project-members"] });
      toast.success(
        `${d.email} invited as ${d.role}${d.isNewUser ? " (new account created)" : ""}`,
      );
      reset();
      onClose();
    },
    onError: (err: unknown) =>
      toast.error(
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to invite",
      ),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            If the user doesn't have an account, one will be created
            automatically with the temporary password.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((d) => inviteMut.mutate(d))}
          className="space-y-5 pt-1"
        >
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input
              type="email"
              placeholder="colleague@example.com"
              {...register("email")}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <div className="space-y-2">
              {(
                Object.entries(ROLES) as Array<
                  [UserRole, (typeof ROLES)[UserRole]]
                >
              ).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <label
                    key={key}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all",
                      role === key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/40",
                    )}
                  >
                    <input
                      type="radio"
                      value={key}
                      className="mt-0.5 accent-primary"
                      onChange={() => setValue("role", key)}
                      checked={role === key}
                    />
                    <div>
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-sm font-semibold",
                          cfg.color,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {cfg.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Temporary Password</Label>
            <Input
              type="password"
              placeholder="Min 8 characters"
              {...register("temporaryPassword")}
              className={errors.temporaryPassword ? "border-destructive" : ""}
            />
            {errors.temporaryPassword && (
              <p className="text-xs text-destructive">
                {errors.temporaryPassword.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              The user should change this after their first login.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={inviteMut.isPending}
              variant="gradient"
            >
              {inviteMut.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <UserPlus className="h-4 w-4" />
              Send Invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemberRow({
  member,
  currentUserId,
}: {
  member: ProjectMember & { email?: string };
  currentUserId: string;
}) {
  const qc = useQueryClient();
  const { isAdmin } = useRole();
  const isSelf = member.userId === currentUserId;
  const initials = member.email?.slice(0, 2).toUpperCase() ?? "U";

  const removeMut = useMutation({
    mutationFn: () => projectsApi.removeMember(member.userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-members"] });
      toast.success("Member removed");
    },
    onError: () => toast.error("Failed to remove"),
  });

  return (
    <div className="flex items-center gap-4 py-3.5 group">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarFallback className="text-xs font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">
            {member.email ?? member.userId}
          </p>
          {isSelf && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              You
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Joined {formatDate(member.createdAt)}
        </p>
      </div>
      <RoleBadge role={member.role} />
      {isAdmin && !isSelf && (
        <button
          onClick={() => {
            if (confirm(`Remove ${member.email} from project?`))
              removeMut.mutate();
          }}
          disabled={removeMut.isPending}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-all"
        >
          {removeMut.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      )}
    </div>
  );
}

export function ProjectSettingsPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const { auth } = useAuthStore();
  const { isAdmin } = useRole();

  const { data: project, isLoading: projLoading } = useQuery({
    queryKey: ["project-current"],
    queryFn: projectsApi.getCurrent,
  });
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["project-members"],
    queryFn: projectsApi.getMembers,
  });

  const copy = () => {
    navigator.clipboard.writeText(auth?.subdomain ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-full bg-muted/20">
      <PageHeader
        title="Project Settings"
        description="Manage your workspace configuration and team"
      />
      <div className="px-8 py-6 max-w-3xl space-y-6">
        {/* Workspace info */}
        <Card className="shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-violet-600" />
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Workspace</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {projLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Workspace Name
                  </Label>
                  <p className="text-sm font-semibold">{project?.name}</p>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Subdomain
                  </Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-xl bg-muted border border-border px-3 py-2.5 text-sm font-mono">
                      {auth?.subdomain}.localhost
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      onClick={copy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Webhook Base URL
                  </Label>
                  <div className="flex items-start gap-2.5 rounded-xl bg-muted/60 border border-border p-3.5">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <code className="text-sm font-mono text-foreground">
                        http://{auth?.subdomain}.localhost:5678/webhook/
                      </code>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Use{" "}
                        <code className="font-mono bg-background border border-border rounded px-1 py-0.5 text-[11px]">
                          X-Project-Subdomain: {auth?.subdomain}
                        </code>{" "}
                        header when testing via curl without DNS.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Role Permissions</CardTitle>
            </div>
            <CardDescription>
              What each role can do in this workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              Object.entries(ROLES) as Array<
                [UserRole, (typeof ROLES)[UserRole]]
              >
            ).map(([key, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4",
                    cfg.border,
                    cfg.bg,
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                      cfg.border,
                      "bg-background",
                    )}
                  >
                    <Icon className={cn("h-4 w-4", cfg.color)} />
                  </div>
                  <div>
                    <p className={cn("text-sm font-bold", cfg.color)}>
                      {cfg.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cfg.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">
                  Team Members{" "}
                  {members && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      ({members.length})
                    </span>
                  )}
                </CardTitle>
              </div>
              {isAdmin && (
                <Button
                  size="sm"
                  onClick={() => setShowInvite(true)}
                  variant="gradient"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !members?.length ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No members found
              </p>
            ) : (
              <div className="divide-y divide-border/60">
                {members.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    currentUserId={auth?.user.id ?? ""}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <InviteMemberModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
      />
    </div>
  );
}
