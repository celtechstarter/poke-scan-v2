const agents = [
  { name: "CLAUDE", emoji: "🧠", status: "LIVE" },
  { name: "OPENCLAW", emoji: "🦞", status: "LIVE" },
  { name: "LLAMA", emoji: "🦙", status: "LIVE" },
  { name: "v0", emoji: "🎨", status: "LIVE" },
];

export function AIStatusBar() {
  return (
    <div className="mx-auto w-full max-w-3xl rounded-lg border border-poke-cyan/20 bg-black/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-poke-green" />
          <span className="font-mono text-xs tracking-widest text-poke-green">
            NEURAL SWARM ACTIVE
          </span>
        </div>
        <span className="font-mono text-xs text-white/60">
          [ 4 AI AGENTS ONLINE ]
        </span>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4">
        {agents.map((agent) => (
          <div key={agent.name} className="flex items-center gap-2">
            <span aria-hidden="true">{agent.emoji}</span>
            <span className="font-mono text-xs text-white/80">{agent.name}</span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-poke-green" />
              <span className="font-mono text-[10px] text-poke-green">{agent.status}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
