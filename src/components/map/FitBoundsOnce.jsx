import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export default function FitBoundsOnce({ latlngs }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (latlngs && latlngs.length && !done.current) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [20, 20] })
      done.current = true
    }
  }, [latlngs, map])
  return null
}
