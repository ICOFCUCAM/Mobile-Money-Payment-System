import React from 'react';

type City = {
  name: string;
  country: string;
  /** 0–500 coordinates inside the map viewBox */
  x: number;
  y: number;
};

/**
 * Stylized Africa with:
 *   – simplified continent path
 *   – pulsing gold dots for live cities
 *   – animated arcs from each city to the central hub (Douala)
 *   – kente-inspired background pattern (very low opacity)
 *
 * Pure SVG, no external image. Never fails to load.
 */
const CITIES: City[] = [
  { name: 'Casablanca', country: 'Morocco',  x: 175, y: 95  },
  { name: 'Cairo',      country: 'Egypt',    x: 345, y: 105 },
  { name: 'Dakar',      country: 'Senegal',  x: 140, y: 195 },
  { name: 'Accra',      country: 'Ghana',    x: 225, y: 240 },
  { name: 'Lagos',      country: 'Nigeria',  x: 260, y: 240 },
  { name: 'Addis Ababa',country: 'Ethiopia', x: 370, y: 245 },
  { name: 'Nairobi',    country: 'Kenya',    x: 380, y: 295 },
  { name: 'Kampala',    country: 'Uganda',   x: 355, y: 280 },
  { name: 'Kinshasa',   country: 'DRC',      x: 295, y: 315 },
  { name: 'Johannesburg',country: 'South Africa', x: 325, y: 420 },
];

/** Central hub city the arcs terminate at (Douala, Cameroon). */
const HUB: City = { name: 'Douala', country: 'Cameroon', x: 290, y: 270 };

/**
 * Build a curved SVG path between two points using a quadratic Bezier
 * whose control point is raised above the midline to make a nice arc.
 */
function arcPath(a: City, b: City, lift = 55) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - lift;
  return `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`;
}

export const AfricaMap: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 500 520"
    className={className}
    aria-label="Live SchoolPay coverage across Africa"
    role="img"
  >
    <defs>
      {/* Country fill gradient — slightly lighter than the hero background */}
      <linearGradient id="africaFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#1b3763" />
        <stop offset="100%" stopColor="#13284f" />
      </linearGradient>

      {/* Arc gradient — royal blue to gold */}
      <linearGradient id="arcGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#2563EB" stopOpacity="0" />
        <stop offset="50%"  stopColor="#60a5fa" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
      </linearGradient>

      {/* Soft radial glow used behind each live dot */}
      <radialGradient id="dotGlow">
        <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.6" />
        <stop offset="60%"  stopColor="#F59E0B" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
      </radialGradient>

      {/* Kente-inspired subtle diamond pattern, 3-5% opacity */}
      <pattern id="kente" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M16 0 L32 16 L16 32 L0 16 Z" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.06" />
        <path d="M16 8 L24 16 L16 24 L8 16 Z" fill="#F59E0B" opacity="0.04" />
      </pattern>

      {/* Soft wave pattern behind the map, like the reference image */}
      <pattern id="waves" width="600" height="600" patternUnits="userSpaceOnUse">
        <path d="M0,300 Q150,240 300,300 T600,300" fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity="0.15" />
        <path d="M0,360 Q150,300 300,360 T600,360" fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity="0.1" />
        <path d="M0,240 Q150,180 300,240 T600,240" fill="none" stroke="#60a5fa" strokeWidth="0.5" opacity="0.1" />
      </pattern>
    </defs>

    {/* Background wash: kente + waves, both at very low opacity */}
    <rect width="500" height="520" fill="url(#kente)" />
    <rect width="500" height="520" fill="url(#waves)" />

    {/*
     * Simplified Africa continent path — hand-traced approximation, clean
     * enough to be recognizable at hero scale.
     */}
    <path
      d="
        M 188 90
        C 200 82, 215 78, 232 80
        L 262 75
        C 285 72, 310 74, 335 80
        L 362 88
        C 380 95, 395 108, 402 124
        L 408 148
        C 410 170, 405 192, 395 212
        L 388 232
        C 385 252, 395 270, 408 285
        L 420 305
        C 425 325, 420 348, 405 368
        L 388 392
        C 370 415, 348 432, 328 450
        L 310 470
        C 292 478, 275 478, 258 470
        L 240 458
        C 228 442, 220 422, 218 400
        L 218 378
        C 222 355, 230 332, 232 308
        L 228 285
        C 215 265, 205 242, 200 218
        L 195 198
        C 188 175, 185 152, 190 128
        L 192 108
        Z
      "
      fill="url(#africaFill)"
      stroke="#60a5fa"
      strokeWidth="1"
      strokeOpacity="0.4"
    />

    {/* Madagascar — small ellipse to the east */}
    <ellipse cx="400" cy="380" rx="14" ry="32" fill="url(#africaFill)" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.4" />

    {/* Arcs from every city → hub (Douala). Each arc draws in over ~2s then holds. */}
    {CITIES.map((c, i) => (
      <path
        key={`arc-${c.name}`}
        d={arcPath(c, HUB, 50 + (i % 3) * 20)}
        fill="none"
        stroke="url(#arcGrad)"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeDasharray="4 600"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="600;0;-300"
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

    {/* City dots — each has an outer glow halo + a pulsing inner dot */}
    {CITIES.map((c, i) => (
      <g key={c.name}>
        <circle cx={c.x} cy={c.y} r="18" fill="url(#dotGlow)">
          <animate attributeName="r" values="12;22;12" dur="3s" begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3s" begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
        </circle>
        <circle cx={c.x} cy={c.y} r="3" fill="#F59E0B">
          <animate attributeName="r" values="2.5;4;2.5" dur="3s" begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
        </circle>
        <circle cx={c.x} cy={c.y} r="1.2" fill="#ffffff" />
      </g>
    ))}

    {/* Hub — slightly larger, with a ring */}
    <g>
      <circle cx={HUB.x} cy={HUB.y} r="26" fill="url(#dotGlow)" opacity="0.9">
        <animate attributeName="r" values="20;32;20" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={HUB.x} cy={HUB.y} r="8" fill="none" stroke="#F59E0B" strokeWidth="1.5" opacity="0.9">
        <animate attributeName="r" values="6;12;6" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0;0.9" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={HUB.x} cy={HUB.y} r="5" fill="#F59E0B" />
      <circle cx={HUB.x} cy={HUB.y} r="2" fill="#ffffff" />
    </g>
  </svg>
);
