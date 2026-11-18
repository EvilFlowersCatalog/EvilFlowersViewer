import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './EventBus';

type Events = { ping: number; pong: string };

describe('EventBus', () => {
  it('delivers a payload to every listener of the event', () => {
    const bus = new EventBus<Events>();
    const a = vi.fn();
    const b = vi.fn();
    bus.on('ping', a);
    bus.on('ping', b);
    bus.emit('ping', 7);
    expect(a).toHaveBeenCalledWith(7);
    expect(b).toHaveBeenCalledWith(7);
  });

  it('stops delivering after unsubscribe', () => {
    const bus = new EventBus<Events>();
    const listener = vi.fn();
    const off = bus.on('pong', listener);
    off();
    bus.emit('pong', 'x');
    expect(listener).not.toHaveBeenCalled();
    expect(bus.has('pong')).toBe(false);
  });

  it('once fires a single time', () => {
    const bus = new EventBus<Events>();
    const listener = vi.fn();
    bus.once('ping', listener);
    bus.emit('ping', 1);
    bus.emit('ping', 2);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(1);
  });

  it('isolates a throwing listener from the others', () => {
    const onError = vi.fn();
    const bus = new EventBus<Events>(onError);
    const after = vi.fn();
    bus.on('ping', () => {
      throw new Error('host bug');
    });
    bus.on('ping', after);
    bus.emit('ping', 1);
    expect(after).toHaveBeenCalledWith(1);
    expect(onError).toHaveBeenCalledWith('ping', expect.any(Error));
  });
});
