export interface WorkflowRunRecord {
  id: string;
  workflowId?: string;
  status?: string;
  currentStepIndex?: number;
  usage?: unknown;
  error?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FirestoreDbAdapter {
  getWorkflowRun: (runId: string, workspaceId: string) => Promise<WorkflowRunRecord | null>;
}

export function makeFirestoreDB(): FirestoreDbAdapter {
  return {
    async getWorkflowRun() {
      return null;
    },
  };
}
