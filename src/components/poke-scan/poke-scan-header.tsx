import { HolographicPokeball } from "./holographic-pokeball";

export function PokeScanHeader() {
  return (
    <header className="relative py-12 text-center">
      {/* Skip to content */}
      <a
        href="#main-scanner"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-poke-yellow focus:px-4 focus:py-2 focus:text-black focus:outline-none"
      >
        Zum Scanner springen
      </a>

      <div className="flex flex-col items-center gap-4">
        <HolographicPokeball size={80} />
        
        <h1 className="text-4xl font-bold tracking-[0.3em] text-white md:text-5xl">
          P<span className="text-poke-yellow">O</span>KE-SCAN
        </h1>
        
        <p className="font-mono text-xs tracking-widest text-poke-cyan">
          AI-POWERED CARD RECOGNITION • EST. 2026
        </p>
      </div>

      {/* Scan line effect */}
      <div 
        className="pointer-events-none absolute inset-x-0 top-0 h-px animate-scan-line bg-gradient-to-r from-transparent via-poke-cyan to-transparent opacity-50"
        aria-hidden="true"
      />
    </header>
  );
}
