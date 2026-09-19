import { useEffect } from "react";

/** Pointer position in normalized device coordinates (-1..1), read by the scene every frame. */
export const pointer = { x: 0, y: 0, active: 0 };

export function usePointerTracking(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const move = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.active = 1;
    };
    const leave = () => {
      pointer.active = 0;
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      pointer.active = 0;
    };
  }, [enabled]);
}
