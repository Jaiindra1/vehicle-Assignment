import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { EMBEDDED_POINTS } from '../utils/data'
import { normalizeTimestamps, interpPoint, haversine, bearingDeg } from '../utils/geo'

const PlaybackCtx = createContext(null)
export const usePlayback = () => {
  const ctx = useContext(PlaybackCtx)
  if (!ctx) throw new Error('usePlayback must be used within <PlaybackProvider>')
  return ctx
}

export function PlaybackProvider({ children }) {
  // Route & geometry
  const [route, setRoute] = useState([])
  const [traveled, setTraveled] = useState([])
  const [position, setPosition] = useState(null)
  const [heading, setHeading] = useState(0)

  // HUD
  const [hud, setHud] = useState({ lat: null, lng: null, ts: null, speed: null })

  // Controls
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [tickMs, setTickMs] = useState(60)
  const [snapToPoints, setSnapToPoints] = useState(true)   // exact-point mode
  const [pointStepMs, setPointStepMs] = useState(1000)     // safety for routes without timestamps

  // Animation refs
  const segIndexRef = useRef(0)
  const segStartWallRef = useRef(0)
  const segStartRouteTRef = useRef(0)
  const rafRef = useRef(0)
  const lastTickRef = useRef(0)

  // Load data (public/dummy-route.json -> fallback)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/dummy-route.json')
        if (!res.ok) throw new Error('fetch failed')
        const json = await res.json()
        const pts = normalizeTimestamps(json)
        if (mounted) hydrate(pts)
      } catch {
        const pts = normalizeTimestamps(EMBEDDED_POINTS)
        if (mounted) hydrate(pts)
      }
    })()
    return () => {
      mounted = false
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const hydrate = useCallback((pts) => {
    setRoute(pts)
    const start = { lat: pts[0].latitude, lng: pts[0].longitude }
    setTraveled([[start.lat, start.lng]])
    setPosition(start)
    setHeading(pts[1] ? bearingDeg(pts[0], pts[1]) : 0)
    segIndexRef.current = 0
    segStartRouteTRef.current = pts[0].t
    setHud({ lat: start.lat, lng: start.lng, ts: pts[0].t, speed: 0 })
  }, [])

  // Animation loop
  useEffect(() => {
    if (!playing || route.length < 2) return
    segStartWallRef.current = performance.now()

    const step = () => {
      rafRef.current = requestAnimationFrame(step)
      const now = performance.now()
      if (lastTickRef.current && now - lastTickRef.current < tickMs) return
      lastTickRef.current = now

      let i = segIndexRef.current
      const A = route[i]
      const B = route[i + 1]
      if (!B) {
        setPlaying(false)
        cancelAnimationFrame(rafRef.current)
        return
      }

      const elapsed = (now - segStartWallRef.current) * speed
      const segDur = Math.max(1, B.t - A.t)
      const routeNow = segStartRouteTRef.current + elapsed

      if (snapToPoints) {
        // Snap mode: stay on A until route time crosses B.t, then jump to B
        const atB = routeNow >= B.t
        const pos = atB ? { latitude: B.latitude, longitude: B.longitude } : { latitude: A.latitude, longitude: A.longitude }
        const instSpeed = haversine(A, B) / (segDur / 1000)
        setPosition({ lat: pos.latitude, lng: pos.longitude })
        setHeading(bearingDeg(A, B))
        setHud({ lat: pos.latitude, lng: pos.longitude, ts: atB ? B.t : A.t, speed: instSpeed })
        if (atB) {
          setTraveled(prev => {
            const last = prev[prev.length - 1]
            if (!last || last[0] !== B.latitude || last[1] !== B.longitude) return [...prev, [B.latitude, B.longitude]]
            return prev
          })
          segIndexRef.current = i + 1
          segStartWallRef.current = performance.now()
          segStartRouteTRef.current = route[i + 1].t ?? (segStartRouteTRef.current + (pointStepMs * speed))
        }
      } else {
        // Smooth interpolation
        const t = Math.min(1, (routeNow - A.t) / segDur)
        const pos = interpPoint(A, B, t)
        const instSpeed = haversine(A, B) / (segDur / 1000)
        setPosition({ lat: pos.latitude, lng: pos.longitude })
        setHeading(bearingDeg(A, B))
        setTraveled(prev => {
          const last = prev[prev.length - 1]
          if (!last || last[0] !== pos.latitude || last[1] !== pos.longitude) return [...prev, [pos.latitude, pos.longitude]]
          return prev
        })
        setHud({ lat: pos.latitude, lng: pos.longitude, ts: A.t + t * segDur, speed: instSpeed })
        if (t >= 1) {
          segIndexRef.current = i + 1
          segStartWallRef.current = performance.now()
          segStartRouteTRef.current = route[i + 1].t
        }
      }
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, route, speed, tickMs, snapToPoints, pointStepMs])

  const play  = useCallback(() => setPlaying(true), [])
  const pause = useCallback(() => setPlaying(false), [])
  const reset = useCallback(() => {
    setPlaying(false)
    cancelAnimationFrame(rafRef.current)
    segIndexRef.current = 0
    if (route[0]) {
      segStartRouteTRef.current = route[0].t
      const start = { lat: route[0].latitude, lng: route[0].longitude }
      setTraveled([[start.lat, start.lng]])
      setPosition(start)
      setHeading(route[1] ? bearingDeg(route[0], route[1]) : 0)
      setHud({ lat: start.lat, lng: start.lng, ts: route[0].t, speed: 0 })
    }
  }, [route])

  const value = useMemo(() => ({
    route, traveled, position, heading, hud,
    playing, speed, tickMs, snapToPoints, pointStepMs,
    setSpeed, setTickMs, setSnapToPoints, setPointStepMs,
    play, pause, reset
  }), [route, traveled, position, heading, hud, playing, speed, tickMs, snapToPoints, pointStepMs, play, pause, reset])

  return <PlaybackCtx.Provider value={value}>{children}</PlaybackCtx.Provider>
}
