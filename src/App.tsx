import { AppHeader } from "./components/AppHeader";
import { AppFooter } from "./components/AppFooter";
import CardScanner from "./components/CardScanner";

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0f172a]">
      <AppHeader />

      <main id="main-content" className="flex flex-1 flex-col items-center px-4 py-10 md:py-16">
        <div className="mb-6 text-center animate-fade-in">
          <h2 className="text-xl font-semibold text-white md:text-2xl">
            Lade ein Foto deiner Karte hoch
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Wir identifizieren sie und zeigen dir den aktuellen Marktpreis.
          </p>
        </div>

        <CardScanner />
      </main>

      <AppFooter />
    </div>
  );
}

export default App;
