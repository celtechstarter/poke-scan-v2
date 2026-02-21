import { useMemo } from "react";

export function NeuralPokemonBackground() {
  const nodes = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: (i * 47 + 13) % 100,
      y: (i * 31 + 7) % 100,
      size: 2 + (i % 3),
      delay: i * 0.2,
    }));
  }, []);

  const connections = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; id: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          Math.pow(nodes[i].x - nodes[j].x, 2) + Math.pow(nodes[i].y - nodes[j].y, 2)
        );
        if (dist < 25) {
          lines.push({
            x1: nodes[i].x,
            y1: nodes[i].y,
            x2: nodes[j].x,
            y2: nodes[j].y,
            id: i * 100 + j,
          });
        }
      }
    }
    return lines;
  }, [nodes]);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <svg className="h-full w-full opacity-20">
        {connections.map((line) => (
          <line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke="rgba(0, 240, 255, 0.3)"
            strokeWidth="1"
          />
        ))}
        {nodes.map((node) => (
          <circle
            key={node.id}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r={node.size}
            fill="rgba(250, 204, 21, 0.5)"
            className="animate-pulse"
            style={{ animationDelay: `${node.delay}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
