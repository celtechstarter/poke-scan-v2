const techStack = [
  { name: "Gemini Flash", emoji: "✨" },
  { name: "NVIDIA NIM", emoji: "⚡" },
  { name: "TCGdex", emoji: "📦" },
  { name: "Supabase", emoji: "🗄️" },
];

export function AIStatusBar() {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-lg border border-poke-cyan/20 bg-black/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-poke-green" />
          <span className="font-mono text-xs tracking-widest text-poke-green">
            KI-VISION AKTIV
          </span>
        </div>
        <span className="font-mono text-xs text-white/60">
          [ POWERED BY ]
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6">
        {techStack.map((tech) => (
          <div key={tech.name} className="flex items-center gap-2">
            <span aria-hidden="true">{tech.emoji}</span>
            <span className="font-mono text-xs text-white/80">{tech.name}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          </div>
        ))}
      </div>
    </div>
  );
}
