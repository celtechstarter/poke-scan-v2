import { NeuralPokemonBackground } from "./components/poke-scan/neural-background";
import { EnergyParticles } from "./components/poke-scan/energy-particles";
import { PokeScanHeader } from "./components/poke-scan/poke-scan-header";
import { AIStatusBar } from "./components/poke-scan/ai-status-bar";
import { TechStackPokedex } from "./components/poke-scan/tech-stack-pokedex";
import { CardScanner } from "./components/poke-scan/card-scanner";
import { TrainerFooter } from "./components/poke-scan/trainer-footer";

function App() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f] text-white">
      {/* Background layers */}
      <NeuralPokemonBackground />
      <EnergyParticles count={25} />

      {/* Main content */}
      <div className="relative z-10">
        <PokeScanHeader />

        <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-12">
          <AIStatusBar />

          <div className="grid gap-8 lg:grid-cols-[1fr_auto]">
            <CardScanner />
            <TechStackPokedex />
          </div>
        </main>

        <TrainerFooter />
      </div>
    </div>
  );
}

export default App;
