import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, Webhook, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { workflowsApi } from "@/api/workflows.api";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(1, "Required"),
  triggerType: z.enum(["webhook", "schedule"]),
  webhookPath: z.string().optional(),
  cronExpression: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function CreateWorkflowModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      triggerType: "webhook",
      webhookPath: "my-hook",
      cronExpression: "0 * * * *",
    },
  });
  const triggerType = watch("triggerType");

  const createMut = useMutation({
    mutationFn: workflowsApi.create,
    onSuccess: (wf) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(`"${wf.name}" created`);
      reset();
      onClose();
      navigate(`/workflows/${wf.id}`);
    },
    onError: () => toast.error("Failed to create workflow"),
  });

  const onSubmit = (data: FormData) => {
    const trigger =
      data.triggerType === "webhook"
        ? {
            id: "1",
            name: "Webhook",
            type: "webhook" as const,
            parameters: {
              path: data.webhookPath ?? "my-hook",
              method: "POST",
              responseMode: "lastNode",
            },
          }
        : {
            id: "1",
            name: "Schedule",
            type: "schedule" as const,
            parameters: { cronExpression: data.cronExpression ?? "0 * * * *" },
          };
    const codeNode = {
      id: "2",
      name: "Code",
      type: "code" as const,
      parameters: {
        mode: "runOnceForAllItems",
        jsCode: 'return { json: { message: "Hello from n8n Clone!" } };',
      },
    };
    createMut.mutate({
      name: data.name,
      nodes: [trigger, codeNode],
      connections: {
        [trigger.name]: {
          main: [[{ node: "Code", type: "main" as const, index: 0 }]],
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Workflow</DialogTitle>
          <DialogDescription>
            Choose a trigger to get started. You can add more nodes in the
            canvas editor.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-1">
          <div className="space-y-2">
            <Label>Workflow Name</Label>
            <Input
              placeholder="My Workflow"
              {...register("name")}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Trigger Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["webhook", "schedule"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setValue("triggerType", type)}
                  className={cn(
                    "flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 text-sm font-medium transition-all",
                    triggerType === type
                      ? "border-primary bg-primary/5 text-primary shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {type === "webhook" ? (
                    <Webhook className="h-6 w-6" />
                  ) : (
                    <Clock className="h-6 w-6" />
                  )}
                  {type === "webhook" ? "Webhook" : "Schedule"}
                </button>
              ))}
            </div>
          </div>
          {triggerType === "webhook" && (
            <div className="space-y-2">
              <Label>Webhook Path</Label>
              <div className="flex items-center rounded-lg border border-input overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring transition-all">
                <span className="px-3 text-sm text-muted-foreground bg-muted h-10 flex items-center border-r border-border">
                  /webhook/
                </span>
                <input
                  className="flex-1 h-10 px-3 text-sm bg-transparent outline-none font-mono"
                  placeholder="my-hook"
                  {...register("webhookPath")}
                />
              </div>
            </div>
          )}
          {triggerType === "schedule" && (
            <div className="space-y-2">
              <Label>Cron Expression</Label>
              <Input
                placeholder="0 * * * *"
                {...register("cronExpression")}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                e.g. <code>0 9 * * *</code> = daily at 9am ·{" "}
                <code>*/30 * * * * *</code> = every 30s
              </p>
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMut.isPending}
              variant="gradient"
            >
              {createMut.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Create Workflow
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
