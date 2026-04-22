import React, { useMemo } from 'react';

/**
 * Stylized dot-matrix Africa map.
 *
 * How it works:
 *   – The continent is represented as a collection of ellipse "bands" that
 *     together form a recognizable Africa silhouette.
 *   – A regular grid of dots is laid over the whole viewBox; each dot is
 *     kept only if it falls inside one of the bands.
 *   – Cities render as pulsing gold markers on top, with animated arcs
 *     to a central Douala hub.
 *
 * Zero dependencies, renders as pure SVG, looks consistent at any size.
 */

type City = {
  name: string;
  country: string;
  /** 0–1000 x and 0–1050 y, inside the viewBox */
  x: number;
  y: number;
};

type Band = { cx: number; cy: number; rx: number; ry: number };

// Ellipse "bands" that together make the rough silhouette of Africa.
// These were tuned visually to give a solid, recognizable shape.
const BANDS: Band[] = [
  // North Africa (Morocco → Egypt, wide top)
  { cx: 500, cy: 160, rx: 310, ry: 75 },
  // West-African bulge (Mauritania → Nigeria)
  { cx: 380, cy: 300, rx: 170, ry: 110 },
  // Central basin (Cameroon → DRC → Tanzania)
  { cx: 540, cy: 420, rx: 200, ry: 140 },
  // Horn of Africa (Ethiopia, Somalia, Kenya)
  { cx: 720, cy: 400, rx: 95, ry: 110 },
  // Southern Africa (Angola, Zambia, Zimbabwe, SA)
  { cx: 580, cy: 640, rx: 170, ry: 170 },
  // South tip (Cape)
  { cx: 560, cy: 800, rx: 110, ry: 90 },
  // Sahel connector
  { cx: 560, cy: 260, rx: 230, ry: 80 },
];

function isInside(x: number, y: number, bands: Band[]) {
  for (const b of bands) {
    const dx = (x - b.cx) / b.rx;
    const dy = (y - b.cy) / b.ry;
    if (dx * dx + dy * dy <= 1) return true;
  }
  return false;
}

const CITIES: City[] = [
  { name: 'Casablanca',   country: 'Morocco',      x: 310, y: 130 },
  { name: 'Cairo',        country: 'Egypt',        x: 720, y: 175 },
  { name: 'Dakar',        country: 'Senegal',      x: 220, y: 290 },
  { name: 'Accra',        country: 'Ghana',        x: 425, y: 360 },
  { name: 'Lagos',        country: 'Nigeria',      x: 490, y: 360 },
  { name: 'Addis Ababa',  country: 'Ethiopia',     x: 745, y: 390 },
  { name: 'Nairobi',      country: 'Kenya',        x: 735, y: 470 },
  { name: 'Kampala',      country: 'Uganda',       x: 680, y: 445 },
  { name: 'Kinshasa',     country: 'DRC',          x: 555, y: 485 },
  { name: 'Johannesburg', country: 'South Africa', x: 620, y: 740 },
];

const HUB: City = { name: 'Douala', country: 'Cameroon', x: 540, y: 410 };

function arcPath(a: City, b: City, lift = 120) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - lift;
  return `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`;
}

export const AfricaMap: React.FC<{ className?: string }> = ({ className }) => {
  // Generate the dot grid once.
  const dots = useMemo(() => {
    const out: { x: number; y: number }[] = [];
    const step = 18;
    for (let y = 60; y < 900; y += step) {
      for (let x = 140; x < 920; x += step) {
        if (isInside(x, y, BANDS)) out.push({ x, y });
      }
    }
    return out;
  }, []);

  return (
    <svg
      viewBox="0 0 1000 960"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      aria-label="Live SchoolPay coverage across Africa"
      role="img"
    >
      <defs>
        {/* Ambient wave lines like the reference image */}
        <pattern id="waves" width="800" height="800" patternUnits="userSpaceOnUse">
          <path d="M0,400 Q200,320 400,400 T800,400" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.15" />
          <path d="M0,480 Q200,400 400,480 T800,480" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.12" />
          <path d="M0,320 Q200,240 400,320 T800,320" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.12" />
          <path d="M0,560 Q200,480 400,560 T800,560" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.1" />
        </pattern>

        {/* Gradient for the arcs — royal to gold */}
        <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#2563EB" stopOpacity="0" />
          <stop offset="50%"  stopColor="#60a5fa" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
        </linearGradient>

        {/* Soft radial halo behind each city dot */}
        <radialGradient id="cityGlow">
          <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.65" />
          <stop offset="60%"  stopColor="#F59E0B" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ambient waves across the background */}
      <rect width="1000" height="960" fill="url(#waves)" />

      {/* Continent — rendered as a dot matrix */}
      <g fill="#60a5fa">
        {dots.map((d, i) => {
          // Dots near the edge get more color; interior dots are brighter.
          // Cheap depth: vary opacity by a pseudo-random from position.
          const depth = (Math.sin(d.x * 0.07) + Math.cos(d.y * 0.05)) * 0.5 + 0.5;
          const r = 2.2 + depth * 1.2;
          const op = 0.35 + depth * 0.55;
          return <circle key={i} cx={d.x} cy={d.y} r={r} opacity={op} />;
        })}
      </g>

      {/* Arcs: every city → Douala */}
      {CITIES.map((c, i) => (
        <path
          key={`arc-${c.name}`}
          d={arcPath(c, HUB, 100 + (i % 3) * 40)}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="8 1200"
        >
          <animate
            attributeName="stroke-dashoffset"
            values="1200;0;-600"
            dur="6s"
            begin={`${i * 0.5}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;1;0"
            dur="6s"
            begin={`${i * 0.5}s`}
            repeatCount="indefinite"
          />
        </path>
      ))}

      {/* City markers — glow halo + pulsing inner dot */}
      {CITIES.map((c, i) => (
        <g key={c.name}>
          <circle cx={c.x} cy={c.y} r="35" fill="url(#cityGlow)">
            <animate attributeName="r"       values="22;40;22" dur="3s" begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3s" begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={c.x} cy={c.y} r="5" fill="#F59E0B">
            <animate attributeName="r" values="4;7;4" dur="3s" begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={c.x} cy={c.y} r="2" fill="#ffffff" />
        </g>
      ))}

      {/* Douala hub — bigger, with concentric pulsing ring */}
      <g>
        <circle cx={HUB.x} cy={HUB.y} r="50" fill="url(#cityGlow)" opacity="0.9">
          <animate attributeName="r" values="38;60;38" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx={HUB.x} cy={HUB.y} r="14" fill="none" stroke="#F59E0B" strokeWidth="2" opacity="0.9">
          <animate attributeName="r"       values="10;22;10" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0;0.9"  dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx={HUB.x} cy={HUB.y} r="8"  fill="#F59E0B" />
        <circle cx={HUB.x} cy={HUB.y} r="3"  fill="#ffffff" />
      </g>
    </svg>
  );
};
