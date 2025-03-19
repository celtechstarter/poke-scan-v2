
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PokeCard } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface CardSliderProps {
  cards: PokeCard[];
  autoPlayInterval?: number;
}

const CardSlider = ({ cards, autoPlayInterval = 5000 }: CardSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Handle automatic sliding
  useEffect(() => {
    if (!isPaused && cards.length > 1) {
      const startTimer = () => {
        timerRef.current = window.setTimeout(() => {
          setIsAnimating(true);
          setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
        }, autoPlayInterval);
      };

      startTimer();

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [currentIndex, isPaused, cards.length, autoPlayInterval]);

  // Reset animation state after transition completes
  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500); // Match with animation duration
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const goToPrevious = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? cards.length - 1 : prevIndex - 1));
  };

  const goToNext = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsAnimating(true);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % cards.length);
  };

  const goToSlide = (index: number) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsAnimating(true);
    setCurrentIndex(index);
  };

  // Placeholder if no cards are available
  if (cards.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">No Pokemon cards available</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden rounded-lg"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Pokemon card slider"
      role="region"
    >
      {/* Cards Container */}
      <div className="h-full relative">
        {cards.map((card, index) => (
          <div
            key={card.id}
            className={cn(
              "absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out",
              index === currentIndex 
                ? "opacity-100 z-10" 
                : "opacity-0 z-0",
              isAnimating && index === currentIndex && "animate-fade-in",
            )}
            aria-hidden={index !== currentIndex}
          >
            <img
              src={card.imageUrl}
              alt={`${card.name} Pokemon Card`}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-3 backdrop-blur-sm">
              <h3 className="text-lg font-bold">{card.name}</h3>
              {card.set && <p className="text-sm">{card.set}</p>}
              {card.price && <p className="text-pokeyellow font-bold">${card.price.toFixed(2)}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white z-20"
        onClick={goToPrevious}
        aria-label="Previous card"
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white z-20"
        onClick={goToNext}
        aria-label="Next card"
      >
        <ChevronRight className="h-6 w-6" />
      </Button>

      {/* Indicator Dots */}
      <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1 z-20">
        {cards.map((_, index) => (
          <button
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentIndex ? "bg-white w-4" : "bg-white/50"
            )}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={index === currentIndex ? "true" : "false"}
          />
        ))}
      </div>
    </div>
  );
};

export default CardSlider;
