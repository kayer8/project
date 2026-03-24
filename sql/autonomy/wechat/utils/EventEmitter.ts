export interface DefaultEventMap {
  [key: string]: unknown[];
}

type Args<EventMap, Key extends keyof EventMap> = EventMap[Key] extends unknown[] ? EventMap[Key] : never;
type Listener<EventMap, Key extends keyof EventMap> = (...args: Args<EventMap, Key>) => void;

class EventEmitter<EventMap = DefaultEventMap> {
  private readonly events = new Map<keyof EventMap, Listener<EventMap, keyof EventMap>[]>();

  on<Key extends keyof EventMap>(name: Key, listener: Listener<EventMap, Key>) {
    const listeners = (this.events.get(name) || []) as Listener<EventMap, Key>[];
    listeners.push(listener);
    this.events.set(name, listeners as Listener<EventMap, keyof EventMap>[]);
    return () => this.off(name, listener);
  }

  emit<Key extends keyof EventMap>(name: Key, ...args: Args<EventMap, Key>) {
    const listeners = (this.events.get(name) || []) as Listener<EventMap, Key>[];
    listeners.forEach((listener) => listener(...args));
  }

  off<Key extends keyof EventMap>(name: Key, listener?: Listener<EventMap, Key>) {
    if (!listener) {
      this.events.delete(name);
      return;
    }

    const listeners = (this.events.get(name) || []) as Listener<EventMap, Key>[];
    const nextListeners = listeners.filter((item) => item !== listener);

    if (nextListeners.length === 0) {
      this.events.delete(name);
      return;
    }

    this.events.set(name, nextListeners as Listener<EventMap, keyof EventMap>[]);
  }

  once<Key extends keyof EventMap>(name: Key, listener: Listener<EventMap, Key>) {
    const wrapper: Listener<EventMap, Key> = (...args) => {
      this.off(name, wrapper);
      listener(...args);
    };

    this.on(name, wrapper);
  }
}

export default EventEmitter;
