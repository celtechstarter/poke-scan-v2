import CardScanner from "./components/CardScanner";

// Animierter Pokéball
const AnimatedPokeball = () => (
  <svg 
    className="w-12 h-12 animate-spin-slow" 
    viewBox="0 0 100 100" 
    fill="none"
  >
    <circle cx="50" cy="50" r="48" stroke="white" strokeWidth="4" fill="none"/>
    <path d="M2 50 H98" stroke="white" strokeWidth="4"/>
    <circle cx="50" cy="50" r="18" stroke="white" strokeWidth="4" fill="none"/>
    <circle cx="50" cy="50" r="8" fill="white"/>
    <path d="M2 50 A48 48 0 0 0 98 50" fill="#ef4444"/>
  </svg>
);

// Schwebende Sparkles
const FloatingSparkles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(12)].map((_, i) => (
      <div
        key={i}
        className="absolute animate-float opacity-60"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${i * 0.5}s`,
          animationDuration: `${3 + Math.random() * 2}s`
        }}
      >
        <svg className="w-4 h-4 text-yellow-300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
        </svg>
      </div>
    ))}
  </div>
);

// Pikachu-Silhouette
const PikachuSilhouette = () => (
  <svg className="w-8 h-8 text-yellow-400 animate-bounce-slow" viewBox="0 0 100 100" fill="currentColor">
    <ellipse cx="50" cy="70" rx="30" ry="25"/>
    <circle cx="50" cy="45" r="22"/>
    <ellipse cx="35" cy="35" rx="8" ry="12" transform="rotate(-20 35 35)"/>
    <ellipse cx="65" cy="35" rx="8" ry="12" transform="rotate(20 65 35)"/>
    <circle cx="42" cy="42" r="3" fill="#1a1a1a"/>
    <circle cx="58" cy="42" r="3" fill="#1a1a1a"/>
    <ellipse cx="50" cy="52" rx="4" ry="2" fill="#1a1a1a"/>
    <circle cx="38" cy="50" r="5" fill="#ef4444" opacity="0.6"/>
    <circle cx="62" cy="50" r="5" fill="#ef4444" opacity="0.6"/>
  </svg>
);

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 relative">
      <FloatingSparkles />
      
      <header className="py-8 text-center relative z-10">
        <div className="flex items-center justify-center gap-4 mb-3">
          <AnimatedPokeball />
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">
            Poke-Scan
          </h1>
          <PikachuSilhouette />
        </div>
        <p className="text-white/90 text-lg font-medium">
          Pokémon-Karte scannen → Preis erfahren
        </p>
      </header>

      <main className="pb-8 relative z-10">
        <CardScanner />
      </main>

      <footer className="py-6 text-center relative z-10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-white/80 text-sm">Powered by</span>
          <span className="text-white font-semibold">🦙 Llama Vision</span>
          <span className="text-white/60">•</span>
          <span className="text-white font-semibold">📊 Cardmarket</span>
        </div>
        
        <div className="flex items-center justify-center gap-1 text-white/70 text-sm mb-2">
          <span>Built by</span>
          <span className="text-yellow-300 font-semibold">Marcel Welk</span>
          <span>with</span>
        </div>
        
        <div className="flex items-center justify-center gap-3 text-xs text-white/60">
          <span className="flex items-center gap-1">
            <span>🧠</span>
            <span>Claude</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>🦞</span>
            <span>OpenClaw</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span>⚡</span>
            <span>NVIDIA NIM</span>
          </span>
        </div>
        
        <p className="mt-3 text-white/40 text-xs">
          © 2025 Poke-Scan | Made with 💛 by KI-Agenten
        </p>
      </footer>
    </div>
  );
}

export default App;
