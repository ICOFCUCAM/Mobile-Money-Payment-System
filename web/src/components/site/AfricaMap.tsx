import React from 'react';

/**
 * Africa map rendered as stroked paths — just like the US reference image.
 *
 * Every country is a simplified polygon with a subtle navy fill and a bright
 * cyan/royal border, matching the fintech style of glowing outlines. Cities
 * sit on top as pulsing gold markers, and arcs animate toward the Douala hub.
 *
 * The paths are approximations (not cartographically exact) — accurate enough
 * for the shape to read as Africa while staying compact and self-contained.
 */

type City = {
  name: string;
  country: string;
  x: number;
  y: number;
};

const CITIES: City[] = [
  { name: 'Casablanca',   country: 'Morocco',      x: 125, y: 85  },
  { name: 'Cairo',        country: 'Egypt',        x: 425, y: 125 },
  { name: 'Dakar',        country: 'Senegal',      x: 58,  y: 220 },
  { name: 'Accra',        country: 'Ghana',        x: 210, y: 275 },
  { name: 'Lagos',        country: 'Nigeria',      x: 275, y: 275 },
  { name: 'Addis Ababa',  country: 'Ethiopia',     x: 445, y: 288 },
  { name: 'Nairobi',      country: 'Kenya',        x: 455, y: 360 },
  { name: 'Kinshasa',     country: 'DRC',          x: 305, y: 380 },
  { name: 'Luanda',       country: 'Angola',       x: 275, y: 430 },
  { name: 'Johannesburg', country: 'South Africa', x: 370, y: 540 },
];

const HUB: City = { name: 'Douala', country: 'Cameroon', x: 295, y: 320 };

function arcPath(a: City, b: City, lift = 80) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - lift;
  return `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`;
}

/**
 * Country polygons — each is a simplified outline in the 600×620 viewBox.
 * Shapes share vertices at borders so the whole continent reads as one map
 * with visible inter-country lines.
 */
const COUNTRIES: { name: string; d: string; shade: string }[] = [
  // North Africa
  { name: 'Morocco',     shade: '#13284f', d: 'M95,60 L170,55 L175,120 L150,140 L105,145 L80,110 Z' },
  { name: 'Algeria',     shade: '#1b3763', d: 'M175,55 L305,70 L320,180 L260,205 L180,175 L150,140 L175,120 Z' },
  { name: 'Tunisia',     shade: '#13284f', d: 'M270,55 L305,70 L300,110 L275,115 Z' },
  { name: 'Libya',       shade: '#13284f', d: 'M305,70 L440,75 L450,180 L360,195 L320,180 Z' },
  { name: 'Egypt',       shade: '#1b3763', d: 'M440,75 L525,85 L530,180 L450,180 Z' },

  // Sahel
  { name: 'Mauritania',  shade: '#1b3763', d: 'M80,145 L180,175 L185,235 L100,245 L55,210 Z' },
  { name: 'Mali',        shade: '#13284f', d: 'M180,175 L260,205 L270,240 L240,275 L185,235 Z' },
  { name: 'Niger',       shade: '#1b3763', d: 'M260,205 L360,195 L370,255 L300,270 L270,240 Z' },
  { name: 'Chad',        shade: '#13284f', d: 'M360,195 L450,180 L445,290 L375,300 L370,255 Z' },
  { name: 'Sudan',       shade: '#1b3763', d: 'M450,180 L530,180 L535,285 L445,290 Z' },

  // West coast
  { name: 'Senegal',     shade: '#1b3763', d: 'M55,210 L100,245 L95,260 L50,260 Z' },
  { name: 'Guinea',      shade: '#13284f', d: 'M100,245 L155,260 L155,280 L95,260 Z' },
  { name: 'S. Leone',    shade: '#1b3763', d: 'M95,260 L125,280 L115,290 L85,275 Z' },
  { name: 'Liberia',     shade: '#13284f', d: 'M115,290 L145,300 L140,315 L110,305 Z' },
  { name: 'Ivory Coast', shade: '#1b3763', d: 'M155,260 L200,255 L210,300 L165,305 L155,280 Z' },
  { name: 'Ghana',       shade: '#13284f', d: 'M200,255 L230,260 L230,305 L210,300 Z' },
  { name: 'Togo',        shade: '#1b3763', d: 'M230,260 L240,262 L238,305 L230,305 Z' },
  { name: 'Benin',       shade: '#13284f', d: 'M240,262 L255,260 L252,300 L238,305 Z' },
  { name: 'Burkina F.',  shade: '#1b3763', d: 'M185,235 L270,240 L265,258 L200,255 L155,260 Z' },

  // Central & West-Central
  { name: 'Nigeria',     shade: '#234477', d: 'M255,260 L300,270 L310,320 L260,325 L252,300 Z' },
  { name: 'Cameroon',    shade: '#1b3763', d: 'M300,270 L370,255 L375,300 L335,345 L310,320 Z' },
  { name: 'CAR',         shade: '#13284f', d: 'M370,255 L445,290 L440,335 L375,340 L375,300 Z' },
  { name: 'S. Sudan',    shade: '#1b3763', d: 'M445,290 L535,285 L525,345 L440,335 Z' },
  { name: 'Eritrea',     shade: '#13284f', d: 'M500,225 L545,225 L540,270 L510,265 Z' },
  { name: 'Ethiopia',    shade: '#234477', d: 'M450,290 L540,270 L555,345 L475,360 L440,335 Z' },
  { name: 'Somalia',     shade: '#1b3763', d: 'M540,270 L580,275 L585,355 L555,345 Z' },

  // Equatorial
  { name: 'Gabon',       shade: '#13284f', d: 'M285,325 L320,325 L320,370 L280,370 Z' },
  { name: 'R. Congo',    shade: '#1b3763', d: 'M320,325 L355,345 L355,395 L320,395 L320,370 Z' },
  { name: 'DRC',         shade: '#234477', d: 'M335,345 L440,335 L445,420 L355,445 L320,395 L355,395 L355,345 Z' },
  { name: 'Uganda',      shade: '#1b3763', d: 'M440,335 L470,340 L470,370 L445,370 Z' },
  { name: 'Kenya',       shade: '#13284f', d: 'M470,340 L555,345 L540,395 L470,395 L470,370 Z' },
  { name: 'Rwanda',      shade: '#13284f', d: 'M440,370 L458,370 L458,385 L440,385 Z' },
  { name: 'Burundi',     shade: '#1b3763', d: 'M440,385 L458,385 L458,400 L440,400 Z' },
  { name: 'Tanzania',    shade: '#1b3763', d: 'M445,395 L540,395 L530,465 L450,470 L445,420 Z' },

  // Southern
  { name: 'Angola',      shade: '#1b3763', d: 'M280,370 L355,395 L355,445 L315,475 L255,470 L260,410 Z' },
  { name: 'Zambia',      shade: '#13284f', d: 'M355,445 L450,470 L440,505 L370,510 L355,480 Z' },
  { name: 'Malawi',      shade: '#1b3763', d: 'M450,470 L475,475 L475,520 L455,520 Z' },
  { name: 'Mozambique',  shade: '#234477', d: 'M455,500 L530,460 L530,570 L470,595 L455,555 Z' },
  { name: 'Zimbabwe',    shade: '#1b3763', d: 'M370,510 L450,505 L445,555 L385,555 Z' },
  { name: 'Botswana',    shade: '#13284f', d: 'M325,515 L385,510 L400,560 L340,565 Z' },
  { name: 'Namibia',     shade: '#1b3763', d: 'M260,470 L315,475 L325,515 L340,565 L285,580 L260,540 Z' },
  { name: 'South Africa',shade: '#234477', d: 'M285,580 L400,560 L445,555 L470,595 L440,615 L335,620 L290,600 Z' },
  { name: 'Lesotho',     shade: '#1b3763', d: 'M395,590 L415,590 L415,605 L395,605 Z' },

  // Madagascar
  { name: 'Madagascar',  shade: '#234477', d: 'M550,460 L575,455 L580,540 L555,545 Z' },
];

export const AfricaMap: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 600 640"
    className={className}
    preserveAspectRatio="xMidYMid meet"
    aria-label="Live SchoolPay coverage across Africa"
    role="img"
  >
    <defs>
      {/* Ambient wave lines in the background */}
      <pattern id="heroWaves" width="800" height="800" patternUnits="userSpaceOnUse">
        <path d="M0,260 Q200,200 400,260 T800,260" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.12" />
        <path d="M0,340 Q200,280 400,340 T800,340" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.1"  />
        <path d="M0,200 Q200,140 400,200 T800,200" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.09" />
        <path d="M0,420 Q200,360 400,420 T800,420" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.09" />
      </pattern>

      {/* Arc gradient royal → gold */}
      <linearGradient id="heroArc" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stopColor="#2563EB" stopOpacity="0" />
        <stop offset="50%"  stopColor="#60a5fa" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
      </linearGradient>

      {/* City halo */}
      <radialGradient id="heroCityGlow">
        <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.75" />
        <stop offset="60%"  stopColor="#F59E0B" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
      </radialGradient>
    </defs>

    <rect width="600" height="640" fill="url(#heroWaves)" />

    {/* Country polygons — filled navy, bright border */}
    <g stroke="#7dd3fc" strokeWidth="0.9" strokeLinejoin="round">
      {COUNTRIES.map((c) => (
        <path key={c.name} d={c.d} fill={c.shade} />
      ))}
    </g>

    {/* Arcs from every city to the Douala hub */}
    {CITIES.map((c, i) => (
      <path
        key={`arc-${c.name}`}
        d={arcPath(c, HUB, 60 + (i % 3) * 25)}
        fill="none"
        stroke="url(#heroArc)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="6 800"
      >
        <animate
          attributeName="stroke-dashoffset"
          values="800;0;-400"
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

    {/* City markers — glow halo + pulsing dot */}
    {CITIES.map((c, i) => (
      <g key={c.name}>
        <circle cx={c.x} cy={c.y} r="20" fill="url(#heroCityGlow)">
          <animate attributeName="r"       values="14;24;14" dur="3s" begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.35;0.9;0.35" dur="3s" begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
        </circle>
        <circle cx={c.x} cy={c.y} r="3.2" fill="#F59E0B">
          <animate attributeName="r" values="2.5;4.5;2.5" dur="3s" begin={`${(i * 0.3) % 3}s`} repeatCount="indefinite" />
        </circle>
        <circle cx={c.x} cy={c.y} r="1.4" fill="#ffffff" />
      </g>
    ))}

    {/* Douala hub — bigger marker with a concentric pulse ring */}
    <g>
      <circle cx={HUB.x} cy={HUB.y} r="28" fill="url(#heroCityGlow)" opacity="0.9">
        <animate attributeName="r" values="22;34;22" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={HUB.x} cy={HUB.y} r="9" fill="none" stroke="#F59E0B" strokeWidth="1.4" opacity="0.9">
        <animate attributeName="r"       values="6;14;6" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0;0.9" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <circle cx={HUB.x} cy={HUB.y} r="5"   fill="#F59E0B" />
      <circle cx={HUB.x} cy={HUB.y} r="1.8" fill="#ffffff" />
    </g>
  </svg>
);
