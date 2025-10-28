import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet'
import { useMemo } from 'react'
import { toLatLng } from '../utils/geo'
import { usePlayback } from '../context/PlaybackContext'
import FitBoundsOnce from './map/FitBoundsOnce'
import CarIcon from './map/CarIcon'

export default function MapPanel() {
  const { route, traveled, position, heading } = usePlayback()
  const fullLatLngs = useMemo(() => route.map(toLatLng), [route])
  const icon = useMemo(() => CarIcon(heading), [heading])

  return (
    <main className="panel map-shell">
      <div className="map">
        <MapContainer
          zoom={15}
          center={position ? [position.lat, position.lng] : [17.385044, 78.486671]}
          scrollWheelZoom
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {!!fullLatLngs.length && <FitBoundsOnce latlngs={fullLatLngs} />}
          {!!fullLatLngs.length && (
            <Polyline positions={fullLatLngs} pathOptions={{ color: '#5b8def', weight: 3, opacity: 0.25, dashArray: '6 6' }} />
          )}
          {!!traveled.length && (
            <Polyline positions={traveled} pathOptions={{ color: '#5b8def', weight: 5, opacity: 0.9 }} />
          )}
          {position && <Marker position={[position.lat, position.lng]} icon={icon} />}
        </MapContainer>
      </div>
    </main>
  )
}
