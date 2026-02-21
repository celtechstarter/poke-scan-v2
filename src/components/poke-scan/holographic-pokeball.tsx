export function HolographicPokeball({ size = 80 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow rings */}
      <div
        className="absolute inset-0 animate-ping rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #facc15 0%, transparent 70%)" }}
      />
      <div
        className="absolute inset-2 animate-pulse rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, #00f0ff 0%, transparent 70%)" }}
      />
      
      {/* Pokeball SVG */}
      <svg
        viewBox="0 0 100 100"
        className="relative z-10 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]"
        aria-label="Holographic Pokeball"
        role="img"
      >
        {/* Top half - red with glow */}
        <defs>
          <linearGradient id="pokeball-red" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff6b6b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <path
          d="M 5 50 A 45 45 0 0 1 95 50"
          fill="url(#pokeball-red)"
          stroke="#0a0a0f"
          strokeWidth="3"
          filter="url(#glow)"
        />
        <path
          d="M 5 50 A 45 45 0 0 0 95 50"
          fill="#f8fafc"
          stroke="#0a0a0f"
          strokeWidth="3"
        />
        <rect x="3" y="47" width="94" height="6" fill="#0a0a0f" />
        <circle cx="50" cy="50" r="15" fill="#0a0a0f" />
        <circle cx="50" cy="50" r="10" fill="#f8fafc" className="animate-pulse" />
        <circle cx="50" cy="50" r="5" fill="#0a0a0f" />
      </svg>
    </div>
  );
}
