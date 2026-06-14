'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Vendor } from '@/lib/types';

interface VendorsMapProps {
  vendors: Vendor[];
}

export function VendorsMap({ vendors }: VendorsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const placed = vendors.filter((v) => v.latitude != null && v.longitude != null);
    const center: [number, number] =
      placed.length > 0
        ? [placed[0].latitude!, placed[0].longitude!]
        : [25.2048, 55.2708]; // default: Dubai

    let map: import('leaflet').Map;

    import('leaflet').then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      map = L.map(containerRef.current!).setView(center, placed.length === 1 ? 14 : 6);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      placed.forEach((v) => {
        L.marker([v.latitude!, v.longitude!])
          .addTo(map)
          .bindPopup(
            `<strong>${v.store_name}</strong><br/>${v.owner_name}<br/><span style="text-transform:capitalize">${v.status}</span>`
          );
      });

      if (placed.length > 1) {
        const bounds = L.latLngBounds(placed.map((v) => [v.latitude!, v.longitude!]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => { map?.remove(); };
  }, [vendors]);

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', minHeight: 500 }}
    />
  );
}
