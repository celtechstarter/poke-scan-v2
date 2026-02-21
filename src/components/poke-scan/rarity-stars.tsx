interface RarityStarsProps {
  rating: number;
  label: string;
}

export function RarityStars({ rating, label }: RarityStarsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? "text-poke-yellow" : "text-white/20"}
            style={star <= rating ? { textShadow: "0 0 8px rgba(250, 204, 21, 0.5)" } : {}}
          >
            ★
          </span>
        ))}
      </div>
      <span className="font-mono text-[10px] text-poke-yellow">{label}</span>
    </div>
  );
}
