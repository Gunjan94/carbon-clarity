// SiteMap — the live map of Meridian Industries' 200 buildings across 15
// countries. Each building is a circle sized by its Scope 1+2 footprint and
// coloured by emissions intensity; click a building to drill into its detail.
//
// Keyless CartoDB basemaps (no API token) — consistent with the no-credentials
// ethos. Vector CircleMarkers (not icon markers) avoid the Leaflet/Vite
// marker-image bundling issue.
import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { SiteRow } from "../api";
import { fmtTonnes } from "../format";
import { getMode, chart } from "../theme";

const TILES: Record<string, { url: string; attribution: string }> = {
  light: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
};

/** Colour a site by its Scope 1+2 footprint relative to the largest site. */
function siteColor(tco2e: number, max: number): string {
  const f = max > 0 ? tco2e / max : 0;
  if (f >= 0.6) return chart.danger;
  if (f >= 0.3) return chart.warn;
  return chart.brand;
}

/** Marker radius scales with sqrt of emissions so area ~ emissions. */
function siteRadius(tco2e: number, max: number): number {
  const f = max > 0 ? Math.sqrt(tco2e / max) : 0;
  return 4 + f * 16;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [map]);
  return null;
}

export interface SiteMapProps {
  sites: SiteRow[];
  center: [number, number];
  zoom?: number;
  maxSite: number;
  onSelect?: (s: SiteRow) => void;
  selectedId?: string;
  className?: string;
}

export default function SiteMap({
  sites,
  center,
  zoom = 3,
  maxSite,
  onSelect,
  selectedId,
  className = "h-[380px] sm:h-[480px] lg:h-[560px]",
}: SiteMapProps) {
  const mode = getMode();
  const tile = TILES[mode] ?? TILES.light;

  return (
    <div className={`relative w-full overflow-hidden rounded-2xl border border-line ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        worldCopyJump
        style={{ height: "100%", width: "100%", background: chart.panel2 }}
      >
        <TileLayer key={mode} url={tile.url} attribution={tile.attribution} />
        <MapResizer />
        {sites.map((s) => {
          const selected = selectedId === s.id;
          const color = siteColor(s.scope1_2_tco2e, maxSite);
          return (
            <CircleMarker
              key={s.id}
              center={[s.lat, s.lng]}
              radius={siteRadius(s.scope1_2_tco2e, maxSite)}
              pathOptions={{
                color: selected ? chart.text1 : color,
                weight: selected ? 3 : 1,
                fillColor: color,
                fillOpacity: 0.7,
              }}
              eventHandlers={onSelect ? { click: () => onSelect(s) } : undefined}
            >
              <Tooltip>
                <div style={{ fontWeight: 700 }}>
                  {s.id} · {s.country_name}
                </div>
                <div style={{ textTransform: "capitalize" }}>{s.type}</div>
                <div>{fmtTonnes(s.scope1_2_tco2e)} tCO2e (Scope 1+2)</div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

/** Legend for the site map: marker size = emissions, colour = intensity. */
export function SiteMapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text2">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-full" style={{ background: chart.brand }} />
        lower emissions
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-full" style={{ background: chart.warn }} />
        medium
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded-full" style={{ background: chart.danger }} />
        highest emitters
      </span>
      <span className="opacity-80">· circle size = Scope 1+2 footprint</span>
    </div>
  );
}
