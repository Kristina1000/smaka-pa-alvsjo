"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant, RouteLocation } from "@/lib/tour-data";

type BikeTourMapProps = {
  startAddress: string;
  startCoordinates: {
    lat: number;
    lng: number;
  };
  endDestination: RouteLocation;
  restaurants: readonly Restaurant[];
};

export default function BikeTourMap({
  startAddress,
  startCoordinates,
  endDestination,
  restaurants,
}: BikeTourMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (!restaurants.length) {
      return;
    }

    let cancelled = false;
    let mapInstance: import("leaflet").Map | null = null;

    const run = async () => {
      try {
        const L = await import("leaflet");
        if (cancelled || !mapRef.current || !restaurants.length) {
          return;
        }

        const map = L.map(mapRef.current, {
          zoomControl: true,
        });
        mapInstance = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);

        const startIcon = L.divIcon({
          className: "map-pin map-pin-start",
          html: "S",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const stopIcon = (index: number) =>
          L.divIcon({
            className: "map-pin map-pin-stop",
            html: String(index + 1),
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

        const endIcon = L.divIcon({
          className: "map-pin map-pin-stop",
          html: "M",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const routeCoordinates: Array<{ lat: number; lng: number }> = [
          startCoordinates,
          ...restaurants.map((restaurant) => restaurant.coordinates),
          endDestination.coordinates,
        ];

        const boundsPoints = routeCoordinates.map((point) => [
          point.lat,
          point.lng,
        ]) as [number, number][];

        L.marker([startCoordinates.lat, startCoordinates.lng], {
          icon: startIcon,
          title: `Start: ${startAddress}`,
        }).addTo(map);

        restaurants.forEach((restaurant, index) => {
          const marker = L.marker(
            [restaurant.coordinates.lat, restaurant.coordinates.lng],
            {
              icon: stopIcon(index),
              title: restaurant.name,
            },
          ).addTo(map);

          marker.on("click", () => {
            router.push(`/restauranger/${restaurant.slug}`);
          });
        });

        L.marker(
          [endDestination.coordinates.lat, endDestination.coordinates.lng],
          {
            icon: endIcon,
            title: `Mål: ${endDestination.name}`,
          },
        ).addTo(map);

        const osrmCoordinates = routeCoordinates
          .map((point) => `${point.lng},${point.lat}`)
          .join(";");

        let routeLine: [number, number][] = boundsPoints;

        try {
          const response = await fetch(
            `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${osrmCoordinates}?overview=full&geometries=geojson&steps=false`,
          );

          if (!response.ok) {
            throw new Error("Routing service svarade inte.");
          }

          const data = (await response.json()) as {
            routes?: Array<{
              geometry?: {
                coordinates?: [number, number][];
              };
            }>;
          };

          const geometry = data.routes?.[0]?.geometry?.coordinates;
          if (geometry && geometry.length > 1) {
            routeLine = geometry.map(([lng, lat]) => [lat, lng]);
          }
        } catch {
          setError(
            "Kunde inte hamta cykelvag just nu. Visar en direktlinje mellan stoppen.",
          );
        }

        L.polyline(routeLine, {
          color: "#f59e0b",
          weight: 5,
          opacity: 0.95,
        }).addTo(map);

        map.fitBounds(boundsPoints, { padding: [24, 24] });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ett okant fel uppstod.");
      }
    };

    run();

    return () => {
      cancelled = true;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [endDestination, restaurants, router, startAddress, startCoordinates]);

  return (
    <div className="space-y-3">
      <div
        ref={mapRef}
        className="h-[440px] w-full rounded-2xl border border-zinc-200 shadow-sm"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-sm text-zinc-600">
        Karta och rutt visas med OpenStreetMap och fri cykel-routing.
      </p>
    </div>
  );
}
