import { PokedexCard } from "./pokedex-card";

export function TechStackPokedex() {
  return (
    <PokedexCard className="w-full lg:w-72" glowColor="rgba(0, 240, 255, 0.05)">
      <h3 className="mb-4 font-mono text-xs font-bold tracking-wider text-poke-cyan">
        ⚡ SYSTEM.POKEDEX
      </h3>
      
      <div className="space-y-4 font-mono text-[10px]">
        <div>
          <p className="mb-1 text-white/40">FRONTEND</p>
          <p className="text-white/80">├─ React 18 + TypeScript</p>
          <p className="text-white/80">├─ Vite + Tailwind CSS</p>
          <p className="text-white/80">└─ Vercel Edge Functions</p>
        </div>
        
        <div>
          <p className="mb-1 text-white/40">AI CORE</p>
          <p className="text-white/80">├─ Llama 3.2 Vision (11B)</p>
          <p className="text-white/80">├─ NVIDIA NIM API</p>
          <p className="text-white/80">└─ 2-Model Fallback Chain</p>
        </div>
        
        <div>
          <p className="mb-1 text-white/40">HABITAT</p>
          <p className="text-white/80">├─ ▲ Vercel (Frontend)</p>
          <p className="text-white/80">├─ 🗄️ Supabase (Database)</p>
          <p className="text-white/80">└─ 🐙 GitHub</p>
        </div>
      </div>
    </PokedexCard>
  );
}
