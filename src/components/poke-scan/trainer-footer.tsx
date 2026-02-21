export function TrainerFooter() {
  return (
    <footer className="border-t border-white/5 bg-black/40 px-4 py-8 backdrop-blur-sm" role="contentinfo">
      <div className="mx-auto max-w-4xl space-y-6 text-center font-mono">
        {/* Title */}
        <p className="text-xs tracking-widest text-poke-yellow">
          🎮 POKE-SCAN v2.0 • POKEMON CARD RECOGNITION FROM THE FUTURE
        </p>
        
        {/* Creator */}
        <div className="rounded-lg border border-poke-yellow/20 bg-poke-yellow/5 p-4">
          <p className="text-[10px] tracking-widest text-white/40">POKEMON TRAINER</p>
          <p className="mt-1 text-lg font-bold text-poke-yellow">👨‍💻 MARCEL WELK</p>
          <p className="text-[10px] text-white/60">Lead Trainer & Project Architect</p>
          <a
            href="https://github.com/celtechstarter/poke-scan-v2#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-xs text-white/60 hover:text-poke-cyan"
            aria-label="GitHub Profil von Marcel Welk"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            github.com/celtechstarter
          </a>
        </div>
        
        {/* AI Agents */}
        <div className="grid grid-cols-2 gap-2 text-[10px] md:grid-cols-4">
          <div className="rounded border border-white/5 bg-white/5 p-2">
            <span className="text-white/40">🧠 Claude</span>
            <p className="text-white/80">Architect</p>
          </div>
          <div className="rounded border border-white/5 bg-white/5 p-2">
            <span className="text-white/40">🦞 OpenClaw</span>
            <p className="text-white/80">Builder</p>
          </div>
          <div className="rounded border border-white/5 bg-white/5 p-2">
            <span className="text-white/40">🦙 Llama</span>
            <p className="text-white/80">Vision AI</p>
          </div>
          <div className="rounded border border-white/5 bg-white/5 p-2">
            <span className="text-white/40">🎨 v0.dev</span>
            <p className="text-white/80">Designer</p>
          </div>
        </div>
        
        {/* Powered by */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-white/40">
          <span>⚡ NVIDIA NIM</span>
          <span>•</span>
          <span>🟦 Hostinger VPS</span>
          <span>•</span>
          <span>▲ Vercel Edge</span>
          <span>•</span>
          <span>📊 Cardmarket</span>
        </div>
        
        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-[10px]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-poke-green" />
          <span className="text-poke-green">ALL SYSTEMS OPERATIONAL</span>
          <span className="text-white/30">•</span>
          <span className="text-white/40">HOSTED ON HOSTINGER</span>
          <span className="text-white/30">•</span>
          <span className="text-white/40">DEPLOYED ON VERCEL</span>
        </div>
        
        {/* Copyright */}
        <p className="text-[10px] text-white/30">
          © 2026 POKE-SCAN • GOTTA SCAN 'EM ALL • HUMANS + AI = FUTURE
        </p>
      </div>
    </footer>
  );
}
