interface AnimatedPokeballProps {
  size?: number;
  className?: string;
}

export function AnimatedPokeball({ size = 48, className = "" }: AnimatedPokeballProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`animate-pokeball-spin ${className}`}
      aria-label="Animated Pokeball"
      role="img"
    >
      {/* Top half - red */}
      <path
        d="M 5 50 A 45 45 0 0 1 95 50"
        fill="#EF4444"
        stroke="#1e293b"
        strokeWidth="4"
      />
      {/* Bottom half - white */}
      <path
        d="M 5 50 A 45 45 0 0 0 95 50"
        fill="#f8fafc"
        stroke="#1e293b"
        strokeWidth="4"
      />
      {/* Center band */}
      <rect x="3" y="46" width="94" height="8" fill="#1e293b" rx="1" />
      {/* Center circle outer */}
      <circle cx="50" cy="50" r="14" fill="#1e293b" />
      {/* Center circle inner */}
      <circle cx="50" cy="50" r="10" fill="#f8fafc" />
      {/* Center dot */}
      <circle cx="50" cy="50" r="5" fill="#1e293b" />
      {/* Shine highlight */}
      <ellipse cx="35" cy="30" rx="8" ry="5" fill="rgba(255,255,255,0.35)" transform="rotate(-30 35 30)" />
    </svg>
  );
}
