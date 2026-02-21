import { AnimatedPokeball } from "./AnimatedPokeball";
import { FloatingSparkles } from "./FloatingSparkles";

export function AppHeader() {
  return (
    <header
      className="relative flex flex-col items-center gap-4 overflow-hidden px-4 pb-10 pt-14 text-center md:pb-14 md:pt-20"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 50%, #db2777 100%)",
      }}
    >
      <FloatingSparkles count={18} />

      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-gray-900 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        Zum Inhalt springen
      </a>

      <div className="relative z-10 flex flex-col items-center gap-3">
        <AnimatedPokeball size={56} />

        <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl drop-shadow-lg">
          Poke-Scan
        </h1>

        <p className="max-w-md text-pretty text-lg font-medium text-white/90 md:text-xl">
          Pokémon-Karte scannen → Preis erfahren
        </p>
      </div>

      {/* Bottom gradient fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-16"
        style={{
          background: "linear-gradient(to bottom, transparent, #0f172a)",
        }}
        aria-hidden="true"
      />
    </header>
  );
}
