interface ConfidenceBarProps {
  value: number;
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] tracking-widest text-white/50">
        AI CONFIDENCE
      </span>
      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-poke-cyan to-poke-green transition-all duration-1000"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="font-mono text-xs font-bold text-poke-green">
        {value.toFixed(1)}%
      </span>
    </div>
  );
}
