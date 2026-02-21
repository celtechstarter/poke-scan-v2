import { GitHubLink } from "./GitHubLink";

export function AppFooter() {
  return (
    <footer
      className="mt-auto border-t border-white/10 bg-gray-900/50 backdrop-blur-sm px-4 py-8"
      role="contentinfo"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        {/* Powered by */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Powered by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <span className="text-sm text-white/80">
              <span aria-hidden="true" className="mr-1">🦙</span>
              Llama Vision (NVIDIA NIM)
            </span>
            <span className="text-sm text-white/80">
              <span aria-hidden="true" className="mr-1">📊</span>
              Cardmarket
            </span>
          </div>
        </div>

        {/* Built by */}
        <div className="flex items-center gap-3">
          <p className="text-sm text-white/80">
            Created by <span className="font-semibold text-yellow-400">Marcel Welk</span>
          </p>
          <GitHubLink />
        </div>

        {/* With help from */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            With help from
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
            <span className="text-xs text-gray-400">
              <span aria-hidden="true" className="mr-0.5">🧠</span>
              Claude (Architect)
            </span>
            <span className="text-xs text-gray-400">
              <span aria-hidden="true" className="mr-0.5">🦞</span>
              OpenClaw (Builder)
            </span>
            <span className="text-xs text-gray-400">
              <span aria-hidden="true" className="mr-0.5">⚡</span>
              NVIDIA NIM (AI Infrastructure)
            </span>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-500">
          © 2025 Poke-Scan
        </p>
      </div>
    </footer>
  );
}
