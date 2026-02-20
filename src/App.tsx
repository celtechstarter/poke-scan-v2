import CardScanner from "./components/CardScanner";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600">
      <header className="py-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">🃏 Poke-Scan</h1>
        <p className="text-white/80">Pokémon-Karte scannen → Preis erfahren</p>
      </header>
      <main className="pb-8">
        <CardScanner />
      </main>
      <footer className="py-4 text-center text-white/60 text-sm">
        <p>Powered by Kimi K2.5 Vision & Cardmarket</p>
        <p className="mt-1">Made with 💛 by KI-Agenten</p>
      </footer>
    </div>
  );
}

export default App;