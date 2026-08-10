import { useMemo } from "react";

import { CITY_CENTRE } from "../../utils/mockData";
import { PRIORITY_META } from "../../utils/constants";

/**
 * Geographic plot of complaints.
 *
 * INTEGRATION POINT — Leaflet is not a dependency of this project, so rather
 * than ship a broken `<MapContainer>` this renders the same data as a
 * projected SVG plot: real coordinates, real bounds, real markers, no tiles.
 *
 * To swap in Leaflet:
 *   1. npm install leaflet react-leaflet
 *   2. import "leaflet/dist/leaflet.css" in src/styles/index.css
 *   3. Replace the <svg> below with:
 *        <MapContainer center={[centre.latitude, centre.longitude]} zoom={12}>
 *          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
 *          {points.map(p => (
 *            <CircleMarker key={p.id} center={[p.latitude, p.longitude]}
 *                          pathOptions={{ className: `map-pin--${p.tone}` }}>
 *              <Popup>…</Popup>
 *            </CircleMarker>
 *          ))}
 *        </MapContainer>
 *   The `points` array below is already in the shape Leaflet needs — nothing
 *   above this component changes.
 */
export default function ComplaintMap({ complaints = [], focusId, onSelect }) {
  const points = useMemo(
    () =>
      complaints
        .filter((c) => c.coords?.latitude != null && c.coords?.longitude != null)
        .map((c) => ({
          id: c.id,
          title: c.title,
          location: c.location,
          latitude: c.coords.latitude,
          longitude: c.coords.longitude,
          approximate: Boolean(c.coords.approximate),
          tone: PRIORITY_META[c.priority]?.tone ?? "slate",
          priority: c.priority,
        })),
    [complaints],
  );

  // Bounds from the data, padded so no marker sits on the frame edge. A single
  // complaint would otherwise produce a zero-width box and divide by zero.
  const bounds = useMemo(() => {
    if (!points.length) {
      return {
        minLat: CITY_CENTRE.latitude - 0.05,
        maxLat: CITY_CENTRE.latitude + 0.05,
        minLng: CITY_CENTRE.longitude - 0.05,
        maxLng: CITY_CENTRE.longitude + 0.05,
      };
    }

    const lats = points.map((p) => p.latitude);
    const lngs = points.map((p) => p.longitude);
    const pad = 0.012;

    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [points]);

  const spanLat = Math.max(bounds.maxLat - bounds.minLat, 0.001);
  const spanLng = Math.max(bounds.maxLng - bounds.minLng, 0.001);

  // Latitude grows northwards, y grows downwards — hence the inversion.
  const project = (p) => ({
    x: ((p.longitude - bounds.minLng) / spanLng) * 100,
    y: ((bounds.maxLat - p.latitude) / spanLat) * 100,
  });

  return (
    <div className="geomap">
      <div className="geomap__canvas">
        <svg
          className="geomap__grid"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[20, 40, 60, 80].map((v) => (
            <g key={v}>
              <line x1={v} y1="0" x2={v} y2="100" />
              <line x1="0" y1={v} x2="100" y2={v} />
            </g>
          ))}
        </svg>

        <ul className="geomap__pins">
          {points.map((point) => {
            const { x, y } = project(point);
            const focused = point.id === focusId;

            return (
              <li
                className="geomap__pin-wrap"
                key={point.id}
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <button
                  type="button"
                  className={`map-pin map-pin--${point.tone}${focused ? " map-pin--focus" : ""}`}
                  onClick={() => onSelect?.(point.id)}
                  aria-label={`${point.priority} priority: ${point.title} at ${point.location}`}
                >
                  <span className="map-pin__dot" aria-hidden="true" />
                </button>

                <span className="map-pin__tip" aria-hidden="true">
                  <strong>{point.title}</strong>
                  {point.location}
                  {point.approximate && <em> · approximate</em>}
                </span>
              </li>
            );
          })}
        </ul>

        {points.length === 0 && (
          <p className="geomap__empty">
            No complaints with coordinates match the current filters.
          </p>
        )}
      </div>

      <p className="geomap__note">
        <i className="bi bi-info-circle" aria-hidden="true" />
        Positions are projected from each complaint&apos;s real coordinates.
        Street tiles arrive with the Leaflet integration — see the note in{" "}
        <code>ComplaintMap.jsx</code>.
      </p>
    </div>
  );
}
