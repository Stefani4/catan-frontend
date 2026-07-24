import { useEffect, useRef, useState } from "react";

export default function FpsOverlay({ visible }) {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastSampleTime = useRef(performance.now());
  const rafId = useRef(null);

  useEffect(() => {
    if (!visible) return undefined;

    frameCount.current = 0;
    lastSampleTime.current = performance.now();

    const tick = (now) => {
      frameCount.current += 1;
      const elapsed = now - lastSampleTime.current;
      if (elapsed >= 500) {
        setFps(Math.round((frameCount.current * 1000) / elapsed));
        frameCount.current = 0;
        lastSampleTime.current = now;
      }
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId.current);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "8px",
        right: "8px",
        zIndex: 9999,
        padding: "3px 8px",
        borderRadius: "4px",
        background: "rgba(0,0,0,0.65)",
        color: fps >= 50 ? "#6f9950" : fps >= 30 ? "#f1d38a" : "#e05d44",
        fontFamily: "monospace",
        fontSize: "0.75rem",
        fontWeight: "bold",
        pointerEvents: "none",
      }}
    >
      {fps} FPS
    </div>
  );
}
