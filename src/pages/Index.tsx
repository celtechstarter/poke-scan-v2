
import CardSlider from '@/components/CardSlider';
import { getMockCards } from '@/utils/cardMarketService';
import { Button } from '@/components/ui/button';
import { Camera, Award, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const mockCards = getMockCards();

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="flex flex-col items-center text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pokeblue to-pokered bg-clip-text text-transparent">
            PokeScan v2
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-8">
            Scanne deine Pokemon-Karten und erfahre sofort ihren aktuellen Marktwert
          </p>
          <Button size="lg" className="bg-pokered hover:bg-pokered-dark" asChild>
            <Link to="/scan" className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Jetzt Karte scannen
            </Link>
          </Button>
        </div>

        {/* Card Slider */}
        <div className="max-w-4xl mx-auto shadow-xl rounded-xl overflow-hidden">
          <CardSlider cards={mockCards} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gray-50 rounded-xl mb-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Entdecke Deine Sammlung
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="p-3 bg-pokeblue-light rounded-full mb-4">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Schnelle Erkennung</h3>
              <p className="text-gray-600">
                Halte deine Karten vor die Kamera und erhalte in Sekundenschnelle die Kartendaten.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="p-3 bg-pokered-light rounded-full mb-4">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Präzise Werte</h3>
              <p className="text-gray-600">
                Aktuelle Preise direkt von CardMarket.com für eine realistische Bewertung.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center text-center">
              <div className="p-3 bg-pokeyellow rounded-full mb-4">
                <Gift className="h-8 w-8 text-black" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sammler-Freundlich</h3>
              <p className="text-gray-600">
                Benutzerfreundliches Design für Sammler jeden Alters und jeder Erfahrungsstufe.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mb-12 bg-gradient-to-r from-pokeblue to-pokered p-8 rounded-xl text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Bereit, deine Sammlung zu bewerten?</h2>
            <p className="text-white/80">
              Scanne jetzt deine ersten Karten und entdecke ihren wahren Wert.
            </p>
          </div>
          <Button size="lg" className="bg-white text-pokeblue hover:bg-gray-100" asChild>
            <Link to="/scan">
              Zum Scanner
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Home;
