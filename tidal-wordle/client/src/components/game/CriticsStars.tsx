import { getStarEmptyUrl, getStarFilledUrl } from '../../lib/cardAssets';

interface CriticsStarsProps {
  count: number;
  max?: number;
  className?: string;
}

export default function CriticsStars({
  count,
  max = 5,
  className = '',
}: CriticsStarsProps) {
  return (
    <span className={`inline-flex gap-0.5 align-middle ${className}`}>
      {Array.from({ length: max }, (_, i) => (
        <img
          key={i}
          src={i < count ? getStarFilledUrl() : getStarEmptyUrl()}
          alt=""
          className="w-4 h-4 inline-block"
        />
      ))}
    </span>
  );
}
