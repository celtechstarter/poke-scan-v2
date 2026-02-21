import { useMemo } from "react";

const CONFETTI_COLORS = ["#facc15", "#2563eb", "#ef4444", "#22c55e", "#db2777", "#7c3aed"];

export function SuccessAnimation() {
  const confetti = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      id: i,
      left: `${(i * 29 + 5) % 100}%`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: `${(i * 0.06)}s`,
      rotation: (i * 47) % 360,
      size: 5 + (i % 3) * 3,
    }));
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {confetti.map((c) => (
        <span
          key={c.id}
          className="animate-confetti absolute block rounded-sm"
          style={{
            left: c.left,
            top: "-8px",
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            animationDelay: c.delay,
            transform: `rotate(${c.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
