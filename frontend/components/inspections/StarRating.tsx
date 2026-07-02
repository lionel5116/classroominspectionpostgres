'use client';

const LABELS = ['Very poor', 'Poor', 'Fair', 'Good', 'Excellent'];

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

export default function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            className={`text-2xl leading-none ${star <= value ? 'text-hisd-amber' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      {value > 0 && (
        <span className="text-sm text-gray-600">
          {value} of 5 — {LABELS[value - 1]}
        </span>
      )}
    </div>
  );
}
