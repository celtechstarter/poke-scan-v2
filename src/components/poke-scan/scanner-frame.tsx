import { ReactNode } from "react";

interface ScannerFrameProps {
  children: ReactNode;
  scanning?: boolean;
}

export function ScannerFrame({ children, scanning = false }: ScannerFrameProps) {
  return (
    <div className="relative">
      {/* Corner brackets */}
      <div className="pointer-events-none absolute -left-2 -top-2 h-6 w-6 border-l-2 border-t-2 border-poke-cyan" />
      <div className="pointer-events-none absolute -right-2 -top-2 h-6 w-6 border-r-2 border-t-2 border-poke-cyan" />
      <div className="pointer-events-none absolute -bottom-2 -left-2 h-6 w-6 border-b-2 border-l-2 border-poke-cyan" />
      <div className="pointer-events-none absolute -bottom-2 -right-2 h-6 w-6 border-b-2 border-r-2 border-poke-cyan" />
      
      {/* Scan line when scanning */}
      {scanning && (
        <div 
          className="pointer-events-none absolute inset-x-0 top-0 h-0.5 animate-scan-line bg-poke-yellow"
          style={{ boxShadow: "0 0 10px #facc15" }}
        />
      )}
      
      {children}
    </div>
  );
}
