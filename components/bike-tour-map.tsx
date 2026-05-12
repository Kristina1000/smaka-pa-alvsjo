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

const LOCATION_MAX_AGE_MS = 5000;
const LOCATION_TIMEOUT_MS = 10000;
const USER_LOCATION_MARKER_STROKE = "#1d4ed8";
const USER_LOCATION_MARKER_FILL = "#3b82f6";
const USER_ACCURACY_STROKE = "#60a5fa";
const USER_ACCURACY_FILL = "#93c5fd";
const STOCKHOLM_WMS_URL =
  "https://kartor.stockholm.se/bios/wms/app/baggis/web/WMS_STHLM_STOCKHOLMSKARTA_GRA";
const STOCKHOLM_ATTRIBUTION =
  "Kartbakgrund: Stockholms stad (WMS)";
const OSM_ATTRIBUTION = "&copy; OpenStreetMap contributors";
const CYCLOSM_ATTRIBUTION =
  "&copy; OpenStreetMap contributors | &copy; CyclOSM";
const GOKARTOR_ATTRIBUTION = "&copy; GoKartor AB";
const GOKARTOR_TILE_URL = "https://kartor.gokartor.se/topo/{z}/{y}/{x}.png";
const STOCKHOLM_CYKEL_WMS_URL =
  "https://openstreetgs.stockholm.se/geoservice/api/717ec6af-49f9-4774-84da-35b8cb713dc5/wms";
const STOCKHOLM_CYKEL_ATTRIBUTION = "&copy; Stockholms stad";


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
    let locationWatchId: number | null = null;
    let userLocationMarker: import("leaflet").CircleMarker | null = null;
    let userAccuracyCircle: import("leaflet").Circle | null = null;
    let isLocationTrackingActive = false;
    let removeLocationClickHandler: (() => void) | null = null;
    let locationButton: HTMLButtonElement | null = null;

    const run = async () => {
      try {
        const L = await import("leaflet");
        const proj4Module = await import("proj4");
        const proj4 = (proj4Module.default ?? proj4Module) as unknown;

        const leafletRuntime = ((L as unknown as { default?: unknown }).default ?? L) as typeof L;
        (window as unknown as { L?: typeof L; proj4?: unknown }).L = leafletRuntime;
        (window as unknown as { L?: typeof L; proj4?: unknown }).proj4 = proj4;

        await import("proj4leaflet");
        if (cancelled || !mapRef.current || !restaurants.length) {
          return;
        }

        const LRuntime = ((window as unknown as { L?: typeof L }).L ?? leafletRuntime) as typeof L;
        const LWithProj = LRuntime as typeof LRuntime & {
          Proj?: {
            CRS: new (
              code: string,
              proj4def: string,
              options: {
                resolutions: number[];
                origin: [number, number];
              },
            ) => import("leaflet").CRS;
          };
        };

        const map = LRuntime.map(mapRef.current, {
          zoomControl: true,
        });
        mapInstance = map;
        const defaultCrs = map.options.crs;
        const goKartorCrs = LWithProj.Proj
          ? new LWithProj.Proj.CRS(
              "EPSG:3006",
              "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
              {
                resolutions: [16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
                origin: [265000, 7680000],
              },
            )
          : null;

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

          if (isLocationTrackingActive) {
            map.flyTo(latLng, Math.max(map.getZoom(), 15));
          }
        };

        const updateLocationButtonState = () => {
          if (locationButton) {
            const icon = locationButton.querySelector("i");
            if (icon) {
              icon.classList.remove("fa-regular");
              icon.classList.add("fa-solid");
            }
            if (isLocationTrackingActive) {
              locationButton.classList.add("location-active");
            } else {
              locationButton.classList.remove("location-active");
            }
          }
        };

        const startLocationWatch = () => {
          if (!("geolocation" in navigator)) {
            setError("Din enhet stöder inte platstjänster.");
            return;
          }

          // Toggle tracking state
          isLocationTrackingActive = !isLocationTrackingActive;
          updateLocationButtonState();

          if (!isLocationTrackingActive) {
            setError(null);
            return;
          }

          if (locationWatchId === null) {
            setError(null);
            locationWatchId = navigator.geolocation.watchPosition(
              (position) => {
                updateUserPosition(position);
              },
              (locationError) => {
                isLocationTrackingActive = false;
                updateLocationButtonState();

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
          }
        };

        const LocationControl = L.Control.extend({
          onAdd: () => {
            const container = L.DomUtil.create("div", "leaflet-bar");
            locationButton = L.DomUtil.create(
              "button",
              "map-location-button",
              container,
            ) as HTMLButtonElement;
            locationButton.type = "button";
            locationButton.title = "Visa och följ min position";
            locationButton.setAttribute("aria-label", "Visa och följ min position");

            const icon = L.DomUtil.create("i", "map-location-icon fa-solid fa-location-arrow", locationButton);
            icon.setAttribute("aria-hidden", "true");

            L.DomEvent.disableClickPropagation(container);
            const onLocationButtonClick = () => {
              startLocationWatch();
            };
            L.DomEvent.on(locationButton, "click", onLocationButtonClick);
            removeLocationClickHandler = () => {
              if (locationButton) {
                L.DomEvent.off(locationButton, "click", onLocationButtonClick);
              }
            };
            return container;
          },
        });

        const locationControl = new LocationControl({ position: "topright" });
        map.addControl(locationControl);

        // Only disable tracking if the user moves the map (not when following GPS)
        let ignoreNextMove = false;
        map.on("movestart", () => {
          if (isLocationTrackingActive && !ignoreNextMove) {
            isLocationTrackingActive = false;
            updateLocationButtonState();
          }
        });

        // When following GPS, set a flag to ignore the next move event
        const flyToOriginal = map.flyTo.bind(map);
        map.flyTo = function(...args: unknown[]) {
          ignoreNextMove = true;
          setTimeout(() => { ignoreNextMove = false; }, 500);
          return flyToOriginal(...(args as [any]));
        };

        const osmLayer = L.tileLayer(
          "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: OSM_ATTRIBUTION,
            maxZoom: 19,
          },
        );

        const cyclOsmLayer = L.tileLayer(
          "https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png",
          {
            attribution: CYCLOSM_ATTRIBUTION,
            maxZoom: 20,
          },
        );

        const goKartorLayer = L.tileLayer(
          GOKARTOR_TILE_URL,
          {
            attribution: GOKARTOR_ATTRIBUTION,
            minZoom: 1,
            maxZoom: 17,
            minNativeZoom: 3,
            maxNativeZoom: 14,
            noWrap: true,
            tms: false,
          },
        );

        const stockholmCykelOverlayLayer = L.tileLayer.wms(STOCKHOLM_CYKEL_WMS_URL, {
          layers: "od:LVD_FUNCTION_OBJECT_VIEW",
          styles: "sld-slk-cykelkartan-cykelnat",
          format: "image/png",
          transparent: true,
          version: "1.1.1",
          uppercase: true,
          attribution: STOCKHOLM_CYKEL_ATTRIBUTION,
          maxZoom: 19,
          ...( {
            CQL_FILTER: "TRAFFIC_TYPES IN (2,10)",
          } as Record<string, string>),
        });

        const stockholmLayer = L.tileLayer.wms(STOCKHOLM_WMS_URL, {
          format: "image/png",
          transparent: false,
          version: "1.1.1",
          attribution: STOCKHOLM_ATTRIBUTION,
          maxZoom: 19,
        });

        const stockholmCykelLayer = L.layerGroup([
          stockholmLayer,
          stockholmCykelOverlayLayer,
        ]);

        stockholmLayer.on("tileerror", () => {
          if (!cancelled && map.hasLayer(stockholmLayer)) {
            setError("Stockholms Stad (Standard) kunde inte laddas just nu.");
          }
        });

        goKartorLayer.on("tileerror", () => {
          if (!cancelled && map.hasLayer(goKartorLayer)) {
            setError("GoKartor kunde inte laddas just nu.");
          }
        });

        stockholmCykelOverlayLayer.on("tileerror", () => {
          if (!cancelled && map.hasLayer(stockholmCykelLayer)) {
            setError("Stockholm Cykelkarta kunde inte laddas just nu.");
          }
        });

        osmLayer.addTo(map);

        const baseLayers = {
          OpenStreetMap: osmLayer,
          CyclOSM: cyclOsmLayer,
          "Gokartor": goKartorLayer,
          "Stockholms Stad (Standard)": stockholmLayer,
          "Stockholms Stad (Cykel)": stockholmCykelLayer,
        };

        const layerControl = L.control.layers(baseLayers, undefined, {
          position: "topleft",
          collapsed: true,
        });
        map.addControl(layerControl);

        let usingGoKartorCrs = false;
        map.on("baselayerchange", (event: import("leaflet").LayersControlEvent) => {
          const currentZoom = map.getZoom();
          const center = map.getCenter();

          if (event.layer === goKartorLayer && !usingGoKartorCrs && goKartorCrs) {
            const nextZoom = Math.max(6, Math.min(15, currentZoom - 3));
            map.options.crs = goKartorCrs;
            map.setView(center, nextZoom, { animate: false });
            map.invalidateSize(false);
            usingGoKartorCrs = true;
            return;
          }

          if (event.layer === goKartorLayer && !goKartorCrs) {
            setError("GoKartor visas utan projektionbyte (Proj4Leaflet ej tillgänglig).");
            return;
          }

          if (usingGoKartorCrs && event.layer !== goKartorLayer) {
            const nextZoom = Math.max(3, Math.min(19, currentZoom + 3));
            map.options.crs = defaultCrs;
            map.setView(center, nextZoom, { animate: false });
            map.invalidateSize(false);
            usingGoKartorCrs = false;
          }
        });

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
          endMarker.on("click", () => {
            router.push(`/restauranger/${endDestination.slug}`);
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

        // Draw route line with intense pink for GoKartor, otherwise default orange
        let routeLineLayer: import("leaflet").Polyline | null = null;
        const getRouteColor = () => (usingGoKartorCrs ? "#ff1ead" : "#f59e0b");
        routeLineLayer = L.polyline(routeLine, {
          color: getRouteColor(),
          weight: 5,
          opacity: 0.95,
        }).addTo(map);

        // Listen for base layer changes to update route color
        map.on("baselayerchange", (event: import("leaflet").LayersControlEvent) => {
          if (routeLineLayer) {
            routeLineLayer.setStyle({ color: event.layer === goKartorLayer ? "#ff1ead" : "#f59e0b" });
          }
        });

        map.fitBounds(boundsPoints, { padding: [24, 24] });
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
        Karta med flera lager. Välj karttyp via lagermenyn.
      </p>
    </div>
  );
}
