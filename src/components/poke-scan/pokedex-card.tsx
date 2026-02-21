import { ReactNode } from "react";

interface PokedexCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function PokedexCard({ children, className = "", glowColor = "rgba(0, 240, 255, 0.1)" }: PokedexCardProps) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-black/60 p-6 backdrop-blur-md ${className}`}
      style={{ boxShadow: `0 0 40px ${glowColor}` }}
    >
      {children}
    </div>
  );
}
