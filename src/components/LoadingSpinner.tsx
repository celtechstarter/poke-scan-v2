import { AnimatedPokeball } from "./AnimatedPokeball";

export function LoadingSpinner({ message = "Scanne Karte..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <AnimatedPokeball size={56} />
      <p className="text-sm font-medium text-gray-400">{message}</p>
      <span className="sr-only">Lädt, bitte warten.</span>
    </div>
  );
}
