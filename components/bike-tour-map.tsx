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
  groupSlug?: string;
};

const LOCATION_MAX_AGE_MS = 5000;
const LOCATION_TIMEOUT_MS = 10000;
const USER_LOCATION_MARKER_STROKE = "#1d4ed8";
const USER_LOCATION_MARKER_FILL = "#3b82f6";
const USER_ACCURACY_STROKE = "#60a5fa";
const USER_ACCURACY_FILL = "#93c5fd";
function getStockholmZoomThreshold() {
  if (typeof window !== "undefined" && window.devicePixelRatio >= 2) {
    return 15;
  }
  return 17;
}
const STOCKHOLM_WMS_URL =
  "https://kartor.stockholm.se/bios/wms/app/baggis/web/WMS_STHLM_STOCKHOLMSKARTA_GRA";
const STOCKHOLM_ATTRIBUTION =
  "Kartbakgrund: Stockholms stad (WMS)";
const OSM_ATTRIBUTION = "&copy; OpenStreetMap contributors";

export default function BikeTourMap({
  startAddress,
  startCoordinates,
  endDestination,
  restaurants,
  groupSlug,
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
    let locationWatchId: number | null = null;
    let userLocationMarker: import("leaflet").CircleMarker | null = null;
    let userAccuracyCircle: import("leaflet").Circle | null = null;
    let hasCenteredOnUser = false;
    let removeLocationClickHandler: (() => void) | null = null;

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

        const updateUserPosition = (position: GeolocationPosition) => {
          const { latitude, longitude, accuracy } = position.coords;
          const latLng = L.latLng(latitude, longitude);

          if (!userLocationMarker) {
            userLocationMarker = L.circleMarker(latLng, {
              radius: 8,
              color: USER_LOCATION_MARKER_STROKE,
              fillColor: USER_LOCATION_MARKER_FILL,
              fillOpacity: 0.9,
              weight: 2,
            }).addTo(map);
          } else {
            userLocationMarker.setLatLng(latLng);
          }

          if (!userAccuracyCircle) {
            userAccuracyCircle = L.circle(latLng, {
              radius: accuracy,
              color: USER_ACCURACY_STROKE,
              fillColor: USER_ACCURACY_FILL,
              fillOpacity: 0.2,
              weight: 1,
            }).addTo(map);
          } else {
            userAccuracyCircle.setLatLng(latLng);
            userAccuracyCircle.setRadius(accuracy);
          }

          if (!hasCenteredOnUser) {
            map.flyTo(latLng, Math.max(map.getZoom(), 15));
            hasCenteredOnUser = true;
          }
        };

        const startLocationWatch = () => {
          if (!("geolocation" in navigator)) {
            setError("Din enhet stöder inte platstjänster.");
            return;
          }

          if (locationWatchId !== null) {
            if (userLocationMarker) {
              map.flyTo(userLocationMarker.getLatLng(), Math.max(map.getZoom(), 15));
            }
            return;
          }

          setError(null);
          locationWatchId = navigator.geolocation.watchPosition(
            (position) => {
              updateUserPosition(position);
            },
            (locationError) => {
              if (locationWatchId !== null) {
                navigator.geolocation.clearWatch(locationWatchId);
                locationWatchId = null;
              }

              const message =
                locationError.code === locationError.PERMISSION_DENIED
                  ? "Tillåt platsåtkomst för att visa din position på kartan."
                  : locationError.code === locationError.TIMEOUT
                    ? "Platsförfrågan tog för lång tid. Försök igen."
                    : locationError.code === locationError.POSITION_UNAVAILABLE
                      ? "Din position kunde inte hittas. Kontrollera platsinställningar och försök igen."
                      : "Kunde inte hämta din position just nu.";
              setError(message);
            },
            {
              enableHighAccuracy: true,
              maximumAge: LOCATION_MAX_AGE_MS,
              timeout: LOCATION_TIMEOUT_MS,
            },
          );
        };

        const LocationControl = L.Control.extend({
          onAdd: () => {
            const container = L.DomUtil.create("div", "leaflet-bar");
            const button = L.DomUtil.create(
              "button",
              "map-location-button",
              container,
            ) as HTMLButtonElement;
            button.type = "button";
            button.title = "Visa min position";
            button.setAttribute("aria-label", "Visa min position");

            const icon = L.DomUtil.create("i", "map-location-icon", button);
            icon.setAttribute("aria-hidden", "true");
            icon.classList.add("fa-solid", "fa-location-crosshairs");

            L.DomEvent.disableClickPropagation(container);
            const onLocationButtonClick = () => {
              startLocationWatch();
            };
            L.DomEvent.on(button, "click", onLocationButtonClick);
            removeLocationClickHandler = () => {
              L.DomEvent.off(button, "click", onLocationButtonClick);
            };
            return container;
          },
        });

        const locationControl = new LocationControl({ position: "topright" });
        map.addControl(locationControl);

        const osmLayer = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: OSM_ATTRIBUTION,
            maxZoom: 19,
          },
        );

        const stockholmLayer = L.tileLayer.wms(STOCKHOLM_WMS_URL, {
          format: "image/png",
          transparent: false,
          version: "1.1.1",
          attribution: STOCKHOLM_ATTRIBUTION,
          maxZoom: 19,
        });

        let stockholmUnavailable = false;

        let stockholmZoomThreshold = getStockholmZoomThreshold();
        // Re-evaluate on resize/zoom for dynamic devicePixelRatio changes
        const syncBasemapForZoom = () => {
          // Re-check threshold in case devicePixelRatio changed
          stockholmZoomThreshold = getStockholmZoomThreshold();
          const useStockholm =
            !stockholmUnavailable && map.getZoom() >= stockholmZoomThreshold;

          if (useStockholm) {
            if (!map.hasLayer(stockholmLayer)) {
              stockholmLayer.addTo(map);
            }
            if (map.hasLayer(osmLayer)) {
              map.removeLayer(osmLayer);
            }
            return;
          }

          if (!map.hasLayer(osmLayer)) {
            osmLayer.addTo(map);
          }
          if (map.hasLayer(stockholmLayer)) {
            map.removeLayer(stockholmLayer);
          }
        };

        const fallbackToOsm = () => {
          if (stockholmUnavailable || cancelled) {
            return;
          }

          stockholmUnavailable = true;
          syncBasemapForZoom();
        };

        stockholmLayer.on("tileerror", fallbackToOsm);
        map.on("zoomend", syncBasemapForZoom);
        osmLayer.addTo(map);

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
          className: "map-pin map-pin-finish",
          html: "M",
          iconSize: [24, 24],
          iconAnchor: [15, 15],
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

        const endMarker = L.marker(
          [endDestination.coordinates.lat, endDestination.coordinates.lng],
          {
            icon: endIcon,
            title: `Mål: ${endDestination.name}`,
          },
        ).addTo(map);

        if (endDestination.slug) {
          const query = groupSlug ? `?group=${encodeURIComponent(groupSlug)}` : "";
          endMarker.on("click", () => {
            router.push(`/restauranger/${endDestination.slug}${query}`);
          });
        }

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
            "Kunde inte hämta cykelväg just nu. Visar en direktlinje mellan stoppen.",
          );
        }

        L.polyline(routeLine, {
          color: "#f59e0b",
          weight: 5,
          opacity: 0.95,
        }).addTo(map);

        map.fitBounds(boundsPoints, { padding: [24, 24] });
        syncBasemapForZoom();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ett okänt fel uppstod.");
      }
    };

    run();

    return () => {
      cancelled = true;
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
      if (removeLocationClickHandler) {
        removeLocationClickHandler();
      }
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [endDestination, restaurants, router, startAddress, startCoordinates]);

  return (
    <div className="space-y-3">
      <div
        ref={mapRef}
        className="h-[440px] w-full rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-700"
      />
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <p className="text-sm text-zinc-700 dark:text-zinc-400">
        Karta visas med Stockholmskartan (WMS), med fallback till OpenStreetMap.
      </p>
    </div>
  );
}
