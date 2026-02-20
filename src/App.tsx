import React from 'react';
import CardScanner from './components/CardScanner';

const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-500 text-white p-4 text-center">
        <h1 className="text-3xl font-bold">Poke-Scan</h1>
      </header>
      <main className="flex-1 p-4">
        <CardScanner />
      </main>
      <footer className="bg-blue-500 text-white p-4 text-center">
        <p>Powered by Kimi K2.5</p>
      </footer>
    </div>
  );
};

export default App;