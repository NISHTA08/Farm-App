"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const DEFAULT_ZOOM = 14;

// Fix default marker icon in Next.js/Leaflet
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

export type MapCenter = { lat: number; lng: number };
export type BoundaryPoint = [number, number];

export interface ZoneOnMap {
  id: string;
  name: string;
  crop: string;
  boundary: BoundaryPoint[];
  health?: "healthy" | "attention" | "critical";
}

interface FarmMapEditorProps {
  center: MapCenter;
  boundary: BoundaryPoint[];
  onCenterChange: (center: MapCenter) => void;
  onBoundaryChange: (boundary: BoundaryPoint[]) => void;
  onRemovePoint?: (index: number) => void;
  zoneBoundaries?: ZoneOnMap[];
  activeZoneBoundary?: BoundaryPoint[];
  onActiveZoneBoundaryChange?: (boundary: BoundaryPoint[]) => void;
  height?: string;
  isDrawing?: boolean;
  isDrawingZone?: boolean;
  /** When true, boundary is read-only (no points, no add/remove). */
  boundaryLocked?: boolean;
  /** When true, fit map view to the boundary so only your farm shape is visible. */
  fitBoundsToBoundary?: boolean;
  /** When true, no satellite tiles — black background, boundary shape + crop areas (polygons) in color. */
  planViewOnly?: boolean;
  /** Zoom level when flying to center (e.g. after "Use my location"). Default 16. */
  flyToZoom?: number;
}

function MapClickHandler({
  isDrawing,
  isDrawingZone,
  onAddPoint,
  onAddZonePoint,
}: {
  isDrawing: boolean;
  isDrawingZone: boolean;
  onAddPoint: (lat: number, lng: number) => void;
  onAddZonePoint?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (isDrawingZone && onAddZonePoint) {
        onAddZonePoint(lat, lng);
      } else if (isDrawing) {
        onAddPoint(lat, lng);
      }
    },
  });
  return null;
}

function MapCenterUpdater({
  center,
  animate = true,
  zoom,
}: {
  center: MapCenter;
  animate?: boolean;
  zoom?: number;
}) {
  const map = useMap();
  const initialCenter = useRef(center);
  const isFirst = useRef(true);
  useEffect(() => {
    if (
      initialCenter.current.lat !== center.lat ||
      initialCenter.current.lng !== center.lng
    ) {
      const z = isFirst.current ? (zoom ?? DEFAULT_ZOOM) : (zoom ?? 16);
      if (isFirst.current) {
        map.setView([center.lat, center.lng], z);
        isFirst.current = false;
      } else if (animate) {
        map.flyTo([center.lat, center.lng], z, { duration: 1.2 });
      } else {
        map.setView([center.lat, center.lng], z);
      }
      initialCenter.current = center;
    }
  }, [center, map, animate, zoom]);
  return null;
}

/** Fits map view to the boundary polygon so only the farm shape is visible. */
function FitBoundsToBoundary({ boundary, enabled }: { boundary: BoundaryPoint[]; enabled: boolean }) {
  const map = useMap();
  const didFit = useRef(false);
  useEffect(() => {
    if (!enabled || boundary.length < 3) return;
    const bounds = L.latLngBounds(boundary as L.LatLngExpression[]);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 });
    didFit.current = true;
  }, [enabled, map, boundary]);
  return null;
}

const ZONE_COLORS = ["#8b5cf6", "#f59e0b", "#06b6d4", "#ec4899", "#84cc16"];

/** Consistent color per crop type (Township-style). */
export const CROP_COLOR: Record<string, string> = {
  Rice: "#84cc16",
  Wheat: "#eab308",
  Cotton: "#a78bfa",
  Sugarcane: "#f97316",
  Maize: "#facc15",
  Tomato: "#ef4444",
  Potato: "#78716c",
  Onion: "#fbbf24",
  Soybean: "#22c55e",
  Groundnut: "#d97706",
};
function getZoneColor(zone: ZoneOnMap, index: number): string {
  return CROP_COLOR[zone.crop] || ZONE_COLORS[index % ZONE_COLORS.length];
}

function DraggableBoundaryPoint({
  position,
  index,
  onMove,
  onRemove,
}: {
  position: BoundaryPoint;
  index: number;
  onMove: (index: number, pos: BoundaryPoint) => void;
  onRemove: (index: number) => void;
}) {
  const eventHandlers = useCallback(
    (i: number) => ({
      dragend(e: L.LeafletEvent) {
        const marker = e.target as L.Marker;
        const latlng = marker.getLatLng();
        onMove(i, [latlng.lat, latlng.lng]);
      },
    }),
    [onMove]
  );
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={eventHandlers(index)}
      icon={L.divIcon({
        className: "boundary-point-marker",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#22C55E;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })}
    >
      <Popup>
        <span className="text-body-sm text-kh-text">Point {index + 1}</span>
        <br />
        <button
          type="button"
          className="mt-2 text-body-xs text-red-400 hover:underline"
          onClick={() => onRemove(index)}
        >
          Remove this point
        </button>
      </Popup>
    </Marker>
  );
}

export default function FarmMapEditor({
  center,
  boundary,
  onBoundaryChange,
  onRemovePoint,
  zoneBoundaries = [],
  activeZoneBoundary = [],
  onActiveZoneBoundaryChange,
  height = "320px",
  isDrawing = true,
  isDrawingZone = false,
  boundaryLocked = false,
  fitBoundsToBoundary = false,
  planViewOnly = false,
  flyToZoom = 16,
}: FarmMapEditorProps) {
  const mapCenter: [number, number] = [center.lat, center.lng];
  const canEditBoundary = isDrawing && !boundaryLocked;

  const handleAddPoint = useCallback(
    (lat: number, lng: number) => {
      onBoundaryChange([...boundary, [lat, lng]]);
    },
    [boundary, onBoundaryChange]
  );

  const handleMovePoint = useCallback(
    (index: number, newPos: BoundaryPoint) => {
      const next = [...boundary];
      if (index >= 0 && index < next.length) {
        next[index] = newPos;
        onBoundaryChange(next);
      }
    },
    [boundary, onBoundaryChange]
  );

  const handleRemovePoint = useCallback(
    (index: number) => {
      if (onRemovePoint) {
        onRemovePoint(index);
      } else {
        const next = boundary.filter((_, i) => i !== index);
        onBoundaryChange(next);
      }
    },
    [boundary, onBoundaryChange, onRemovePoint]
  );

  const handleAddZonePoint = useCallback(
    (lat: number, lng: number) => {
      if (onActiveZoneBoundaryChange) {
        onActiveZoneBoundaryChange([...activeZoneBoundary, [lat, lng]]);
      }
    },
    [activeZoneBoundary, onActiveZoneBoundaryChange]
  );

  const polygonPositions = boundary.length >= 3 ? [...boundary, boundary[0]] : boundary;

  return (
    <div
      className={`rounded-xl overflow-hidden border border-kh-border plan-view-wrapper ${planViewOnly ? "bg-black plan-view-only" : "bg-kh-surface"}`}
      style={{ height }}
    >
      {planViewOnly && (
        <style>{`.plan-view-only .leaflet-container { background: #000 !important; }
          .plan-view-only .leaflet-tile-pane { display: none !important; }`}</style>
      )}
      <MapContainer
        center={mapCenter}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full z-0"
        style={{ height }}
      >
        {!planViewOnly && (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url={SATELLITE_URL}
          />
        )}
        {!fitBoundsToBoundary && <MapCenterUpdater center={center} zoom={flyToZoom} />}
        <FitBoundsToBoundary boundary={boundary} enabled={fitBoundsToBoundary && boundary.length >= 3} />
        <MapClickHandler
          isDrawing={canEditBoundary && !isDrawingZone}
          isDrawingZone={isDrawingZone}
          onAddPoint={handleAddPoint}
          onAddZonePoint={isDrawingZone ? handleAddZonePoint : undefined}
        />
        {/* Farm boundary polygon (highlighted shape) */}
        {polygonPositions.length > 0 && (
          <Polygon
            positions={polygonPositions}
            pathOptions={{
              color: planViewOnly ? "#22C55E" : "#22C55E",
              fillColor: "#22C55E",
              fillOpacity: planViewOnly ? 0.35 : 0.25,
              weight: planViewOnly ? 2.5 : 2,
            }}
          />
        )}
        {/* Draggable boundary point markers (hidden when boundary is locked or plan view) */}
        {!boundaryLocked && !planViewOnly && boundary.map((pos, i) => (
          <DraggableBoundaryPoint
            key={i}
            position={pos}
            index={i}
            onMove={handleMovePoint}
            onRemove={handleRemovePoint}
          />
        ))}
        {/* Zones: colored areas (polygons) by crop — same in plan view and map view */}
        {zoneBoundaries.map((zone, zi) => {
          const pts = zone.boundary.length >= 3 ? [...zone.boundary, zone.boundary[0]] : zone.boundary;
          if (pts.length < 3) return null;
          const color = getZoneColor(zone, zi);
          return (
            <Polygon
              key={zone.id}
              positions={pts}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: planViewOnly ? 0.5 : 0.35,
                weight: planViewOnly ? 2.5 : 2,
              }}
            />
          );
        })}
        {/* Active zone being drawn (polygon while drawing) */}
        {activeZoneBoundary.length > 0 && (
          <Polygon
            positions={
              activeZoneBoundary.length >= 3
                ? [...activeZoneBoundary, activeZoneBoundary[0]]
                : activeZoneBoundary
            }
            pathOptions={{
              color: "#8b5cf6",
              fillColor: "#8b5cf6",
              fillOpacity: 0.3,
              weight: 2,
              dashArray: "6,6",
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
