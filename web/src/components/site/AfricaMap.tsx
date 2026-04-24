import React from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import countries110m from 'world-atlas/countries-110m.json';

/**
 * Africa map rendered from real Natural Earth 110m country geometry.
 *
 * Uses the topojson shipped by the `world-atlas` package (Mike Bostock /
 * d3-geo). We filter to the 54 African countries by ISO numeric code, project
 * into an equirectangular view tuned for the continent, and render every
 * country as a Geography with navy fill + cyan border — matching the US map
 * reference image. City markers and animated arcs are drawn on top.
 */

// ISO 3166-1 numeric codes for the African continent.
// Keeping this list explicit means we don't accidentally include the
// Middle East or Madagascar's neighbours from the world topology.
const AFRICA_ISO: Set<string> = new Set([
  '012', // Algeria
  '024', // Angola
  '072', // Botswana
  '086', // British Indian Ocean Territory — excluded visually below
  '108', // Burundi
  '120', // Cameroon
  '132', // Cape Verde
  '140', // Central African Republic
  '148', // Chad
  '174', // Comoros
  '178', // Republic of the Congo
  '180', // Democratic Republic of the Congo
  '204', // Benin
  '226', // Equatorial Guinea
  '231', // Ethiopia
  '232', // Eritrea
  '262', // Djibouti
  '266', // Gabon
  '270', // Gambia
  '288', // Ghana
  '324', // Guinea
  '384', // Côte d'Ivoire
  '404', // Kenya
  '426', // Lesotho
  '430', // Liberia
  '434', // Libya
  '450', // Madagascar
  '454', // Malawi
  '466', // Mali
  '478', // Mauritania
  '480', // Mauritius
  '504', // Morocco
  '508', // Mozambique
  '516', // Namibia
  '562', // Niger
  '566', // Nigeria
  '624', // Guinea-Bissau
  '646', // Rwanda
  '678', // São Tomé and Príncipe
  '686', // Senegal
  '690', // Seychelles
  '694', // Sierra Leone
  '706', // Somalia
  '710', // South Africa
  '716', // Zimbabwe
  '728', // South Sudan
  '729', // Sudan
  '732', // Western Sahara
  '748', // Eswatini
  '768', // Togo
  '788', // Tunisia
  '800', // Uganda
  '818', // Egypt
  '834', // Tanzania
  '894', // Zambia
]);

// Pre-filter the topojson to keep only African geometries. This cuts the
// runtime render work and means Geographies().filter doesn't ship world data
// down to the browser unnecessarily.
const africaTopo: typeof countries110m = {
  ...countries110m,
  objects: {
    ...countries110m.objects,
    countries: {
      ...countries110m.objects.countries,
      geometries: (countries110m.objects.countries as any).geometries.filter(
        (g: any) => AFRICA_ISO.has(g.id)
      )
    }
  }
} as any;

// Cities on the map. Coordinates are real-world lat/lon (Lng, Lat for
// react-simple-maps' ProjectionConfig); the component converts them via the
// same projection as the geometries, so markers land in the right spot
// automatically regardless of zoom/scale.
type City = {
  name: string;
  country: string;
  coordinates: [number, number]; // [lng, lat]
};

const CITIES: City[] = [
  { name: 'Casablanca',   country: 'Morocco',      coordinates: [-7.59,  33.57] },
  { name: 'Cairo',        country: 'Egypt',        coordinates: [31.24,  30.04] },
  { name: 'Dakar',        country: 'Senegal',      coordinates: [-17.45, 14.69] },
  { name: 'Accra',        country: 'Ghana',        coordinates: [-0.19,   5.60] },
  { name: 'Lagos',        country: 'Nigeria',      coordinates: [ 3.38,   6.52] },
  { name: 'Douala',       country: 'Cameroon',     coordinates: [ 9.70,   4.05] },
  { name: 'Addis Ababa',  country: 'Ethiopia',     coordinates: [38.75,   9.03] },
  { name: 'Nairobi',      country: 'Kenya',        coordinates: [36.82,  -1.29] },
  { name: 'Kinshasa',     country: 'DRC',          coordinates: [15.27,  -4.44] },
  { name: 'Luanda',       country: 'Angola',       coordinates: [13.23,  -8.84] },
  { name: 'Johannesburg', country: 'South Africa', coordinates: [28.05, -26.20] }
];

const byName = (n: string) => CITIES.find((c) => c.name === n)!;

// Curated point-to-point routes. A mix of pairs so flow reads as a
// continental network rather than a hub-and-spoke collapse onto one city.
// Each endpoint appears at most twice to keep the map visually balanced.
const ROUTES: Array<[City, City]> = [
  [byName('Casablanca'),   byName('Cairo')],
  [byName('Dakar'),        byName('Lagos')],
  [byName('Accra'),        byName('Addis Ababa')],
  [byName('Lagos'),        byName('Nairobi')],
  [byName('Douala'),       byName('Johannesburg')],
  [byName('Kinshasa'),     byName('Dakar')],
  [byName('Luanda'),       byName('Nairobi')],
  [byName('Addis Ababa'),  byName('Casablanca')],
  [byName('Cairo'),        byName('Johannesburg')],
  [byName('Douala'),       byName('Accra')]
];

// Projection tuned to the African continent.
const PROJECTION_CONFIG = {
  rotate: [-20, -3, 0] as [number, number, number],
  scale: 380,
  center: [0, 5] as [number, number]
};

/**
 * Given two (lng,lat) points, return an SVG Q-curve path between their
 * projected positions. We project in React by using a hidden helper: the
 * <Marker> component internally runs the projection, but we need the screen
 * coordinates for a curve. react-simple-maps exposes geoPath via context;
 * here we approximate with a simple linear interpolation in lng/lat and let
 * the projection render each sample point in place.
 *
 * For a premium feel we instead project with d3-geo directly so the curves
 * are rendered in screen space.
 */
import { geoEqualEarth, geoPath } from 'd3-geo';

const projection = geoEqualEarth()
  .rotate(PROJECTION_CONFIG.rotate)
  .scale(PROJECTION_CONFIG.scale)
  .center(PROJECTION_CONFIG.center)
  .translate([400, 340]); // viewBox center

function project(lngLat: [number, number]): [number, number] {
  const p = projection(lngLat);
  return p ? [p[0], p[1]] : [0, 0];
}

function arc(a: City, b: City, lift = 90): string {
  const [ax, ay] = project(a.coordinates);
  const [bx, by] = project(b.coordinates);
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 - lift;
  return `M${ax},${ay} Q${mx},${my} ${bx},${by}`;
}

export const AfricaMap: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className}>
      <ComposableMap
        width={800}
        height={680}
        projection="geoEqualEarth"
        projectionConfig={PROJECTION_CONFIG}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Ambient wave lines behind the continent — purely decorative */}
        <defs>
          <linearGradient id="heroArc" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#2563EB" stopOpacity="0" />
            <stop offset="50%"  stopColor="#60a5fa" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="1" />
          </linearGradient>
          <radialGradient id="cityGlow">
            <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.8" />
            <stop offset="60%"  stopColor="#F59E0B" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
          <pattern id="heroWaves" width="800" height="800" patternUnits="userSpaceOnUse">
            <path d="M0,300 Q200,230 400,300 T800,300" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.1" />
            <path d="M0,380 Q200,310 400,380 T800,380" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.08"/>
            <path d="M0,220 Q200,150 400,220 T800,220" fill="none" stroke="#60a5fa" strokeWidth="1" opacity="0.08"/>
          </pattern>
        </defs>

        <rect x={-100} y={-100} width={1000} height={880} fill="url(#heroWaves)" />

        {/* The map itself — every African country rendered from real Natural
            Earth geometry. Navy fill, cyan border, no hover pop-ups. */}
        <Geographies geography={africaTopo as any}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default:  { fill: '#1b3763', stroke: '#7dd3fc', strokeWidth: 0.7, outline: 'none' },
                  hover:    { fill: '#234477', stroke: '#F59E0B', strokeWidth: 1.1, outline: 'none' },
                  pressed:  { fill: '#234477', stroke: '#F59E0B', strokeWidth: 1.1, outline: 'none' }
                }}
              />
            ))
          }
        </Geographies>

        {/* Animated point-to-point routes. Each is its own great-circle-ish
            arc between two real cities; staggered start delays keep the
            overall rhythm feeling like a living network. */}
        {ROUTES.map(([from, to], i) => (
          <path
            key={`route-${from.name}-${to.name}`}
            d={arc(from, to, 80 + (i % 4) * 25)}
            fill="none"
            stroke="url(#heroArc)"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeDasharray="6 800"
          >
            <animate
              attributeName="stroke-dashoffset"
              values="800;0;-400"
              dur="6s"
              begin={`${(i * 0.6) % 6}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur="6s"
              begin={`${(i * 0.6) % 6}s`}
              repeatCount="indefinite"
            />
          </path>
        ))}

        {/* City markers — glow halo + pulsing gold dot, white center */}
        {CITIES.map((c, i) => {
          const [cx, cy] = project(c.coordinates);
          const delay = `${(i * 0.3) % 3}s`;
          return (
            <g key={c.name}>
              <circle cx={cx} cy={cy} r={22} fill="url(#cityGlow)">
                <animate attributeName="r"       values="15;26;15"       dur="3s" begin={delay} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.35;0.9;0.35"  dur="3s" begin={delay} repeatCount="indefinite" />
              </circle>
              <circle cx={cx} cy={cy} r={3.2} fill="#F59E0B">
                <animate attributeName="r" values="2.5;4.5;2.5" dur="3s" begin={delay} repeatCount="indefinite" />
              </circle>
              <circle cx={cx} cy={cy} r={1.4} fill="#ffffff" />
            </g>
          );
        })}

      </ComposableMap>
    </div>
  );
};
