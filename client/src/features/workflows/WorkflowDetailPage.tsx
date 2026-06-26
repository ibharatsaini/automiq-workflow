import { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection,
  ReactFlowProvider,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowLeft,
  Play,
  Square,
  Loader2,
  Plus,
  Trash2,
  Webhook,
  Clock,
  Code,
  GitBranch,
  Send,
  Hash,
  Settings,
  ChevronRight,
  Link as LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { workflowsApi } from "@/api/workflows.api";
import { credentialsApi } from "@/api/credentials.api";
import { useRole } from "@/hooks/useUserRole";
import { FlowNode, NODE_CONFIGS } from "./nodes/nodeConfig";
import { cn } from "@/lib/utils";
import type {
  Workflow,
  WorkflowNode,
  WorkflowConnections,
  NodeType,
} from "@/types";

const nodeTypes = { workflowNode: FlowNode };

const PALETTE: Array<{ type: NodeType }> = [
  { type: "webhook" },
  { type: "schedule" },
  { type: "code" },
  { type: "if" },
  { type: "telegram" },
  { type: "slack" },
];

function computePositions(
  workflow: Workflow,
): Record<string, { x: number; y: number }> {
  const pos: Record<string, { x: number; y: number }> = {};
  const visited = new Set<string>();
  const queue: Array<{ name: string; col: number; row: number }> = [];
  const trigger = workflow.nodes.find(
    (n) => n.type === "webhook" || n.type === "schedule",
  );
  if (trigger) queue.push({ name: trigger.name, col: 0, row: 0 });
  while (queue.length > 0) {
    const { name, col, row } = queue.shift()!;
    if (visited.has(name)) continue;
    visited.add(name);
    pos[name] = { x: 80 + col * 300, y: 80 + row * 200 };
    const conn = workflow.connections[name]?.main ?? [];
    conn.forEach((branch, i) =>
      branch.forEach((t) => {
        if (!visited.has(t.node))
          queue.push({ name: t.node, col: col + 1, row: row + i * 1.5 });
      }),
    );
  }
  workflow.nodes.forEach((n, i) => {
    if (!pos[n.name]) pos[n.name] = { x: 80, y: 80 + i * 200 };
  });
  return pos;
}

function workflowToFlow(workflow: Workflow): { nodes: Node[]; edges: Edge[] } {
  const positions = computePositions(workflow);
  const nodes: Node[] = workflow.nodes.map((n) => ({
    id: n.id,
    type: "workflowNode",
    position: positions[n.name] ?? { x: 100, y: 100 },
    data: {
      label: n.name,
      type: n.type,
      parameters: n.parameters,
      credentials: n.credentials,
    },
  }));
  const edges: Edge[] = [];
  Object.entries(workflow.connections).forEach(([srcName, conn]) => {
    const src = workflow.nodes.find((n) => n.name === srcName);
    if (!src) return;
    conn.main.forEach((branch, bi) =>
      branch.forEach((tgt) => {
        const t = workflow.nodes.find((n) => n.name === tgt.node);
        if (!t) return;
        const isIf = src.type === "if";
        edges.push({
          id: `${src.id}-${t.id}-${bi}`,
          source: src.id,
          target: t.id,
          sourceHandle: isIf ? (bi === 0 ? "true" : "false") : undefined,
          style: {
            stroke: isIf ? (bi === 0 ? "#10b981" : "#f87171") : "#6366f1",
            strokeWidth: 2.5,
          },
          animated: false,
        });
      }),
    );
  });
  return { nodes, edges };
}

function flowToWorkflow(
  nodes: Node[],
  edges: Edge[],
  orig: WorkflowNode[],
): { nodes: WorkflowNode[]; connections: WorkflowConnections } {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const origByName = new Map(orig.map((n) => [n.name, n]));
  const wfNodes: WorkflowNode[] = nodes.map((n) => {
    const d = n.data as {
      label: string;
      type: NodeType;
      parameters: Record<string, unknown>;
      credentials?: Record<string, string>;
    };
    return {
      id: n.id,
      name: d.label,
      type: d.type,
      parameters: d.parameters,
      credentials: origByName.get(d.label)?.credentials ?? d.credentials,
    };
  });
  const connections: WorkflowConnections = {};
  nodes.forEach((src) => {
    const d = src.data as { label: string; type: NodeType };
    const out = edges.filter((e) => e.source === src.id);
    if (!out.length) return;
    if (d.type === "if") {
      connections[d.label] = {
        main: [
          out
            .filter((e) => e.sourceHandle === "true")
            .map((e) => ({
              node: (nodeById.get(e.target)?.data as { label: string }).label,
              type: "main" as const,
              index: 0,
            })),
          out
            .filter((e) => e.sourceHandle === "false")
            .map((e) => ({
              node: (nodeById.get(e.target)?.data as { label: string }).label,
              type: "main" as const,
              index: 0,
            })),
        ],
      };
    } else {
      connections[d.label] = {
        main: [
          out.map((e) => ({
            node: (nodeById.get(e.target)?.data as { label: string }).label,
            type: "main" as const,
            index: 0,
          })),
        ],
      };
    }
  });
  return { nodes: wfNodes, connections };
}

function NodePanel({
  node,
  credentials,
  onChange,
  onClose,
}: {
  node: Node;
  credentials?: Array<{ id: string; name: string; type: string }>;
  onChange: (id: string, data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const d = node.data as {
    label: string;
    type: NodeType;
    parameters: Record<string, unknown>;
    credentials?: Record<string, string>;
  };
  const cfg = NODE_CONFIGS[d.type];
  const Icon = cfg?.icon ?? Settings;
  const upd = (k: string, v: unknown) =>
    onChange(node.id, { ...d, parameters: { ...d.parameters, [k]: v } });
  const updCred = (t: string, id: string) =>
    onChange(node.id, { ...d, credentials: { ...d.credentials, [t]: id } });

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b px-4 py-3.5">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            cfg?.bg,
          )}
        >
          <Icon className={cn("h-4.5 w-4.5", cfg?.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{d.label}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {cfg?.group} · {cfg?.label}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-sm"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {d.type === "webhook" && (
          <>
            <Field
              label="Path"
              value={(d.parameters.path as string) ?? ""}
              onChange={(v) => upd("path", v)}
            />
            <div className="space-y-2">
              <Label>Method</Label>
              <Select
                value={(d.parameters.method as string) ?? "POST"}
                onValueChange={(v) => upd("method", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Response Mode</Label>
              <Select
                value={(d.parameters.responseMode as string) ?? "lastNode"}
                onValueChange={(v) => upd("responseMode", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastNode">Last Node</SelectItem>
                  <SelectItem value="immediately">Immediately</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {d.type === "schedule" && (
          <Field
            label="Cron Expression"
            value={(d.parameters.cronExpression as string) ?? ""}
            onChange={(v) => upd("cronExpression", v)}
            hint="e.g. 0 9 * * * = 9am daily"
          />
        )}

        {d.type === "code" && (
          <>
            <div className="space-y-2">
              <Label>Mode</Label>
              <Select
                value={(d.parameters.mode as string) ?? "runOnceForAllItems"}
                onValueChange={(v) => upd("mode", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="runOnceForAllItems">
                    Run once for all items
                  </SelectItem>
                  <SelectItem value="runOnceForEachItem">
                    Run once per item
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>JavaScript Code</Label>
              <Textarea
                className="font-mono text-xs min-h-[220px] resize-none"
                value={(d.parameters.jsCode as string) ?? ""}
                onChange={(e) => upd("jsCode", e.target.value)}
                spellCheck={false}
              />
            </div>
          </>
        )}

        {d.type === "if" && (
          <>
            <div className="space-y-2">
              <Label>Combinator</Label>
              <Select
                value={(d.parameters.combinator as string) ?? "AND"}
                onValueChange={(v) => upd("combinator", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">AND – all must match</SelectItem>
                  <SelectItem value="OR">OR – any must match</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {((d.parameters.conditions as unknown[]) ?? []).map(
              (c: unknown, i) => {
                const cond = c as Record<string, string>;
                const updateCond = (key: string, val: string) => {
                  const conds = [
                    ...((d.parameters.conditions as Record<string, string>[]) ??
                      []),
                  ];
                  conds[i] = { ...conds[i]!, [key]: val };
                  upd("conditions", conds);
                };
                return (
                  <div
                    key={i}
                    className="rounded-xl border bg-muted/30 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Condition {i + 1}
                      </span>
                      <button
                        onClick={() => {
                          const conds = [
                            ...((d.parameters.conditions as unknown[]) ?? []),
                          ];
                          conds.splice(i, 1);
                          upd("conditions", conds);
                        }}
                        className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <Input
                      className="font-mono text-xs h-8"
                      placeholder="={{$json.field}}"
                      value={cond.leftValue ?? ""}
                      onChange={(e) => updateCond("leftValue", e.target.value)}
                    />
                    <Select
                      value={cond.operation ?? "equals"}
                      onValueChange={(v) => updateCond("operation", v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "equals",
                          "notEquals",
                          "contains",
                          "notContains",
                          "greaterThan",
                          "lessThan",
                          "isEmpty",
                          "isNotEmpty",
                        ].map((op) => (
                          <SelectItem key={op} value={op} className="text-xs">
                            {op}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!["isEmpty", "isNotEmpty"].includes(
                      cond.operation ?? "equals",
                    ) && (
                      <Input
                        className="h-8 text-xs"
                        placeholder="value"
                        value={cond.rightValue ?? ""}
                        onChange={(e) =>
                          updateCond("rightValue", e.target.value)
                        }
                      />
                    )}
                  </div>
                );
              },
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                upd("conditions", [
                  ...((d.parameters.conditions as unknown[]) ?? []),
                  {
                    leftValue: "={{$json.field}}",
                    operation: "equals",
                    rightValue: "",
                  },
                ])
              }
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Condition
            </Button>
          </>
        )}

        {(d.type === "telegram" || d.type === "slack") && (
          <>
            <CredField
              label={d.type === "telegram" ? "Telegram Bot" : "Slack Bot"}
              credType={d.type === "telegram" ? "telegramApi" : "slackApi"}
              value={
                d.credentials?.[
                  d.type === "telegram" ? "telegramApi" : "slackApi"
                ] ?? ""
              }
              credentials={credentials ?? []}
              onChange={(id) =>
                updCred(d.type === "telegram" ? "telegramApi" : "slackApi", id)
              }
            />
            {d.type === "telegram" && (
              <Field
                label="Chat ID"
                value={(d.parameters.chatId as string) ?? ""}
                onChange={(v) => upd("chatId", v)}
              />
            )}
            {d.type === "slack" && (
              <Field
                label="Channel"
                value={(d.parameters.channel as string) ?? ""}
                onChange={(v) => upd("channel", v)}
                placeholder="#general"
              />
            )}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Hello {{$json.name}}!"
                value={(d.parameters.text as string) ?? ""}
                onChange={(e) => upd("text", e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                Use{" "}
                <code className="font-mono bg-muted px-1 rounded">
                  {"{{$json.field}}"}
                </code>{" "}
                for dynamic values
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function CredField({
  label,
  credType,
  value,
  credentials,
  onChange,
}: {
  label: string;
  credType: string;
  value: string;
  credentials: Array<{ id: string; name: string; type: string }>;
  onChange: (id: string) => void;
}) {
  const matching = credentials.filter((c) => c.type === credType);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {matching.length === 0 ? (
        <div className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground text-center">
          No {credType} credentials.{" "}
          <Link to="/credentials" className="text-primary underline">
            Add one →
          </Link>
        </div>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select credential" />
          </SelectTrigger>
          <SelectContent>
            {matching.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

function WorkflowCanvas({ workflow }: { workflow: Workflow }) {
  const qc = useQueryClient();
  const { isEditor } = useRole();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const { data: creds } = useQuery({
    queryKey: ["credentials"],
    queryFn: credentialsApi.list,
  });

  useEffect(() => {
    const { nodes: n, edges: e } = workflowToFlow(workflow);
    setNodes(n);
    setEdges(e);
    setIsDirty(false);
  }, [workflow]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((n) => applyNodeChanges(changes, n));
    setIsDirty(true);
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((e) => applyEdgeChanges(changes, e));
    setIsDirty(true);
  }, []);
  const onConnect = useCallback((params: Connection) => {
    setEdges((e) =>
      addEdge({ ...params, style: { stroke: "#6366f1", strokeWidth: 2.5 } }, e),
    );
    setIsDirty(true);
  }, []);
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => setSelectedNode(node),
    [],
  );
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const handleNodeChange = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((ns) => ns.map((n) => (n.id === id ? { ...n, data } : n)));
      setSelectedNode((prev) => (prev?.id === id ? { ...prev, data } : prev));
      setIsDirty(true);
    },
    [],
  );

  const addNode = (type: NodeType) => {
    const cfg = NODE_CONFIGS[type];
    const id = String(Date.now());
    const count =
      nodes.filter((n) => (n.data as { type: NodeType }).type === type).length +
      1;
    const name = `${cfg.label} ${count}`;
    const defaults: Record<NodeType, Record<string, unknown>> = {
      webhook: { path: "my-hook", method: "POST", responseMode: "lastNode" },
      schedule: { cronExpression: "0 * * * *" },
      code: {
        mode: "runOnceForAllItems",
        jsCode: 'return { json: { message: "Hello!" } };',
      },
      if: {
        combinator: "AND",
        conditions: [
          {
            leftValue: "={{$json.field}}",
            operation: "equals",
            rightValue: "",
          },
        ],
      },
      telegram: { chatId: "", text: "{{$json.message}}" },
      slack: { channel: "#general", text: "{{$json.message}}" },
    };
    setNodes((ns) => [
      ...ns,
      {
        id,
        type: "workflowNode",
        position: {
          x: 200 + Math.random() * 100,
          y: 150 + Math.random() * 100,
        },
        data: { label: name, type, parameters: defaults[type] },
      },
    ]);
    setIsDirty(true);
  };

  const testMut = useMutation({
    mutationFn: () => workflowsApi.test(workflow.id),
    onSuccess: (d) => {
      d.status === "success"
        ? toast.success(`Test passed · ${d.executionOrder?.join(" → ")}`)
        : toast.error(`Failed: ${d.error}`);
    },
    onError: () => toast.error("Test failed"),
  });
  const activateMut = useMutation({
    mutationFn: () =>
      workflow.active
        ? workflowsApi.deactivate(workflow.id)
        : workflowsApi.activate(workflow.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows", workflow.id] });
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success(workflow.active ? "Deactivated" : "Activated");
    },
  });

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <header className="flex h-14 items-center gap-3 border-b bg-card px-4 shrink-0 shadow-sm">
        <Link to="/workflows">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="font-bold text-sm truncate">{workflow.name}</span>
          <Badge
            variant={workflow.active ? "success" : "secondary"}
            className="capitalize shrink-0"
          >
            {workflow.active ? "Active" : "Inactive"}
          </Badge>
          {isDirty && (
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-300 dark:border-amber-700 shrink-0 text-[10px]"
            >
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isEditor && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testMut.mutate()}
                disabled={testMut.isPending}
              >
                {testMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Test
              </Button>
              <Button
                size="sm"
                variant={workflow.active ? "outline" : "gradient"}
                onClick={() => activateMut.mutate()}
                disabled={activateMut.isPending}
              >
                {activateMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : workflow.active ? (
                  <Square className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {workflow.active ? "Deactivate" : "Activate"}
              </Button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Palette */}
        {isEditor && (
          <aside className="w-48 shrink-0 border-r bg-card overflow-y-auto">
            <p className="px-3 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Nodes
            </p>
            <div className="px-2 space-y-1 pb-4">
              {PALETTE.map(({ type }) => {
                const cfg = NODE_CONFIGS[type];
                const Icon = cfg.icon;
                return (
                  <button
                    key={type}
                    onClick={() => addNode(type)}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-left hover:border-border hover:bg-muted/60 transition-all group"
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        cfg.bg,
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold group-hover:text-foreground transition-colors">
                        {cfg.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {cfg.group}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={isEditor ? onNodesChange : undefined}
            onEdgesChange={isEditor ? onEdgesChange : undefined}
            onConnect={isEditor ? onConnect : undefined}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            deleteKeyCode={isEditor ? "Backspace" : null}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="hsl(var(--border))"
            />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const colors: Record<NodeType, string> = {
                  webhook: "#3b82f6",
                  schedule: "#8b5cf6",
                  code: "#64748b",
                  if: "#f59e0b",
                  telegram: "#0ea5e9",
                  slack: "#10b981",
                };
                return colors[(n.data as { type: NodeType }).type] ?? "#94a3b8";
              }}
              maskColor="hsl(var(--background) / 0.7)"
            />
          </ReactFlow>
          {selectedNode && isEditor && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
              <Button
                variant="destructive"
                size="sm"
                className="shadow-lg"
                onClick={() => {
                  setNodes((ns) => ns.filter((n) => n.id !== selectedNode.id));
                  setEdges((es) =>
                    es.filter(
                      (e) =>
                        e.source !== selectedNode.id &&
                        e.target !== selectedNode.id,
                    ),
                  );
                  setSelectedNode(null);
                  setIsDirty(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete node
              </Button>
            </div>
          )}
        </div>

        {/* Node config panel */}
        {selectedNode && (
          <aside className="w-72 shrink-0 border-l overflow-hidden">
            <NodePanel
              node={selectedNode}
              credentials={creds}
              onChange={handleNodeChange}
              onClose={() => setSelectedNode(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

export function WorkflowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workflow, isLoading } = useQuery({
    queryKey: ["workflows", id],
    queryFn: () => workflowsApi.get(id!),
    enabled: !!id,
  });

  if (isLoading)
    return (
      <div className="flex h-screen flex-col">
        <div className="flex h-14 items-center gap-3 border-b px-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );

  if (!workflow)
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Workflow not found</p>
          <Link to="/workflows">
            <Button className="mt-4" variant="outline">
              Back to Workflows
            </Button>
          </Link>
        </div>
      </div>
    );

  return (
    <ReactFlowProvider>
      <WorkflowCanvas workflow={workflow} />
    </ReactFlowProvider>
  );
}
