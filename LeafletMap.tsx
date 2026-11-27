import { useEffect, useRef } from "react";
import type { Map as LMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

const PIN = `
<svg width="38" height="48" viewBox="0 0 38 48" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 47s16-15.6 16-28A16 16 0 0 0 3 19c0 12.4 16 28 16 28z" style="fill:var(--primary);stroke:var(--primary-foreground);stroke-width:2.5"/>
  <circle cx="19" cy="19" r="6.5" style="fill:var(--gold)"/>
</svg>`;

/**
 * Interactive OpenStreetMap map (Leaflet), loaded only in the browser.
 * Pass `onPick` to let the user choose a location by tapping or dragging the pin.
 */
export function LeafletMap({
  lat,
  lng,
  zoom = 15,
  onPick,
  className,
}: {
  lat: number;
  lng: number;
  zoom?: number;
  onPick?: (lat: number, lng: number) => void;
  className?: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { scrollWheelZoom: false }).setView([lat, lng], zoom);
      // Primary tiles: Esri World Street Map (keyless, no referrer requirement, so it
      // also loads inside phone app previews). Falls back to OpenStreetMap if tiles fail.
      const primary = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 19, attribution: "© Esri, OpenStreetMap" },
      ).addTo(m);
      let failures = 0;
      primary.on("tileerror", () => {
        failures += 1;
        if (failures !== 3 || cancelled) return;
        m.removeLayer(primary);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap",
        }).addTo(m);
      });
      const icon = L.divIcon({ className: "dark-pin", html: PIN, iconSize: [38, 48], iconAnchor: [19, 47] });
      const mk = L.marker([lat, lng], { icon, draggable: !!pickRef.current }).addTo(m);
      if (pickRef.current) {
        m.on("click", (e) => {
          mk.setLatLng(e.latlng);
          pickRef.current?.(e.latlng.lat, e.latlng.lng);
        });
        mk.on("dragend", () => {
          const p = mk.getLatLng();
          pickRef.current?.(p.lat, p.lng);
        });
      }
      map.current = m;
      marker.current = mk;
      setTimeout(() => m.invalidateSize(), 100);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map.current || !marker.current) return;
    const cur = marker.current.getLatLng();
    if (Math.abs(cur.lat - lat) < 1e-7 && Math.abs(cur.lng - lng) < 1e-7) return;
    marker.current.setLatLng([lat, lng]);
    map.current.setView([lat, lng], map.current.getZoom());
  }, [lat, lng]);

  return <div ref={el} className={cn("h-64 w-full overflow-hidden rounded-2xl bg-muted", className)} />;
}
