import { useMemo } from "react";

interface Sparkle {
  id: number;
  left: string;
  top: string;
  delay: string;
  duration: string;
  size: number;
  opacity: number;
}

export function FloatingSparkles({ count = 18 }: { count?: number }) {
  const sparkles: Sparkle[] = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${(i * 37 + 13) % 100}%`,
      top: `${(i * 53 + 7) % 100}%`,
      delay: `${(i * 0.4) % 3}s`,
      duration: `${2.5 + (i % 3) * 0.8}s`,
      size: 3 + (i % 4) * 1.5,
      opacity: 0.3 + (i % 5) * 0.12,
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="animate-sparkle-float absolute block rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            backgroundColor: "#facc15",
            opacity: s.opacity,
            animationDelay: s.delay,
            animationDuration: s.duration,
          }}
        />
      ))}
    </div>
  );
}
