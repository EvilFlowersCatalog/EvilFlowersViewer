import { afterEach, describe, expect, it, vi } from 'vitest';
import { Telemetry } from './Telemetry';
import { instrumentHost } from './instrumentHost';
import type { ITelemetryEvent } from './types';

const sinkOf = (overrides: Partial<{ maxBatchSize: number; flushIntervalMs: number }> = {}) => {
  const batches: ITelemetryEvent[][] = [];
  return { batches, sink: { export: (batch: readonly ITelemetryEvent[]) => void batches.push([...batch]), ...overrides } };
};

afterEach(() => vi.useRealTimers());

describe('Telemetry', () => {
  it('records nothing without a sink', () => {
    const telemetry = new Telemetry();
    telemetry.record('search', { total: 1 });
    expect(telemetry.enabled).toBe(false);
  });

  it('flushes when the batch is full', () => {
    const { batches, sink } = sinkOf({ maxBatchSize: 2 });
    const telemetry = new Telemetry(() => 1000);
    telemetry.setSink(sink);
    telemetry.record('zoom', { scale: 1 });
    expect(batches).toHaveLength(0);
    telemetry.record('zoom', { scale: 2 });
    expect(batches).toHaveLength(1);
    expect(batches[0].map((e) => e.attributes.scale)).toEqual([1, 2]);
    expect(batches[0][0]).toMatchObject({ name: 'zoom', time: 1000, level: 'info', sessionId: telemetry.sessionId });
  });

  it('flushes after the interval', () => {
    vi.useFakeTimers();
    const { batches, sink } = sinkOf({ flushIntervalMs: 100 });
    const telemetry = new Telemetry();
    telemetry.setSink(sink);
    telemetry.record('action', { action: 'cite' });
    vi.advanceTimersByTime(99);
    expect(batches).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(batches).toHaveLength(1);
  });

  it('stamps the document sequence', () => {
    const { batches, sink } = sinkOf();
    const telemetry = new Telemetry();
    telemetry.setSink(sink);
    telemetry.nextDocument();
    telemetry.record('document.open', {});
    telemetry.nextDocument();
    telemetry.record('document.open', {});
    telemetry.flush();
    expect(batches[0].map((e) => e.documentSeq)).toEqual([1, 2]);
  });

  it('survives a throwing sink', () => {
    const telemetry = new Telemetry();
    telemetry.setSink({
      export: () => {
        throw new Error('network');
      },
    });
    telemetry.record('zoom', {});
    expect(() => telemetry.flush()).not.toThrow();
  });

  it('measures durations with start()', () => {
    const { batches, sink } = sinkOf();
    const telemetry = new Telemetry();
    telemetry.setSink(sink);
    const done = telemetry.start('explain', { nested: false });
    done({ outcome: 'ok' });
    telemetry.flush();
    expect(batches[0][0].attributes).toEqual({ nested: false, outcome: 'ok' });
    expect(batches[0][0].durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('instrumentHost', () => {
  it('reports host calls by name with their outcome, never their arguments', async () => {
    const { batches, sink } = sinkOf();
    const telemetry = new Telemetry();
    telemetry.setSink(sink);
    const options = instrumentHost(telemetry, {
      explainFunction: async (text: string) => ({ simple: text }),
      chatPackage: { sendMessageFunc: async () => Promise.reject(new Error('down')) },
      onPageChange: () => undefined,
    });
    await options.explainFunction('secret passage');
    await options.chatPackage.sendMessageFunc().catch(() => undefined);
    await Promise.resolve();
    telemetry.flush();
    const calls = batches.flat().filter((e) => e.name === 'host.call');
    expect(calls.map((e) => [e.attributes.fn, e.attributes.outcome])).toEqual([
      ['explainFunction', 'ok'],
      ['chatPackage.sendMessageFunc', 'error'],
    ]);
    expect(JSON.stringify(batches)).not.toContain('secret');
  });

  it('leaves event callbacks unwrapped', () => {
    const telemetry = new Telemetry();
    const onPageChange = () => undefined;
    expect(instrumentHost(telemetry, { onPageChange }).onPageChange).toBe(onPageChange);
  });

  it('reports the chat time to first token', async () => {
    const { batches, sink } = sinkOf();
    const telemetry = new Telemetry();
    telemetry.setSink(sink);
    const { chatPackage } = instrumentHost(telemetry, {
      chatPackage: {
        sendMessageFunc: async (_m: string, _c: unknown, handlers: { onChunk: (t: string) => void }) => {
          handlers.onChunk('a');
          handlers.onChunk('b');
        },
      },
    });
    const chunks: string[] = [];
    await chatPackage.sendMessageFunc('q', [], { onChunk: (t: string) => chunks.push(t) });
    await Promise.resolve();
    telemetry.flush();
    expect(chunks).toEqual(['a', 'b']);
    expect(batches.flat().filter((e) => e.name === 'chat.first_token')).toHaveLength(1);
  });
});
