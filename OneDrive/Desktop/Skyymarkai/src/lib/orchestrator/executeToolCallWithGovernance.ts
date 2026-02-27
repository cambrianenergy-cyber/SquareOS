// Centralized tool execution with governance, logging, gating, retries, and metering
import {
  getExecutionPolicy,
  gateToolOrNeedsReview,
  createToolInvocation,
  markToolInvocation,
  emitUsageEvent,
  pushNeedsReview,
  computeBackoffMs,
  sleep,
  now,
} from "./governanceHelpers";

import type { WorkflowRun, Agent, Step, ToolCall } from "./types";

export async function executeToolCallWithGovernance(args: {
  run: WorkflowRun;
  agent: Agent;
  step: Step;
  toolCall: ToolCall;
  actorUid: string;
  executeTool: (toolKey: string, input: any) => Promise<any>;
}) {
  const { run, agent, step, toolCall, actorUid, executeTool } = args;

  // 1) Load policy
  const policy: any = (await getExecutionPolicy(run.workspaceId, run.policyKey)) ?? {};

  // 2) Gate tool (registry + allowlist + role + plan + high risk)
  const gate = await gateToolOrNeedsReview({
    workspaceId: run.workspaceId,
    runId: run.id,
    agent,
    stepId: toolCall.stepId ?? step.id,
    toolKey: toolCall.toolKey,
    actorUid,
    policy,
  });

  // 3) Create invocation log doc (queued)
  const { invocationId, docId } = await createToolInvocation({
    workspaceId: run.workspaceId,
    runId: run.id,
    agentId: agent.id,
    stepId: toolCall.stepId ?? step.id,
    toolKey: toolCall.toolKey,
    toolVersion: gate.tool?.version,
    input: toolCall.input,
    meta: { actorUid },
  });

  // If gated → mark failed and stop
  if (!gate.ok) {
    await markToolInvocation(docId, {
      status: 'failed',
      error: {
        message: `Tool gated: ${gate.denyReason}`,
        kind: 'permission_denied',
        retriable: false,
      },
      finishedAt: now(),
      durationMs: 0,
    });

    // Meter the denied invocation as well (optional)
    await emitUsageEvent({
      workspaceId: run.workspaceId,
      kind: 'tool_invocation',
      quantity: 1,
      unit: 'invocation',
      runId: run.id,
      agentId: agent.id,
      toolKey: toolCall.toolKey,
      meta: { status: 'denied', denyReason: gate.denyReason, invocationId },
    });

    return { ok: false as const, gated: true, invocationId, needsReviewId: gate.needsReviewId };
  }

  // 4) Execute with retries
  const maxRetries = policy.budgets?.maxRetriesPerStep ?? 2;
  let attempt = 0;
  const start = Date.now();
  await markToolInvocation(docId, { status: 'running', startedAt: now() });

  while (true) {
    attempt += 1;
    try {
      const output = await executeTool(toolCall.toolKey, toolCall.input);
      const durationMs = Date.now() - start;
      await markToolInvocation(docId, {
        status: 'succeeded',
        output: output ?? {},
        finishedAt: now(),
        durationMs,
      });
      // Meter tool invocation
      await emitUsageEvent({
        workspaceId: run.workspaceId,
        kind: 'tool_invocation',
        quantity: 1,
        unit: 'invocation',
        runId: run.id,
        agentId: agent.id,
        toolKey: toolCall.toolKey,
        meta: { status: 'succeeded', attempt, invocationId },
      });
      return { ok: true as const, invocationId, output };
    } catch (e: any) {
      const msg = e?.message ?? 'Tool error';
      const kind =
        /timeout/i.test(msg) ? 'timeout' :
        /permission/i.test(msg) ? 'permission_denied' :
        'tool_failure';
      const retriable =
        kind !== 'permission_denied' &&
        attempt <= maxRetries &&
        (policy.retry?.retryOn ?? ['tool_failure', 'timeout']).includes(kind as any);
      await markToolInvocation(docId, {
        status: retriable ? 'running' : 'failed',
        error: { message: msg, kind, retriable },
      });
      if (!retriable) {
        const durationMs = Date.now() - start;
        await markToolInvocation(docId, {
          status: 'failed',
          finishedAt: now(),
          durationMs,
        });
        // Escalate repeated failures
        await pushNeedsReview({
          workspaceId: run.workspaceId,
          runId: run.id,
          agentId: agent.id,
          stepId: toolCall.stepId ?? step.id,
          reason: 'repeated_failures',
          summary: `Tool failed after ${attempt} attempt(s): ${toolCall.toolKey}`,
          details: { invocationId, toolKey: toolCall.toolKey, error: msg },
        });
        await emitUsageEvent({
          workspaceId: run.workspaceId,
          kind: 'tool_invocation',
          quantity: 1,
          unit: 'invocation',
          runId: run.id,
          agentId: agent.id,
          toolKey: toolCall.toolKey,
          meta: { status: 'failed', attempt, invocationId, error: msg },
        });
        return { ok: false as const, invocationId, error: msg };
      }
      // backoff
      const backoff = computeBackoffMs(policy, attempt);
      if (backoff > 0) await sleep(backoff);
    }
  }
}
