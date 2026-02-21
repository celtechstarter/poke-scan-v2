import { useMemo } from "react";

export function EnergyParticles({ count = 25 }: { count?: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * 37 + 13) % 100}%`,
      delay: `${(i * 0.5) % 8}s`,
      duration: `${8 + (i % 4) * 2}s`,
      size: 2 + (i % 3),
    }));
  }, [count]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-float rounded-full bg-poke-yellow/40"
          style={{
            left: p.left,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}
