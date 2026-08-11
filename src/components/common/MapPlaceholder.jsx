import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LOCATION_COORDS } from '../../utils/mockData';

// Fix for default marker icon missing in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapPlaceholder({ location, coords, height = 240, popupContent }) {
  const [finalCoords, setFinalCoords] = useState(coords);
  const [loading, setLoading] = useState(!coords && location);

  useEffect(() => {
    if (coords) {
      setFinalCoords(coords);
      setLoading(false);
      return;
    }

    if (location) {
      // Try to geocode if no coords are provided
      setLoading(true);
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`)
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            setFinalCoords({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
          } else {
            // Fallback to mock coords if real geocoding fails (so old demo data doesn't break)
            if (LOCATION_COORDS[location]) {
              setFinalCoords(LOCATION_COORDS[location]);
            }
          }
        })
        .catch(() => {
          if (LOCATION_COORDS[location]) setFinalCoords(LOCATION_COORDS[location]);
        })
        .finally(() => setLoading(false));
    }
  }, [coords, location]);

  if (loading) {
    return (
      <figure className="map-ph mb-0 d-flex align-items-center justify-content-center" style={{ height }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading map...</span>
        </div>
      </figure>
    );
  }
  
  if (!finalCoords) {
    return (
      <figure className="map-ph mb-0" style={{ height }}>
        <span className="map-ph__grid" aria-hidden="true" />
        <span className="map-ph__note">Location not mapped</span>
      </figure>
    );
  }
  
  const position = [finalCoords.latitude || finalCoords.lat, finalCoords.longitude || finalCoords.lng];

  return (
    <figure className="map-real mb-0" style={{ height, position: 'relative', zIndex: 0 }}>
      <MapContainer center={position} zoom={15} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          {popupContent && (
            <Popup>
              {popupContent}
            </Popup>
          )}
        </Marker>
        <MapUpdater center={position} />
      </MapContainer>
    </figure>
  );
}
