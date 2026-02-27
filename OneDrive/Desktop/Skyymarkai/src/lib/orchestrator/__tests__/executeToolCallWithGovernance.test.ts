import { executeToolCallWithGovernance } from '../executeToolCallWithGovernance';

// Mock all helper functions
global.getExecutionPolicy = jest.fn(async () => ({
  budgets: { maxRetriesPerStep: 2 },
  retry: { retryOn: ["tool_failure", "timeout"] },
}));
global.gateToolOrNeedsReview = jest.fn(async () => ({ ok: true, tool: { version: "1.0.0" } }));
global.createToolInvocation = jest.fn(async () => ({ invocationId: "test-invocation", docId: "test-doc" }));
global.markToolInvocation = jest.fn(async () => true);
global.emitUsageEvent = jest.fn(async () => true);
global.pushNeedsReview = jest.fn(async () => true);
global.computeBackoffMs = jest.fn(() => 0);
global.sleep = jest.fn(async () => {});
global.now = jest.fn(() => "2026-01-08T00:00:00.000Z");

describe('executeToolCallWithGovernance', () => {
  const baseArgs = {
    run: { workspaceId: 'ws1', id: 'run1', policyKey: 'default' },
    agent: { id: 'agent1' },
    step: { id: 'step1' },
    toolCall: { toolKey: 'core.noop', input: {}, stepId: 'step1' },
    actorUid: 'user1',
    executeTool: jest.fn(async () => ({ ok: true })),
  };

  it('succeeds on first try', async () => {
    const result = await executeToolCallWithGovernance(baseArgs);
    expect(result.ok).toBe(true);
    expect(result.output).toEqual({ ok: true });
    expect(global.markToolInvocation).toHaveBeenCalledWith('test-doc', expect.objectContaining({ status: 'succeeded' }));
    expect(global.emitUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ meta: expect.objectContaining({ status: 'succeeded' }) }));
  });

  it('handles tool gating (denied)', async () => {
    (global.gateToolOrNeedsReview as jest.Mock).mockResolvedValueOnce({ ok: false, denyReason: 'plan', needsReviewId: 'review1' });
    const result = await executeToolCallWithGovernance(baseArgs);
    expect(result.ok).toBe(false);
    expect(result.gated).toBe(true);
    expect(result.needsReviewId).toBe('review1');
    expect(global.markToolInvocation).toHaveBeenCalledWith('test-doc', expect.objectContaining({ status: 'failed' }));
    expect(global.emitUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ meta: expect.objectContaining({ status: 'denied' }) }));
  });

  it('retries on tool failure and then succeeds', async () => {
    let callCount = 0;
    (baseArgs.executeTool as jest.Mock).mockImplementation(async () => {
      callCount++;
      if (callCount === 1) throw new Error('tool_failure');
      return { ok: true };
    });
    (global.gateToolOrNeedsReview as jest.Mock).mockResolvedValue({ ok: true, tool: { version: '1.0.0' } });
    const result = await executeToolCallWithGovernance(baseArgs);
    expect(result.ok).toBe(true);
    expect(callCount).toBe(2);
    expect(global.emitUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ meta: expect.objectContaining({ status: 'succeeded', attempt: 2 }) }));
  });

  it('escalates after max retries', async () => {
    (baseArgs.executeTool as jest.Mock).mockImplementation(async () => { throw new Error('tool_failure'); });
    (global.gateToolOrNeedsReview as jest.Mock).mockResolvedValue({ ok: true, tool: { version: '1.0.0' } });
    const result = await executeToolCallWithGovernance(baseArgs);
    expect(result.ok).toBe(false);
    expect(global.pushNeedsReview).toHaveBeenCalledWith(expect.objectContaining({ reason: 'repeated_failures' }));
    expect(global.emitUsageEvent).toHaveBeenCalledWith(expect.objectContaining({ meta: expect.objectContaining({ status: 'failed' }) }));
  });
});
