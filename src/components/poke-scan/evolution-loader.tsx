export function EvolutionLoader() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-16 w-16">
        {/* Outer ring */}
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-poke-cyan/30 border-t-poke-cyan" />
        {/* Inner ring */}
        <div 
          className="absolute inset-2 animate-spin rounded-full border-2 border-poke-yellow/30 border-t-poke-yellow"
          style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 animate-pulse rounded-full bg-poke-yellow" />
        </div>
      </div>
      <p className="animate-pulse font-mono text-xs tracking-widest text-poke-cyan">
        ANALYZING CARD DATA...
      </p>
    </div>
  );
}
