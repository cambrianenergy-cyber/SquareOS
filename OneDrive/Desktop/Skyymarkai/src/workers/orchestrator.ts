import type { AgentRunner } from "@/lib/agentRunner";
import type { FirestoreDbAdapter } from "./firestoreDbAdapter";

export interface ExecuteWorkflowRunOptions {
  environment?: "dev" | "staging" | "prod";
  source?: string;
  defaultTimeoutMs?: number;
  defaultRetryMax?: number;
  hardMaxWallMs?: number;
}

export interface ExecuteWorkflowRunArgs {
  db: FirestoreDbAdapter;
  agentRunner: AgentRunner;
  workspaceId: string;
  runId: string;
  options?: ExecuteWorkflowRunOptions;
}

export interface ExecuteWorkflowRunResult {
  ok: boolean;
  status: "not_implemented" | "failed" | "completed";
  message?: string;
}

export async function executeWorkflowRun(
  _args: ExecuteWorkflowRunArgs
): Promise<ExecuteWorkflowRunResult> {
  return {
    ok: false,
    status: "not_implemented",
    message: "executeWorkflowRun is not implemented in this project.",
  };
}
