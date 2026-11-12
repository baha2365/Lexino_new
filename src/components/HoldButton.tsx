import { useRef, useState } from 'react';

/** "Grown-ups only" gate: press and hold for 1.5 seconds. Children tap it by accident, but rarely hold it. */
export function HoldButton({ onDone, children, label }: { onDone: () => void; children: React.ReactNode; label: string }) {
  const [p, setP] = useState(0);
  const raf = useRef(0);
  const start = useRef(0);
  const HOLD = 1500;

  const tick = (now: number) => {
    const v = Math.min(1, (now - start.current) / HOLD);
    setP(v);
    if (v >= 1) {
      setP(0);
      onDone();
    } else raf.current = requestAnimationFrame(tick);
  };
  const begin = () => {
    start.current = performance.now();
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf.current);
    setP(0);
  };

  return (
    <button
      type="button"
      className="hold"
      aria-label={label}
      title={label}
      onPointerDown={begin}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) begin(); }}
      onKeyUp={stop}
      onContextMenu={(e) => e.preventDefault()}
      style={{ ['--p' as string]: p }}
    >
      <span className="hold__ring" />
      <span className="hold__icon">{children}</span>
    </button>
  );
}
