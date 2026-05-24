/**
 * Screen-level weather decoration — sits above the 3D canvas / page bg.
 * Reads weatherStore and renders:
 *   - falling rain streaks for rain / thunder
 *   - drifting snow flakes for snow
 *   - subtle desaturation veil for fog
 * Pure CSS, no per-frame React updates.
 */
import { useWeatherStore } from '../../stores/weatherStore';

export default function WeatherOverlay() {
  const snap = useWeatherStore((s) => s.snapshot);
  if (!snap) return null;

  const isRain = snap.condition === 'rain' || snap.condition === 'thunder';
  const isSnow = snap.condition === 'snow';
  const isFog = snap.condition === 'fog';

  return (
    <div className="pointer-events-none fixed inset-0 z-[15] overflow-hidden">
      {isRain && <RainStreaks heavy={snap.condition === 'thunder'} />}
      {isSnow && <SnowFlakes />}
      {isFog && <div className="absolute inset-0 bg-white/15 backdrop-blur-[2px]" />}
    </div>
  );
}

function RainStreaks({ heavy }: { heavy: boolean }) {
  const count = heavy ? 90 : 55;
  const streaks = Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100;
    const delay = -Math.random() * 1.2;
    const dur = 0.6 + Math.random() * 0.45;
    const opacity = 0.25 + Math.random() * 0.4;
    return (
      <span
        key={i}
        className="weather-rain-streak"
        style={{
          left: `${left}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${dur}s`,
          opacity,
        }}
      />
    );
  });
  return <>{streaks}</>;
}

function SnowFlakes() {
  const flakes = Array.from({ length: 70 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = -Math.random() * 8;
    const dur = 5 + Math.random() * 6;
    const size = 2 + Math.random() * 3;
    return (
      <span
        key={i}
        className="weather-snow-flake"
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDelay: `${delay}s`,
          animationDuration: `${dur}s`,
        }}
      />
    );
  });
  return <>{flakes}</>;
}
