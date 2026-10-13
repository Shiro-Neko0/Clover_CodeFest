import { useMemo } from 'react';
import './AnimatedBackground.css';

// Animated teal background that sits behind the whole app.
// It is decoration only: it ignores clicks and screen readers skip it.
// Change the colours in AnimatedBackground.css, not here.

const rand = (min, max) => min + Math.random() * (max - min);

export default function AnimatedBackground() {
  // The dots are made once. Fewer dots on small phones so the app stays smooth and saves battery.
  const dots = useMemo(() => {
    const count = window.innerWidth < 600 ? 24 : 50;
    return Array.from({ length: count }, () => ({
      left: rand(0, 100),
      top: rand(20, 100),
      size: rand(1, 4),
      dx: rand(-8, 8),
      dy: -rand(10, 30),
      opacity: rand(0.15, 0.5),
      duration: rand(10, 22),
      delay: -rand(0, 20) // a negative delay means every dot is already part-way through its trip when the page opens
    }));
  }, []);

  return (
    <div className="bgfx" aria-hidden="true">
      <div className="bgfx-sphere bgfx-s1" />
      <div className="bgfx-sphere bgfx-s2" />
      <div className="bgfx-sphere bgfx-s3" />
      <div className="bgfx-glow" />
      <div className="bgfx-grid" />
      <div className="bgfx-noise" />
      <div className="bgfx-dots">
        {dots.map((d, i) => (
          <span
            key={i}
            className="bgfx-dot"
            style={{
              left: `${d.left}%`,
              top: `${d.top}%`,
              width: d.size,
              height: d.size,
              '--dx': `${d.dx}vw`,
              '--dy': `${d.dy}vh`,
              '--o': d.opacity,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`
            }}
          />
        ))}
      </div>
    </div>
  );
}
