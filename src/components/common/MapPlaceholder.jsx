/**
 * Stand-in for the eventual map embed.
 *
 * Drawn entirely in CSS — a fake street grid with a pin — so the layout is
 * final and swapping in Leaflet or Google Maps is a single component change.
 */
export default function MapPlaceholder({ location, coords, height = 240 }) {
  return (
    <figure className="map-ph mb-0" style={{ height }}>
      <span className="map-ph__grid" aria-hidden="true" />

      <span className="map-ph__pin" aria-hidden="true">
        <i className="bi bi-geo-alt-fill" />
      </span>

      <figcaption className="map-ph__caption">
        <span className="map-ph__label">
          <i className="bi bi-pin-map" aria-hidden="true" />
          {location || "Location not specified"}
        </span>
        {coords && (
          <span className="map-ph__coords mono">
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        )}
      </figcaption>

      <span className="map-ph__note">Map view connects with the location service</span>
    </figure>
  );
}
