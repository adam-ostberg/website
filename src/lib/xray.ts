import { useSyncExternalStore } from "react";

/** Whether the robots are drawn as wireframes. Toggled from the "This website" project card. */
let on = false;
const listeners = new Set<() => void>();

export const xray = {
  get on() {
    return on;
  },
  toggle() {
    on = !on;
    listeners.forEach((f) => f());
  },
  subscribe(f: () => void) {
    listeners.add(f);
    return () => {
      listeners.delete(f);
    };
  },
};

export const useXray = () => useSyncExternalStore(xray.subscribe, () => on);
