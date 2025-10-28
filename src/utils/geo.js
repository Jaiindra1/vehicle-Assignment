export const toLatLng = (p) => [p.latitude, p.longitude]
export const fmt = (n) => (typeof n === 'number' ? n.toFixed(6) : '–')

export function normalizeTimestamps(points) {
  const hasAll = points.every(p => !!p.timestamp)
  if (!hasAll) {
    const t0 = Date.now()
    return points.map((p, i) => ({ ...p, t: t0 + i * 1000 }))
  }
  return points.map(p => ({ ...p, t: Date.parse(p.timestamp) }))
}

export function lerp(a, b, t) { return a + (b - a) * t }
export function interpPoint(a, b, t) {
  return { latitude: lerp(a.latitude, b.latitude, t), longitude: lerp(a.longitude, b.longitude, t) }
}

export function haversine(a, b) {
  const R = 6371000 // meters
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export function bearingDeg(a, b) {
  const toRad = d => (d * Math.PI) / 180
  const toDeg = r => (r * 180) / Math.PI
  const φ1 = toRad(a.latitude)
  const φ2 = toRad(b.latitude)
  const λ1 = toRad(a.longitude)
  const λ2 = toRad(b.longitude)
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1)
  const θ = Math.atan2(y, x)
  return (toDeg(θ) + 360) % 360
}
