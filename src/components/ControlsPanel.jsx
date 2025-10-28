import { fmt } from '../utils/geo'
import Metric from './atoms/Metric'
import { usePlayback } from '../context/PlaybackContext'

export default function ControlsPanel() {
  const {
    playing, speed, tickMs, snapToPoints, pointStepMs,
    setSpeed, setTickMs, setSnapToPoints, setPointStepMs,
    play, pause, reset, hud
  } = usePlayback()

  return (
    <aside className="panel controls">
      <h2>Controls</h2>

      <div className="row" style={{ marginBottom: '.5rem' }}>
        <button className="btn btn-primary" onClick={play} disabled={playing}>▶ Play</button>
        <button className="btn" onClick={pause} disabled={!playing}>⏸ Pause</button>
        <button className="btn btn-danger" onClick={reset}>⟲ Reset</button>
      </div>

      <div style={{ marginBottom: '.75rem' }}>
        <label>Playback speed</label>
        <select className="field" value={String(speed)} onChange={e => setSpeed(parseFloat(e.target.value))}>
          <option value="0.5">0.5×</option>
          <option value="1">1× </option>
          <option value="2">2×</option>
          <option value="5">5×</option>
          <option value="10">10×</option>
        </select>
      </div>

      <div style={{ marginBottom: '.75rem' }}>
        <label>Animation tick (ms)</label>
        <input type="range" min={16} max={1000} step={1} value={tickMs} onChange={e => setTickMs(parseInt(e.target.value))} className="field" />
      </div>

      <div className="row" style={{ alignItems: 'center', marginBottom: '.75rem' }}>
        <input id="snap" type="checkbox" checked={snapToPoints} onChange={e => setSnapToPoints(e.target.checked)} />
        <label htmlFor="snap">Snap to route points (no interpolation)</label>
      </div>

      {!hud.ts && (
        <div style={{ marginBottom: '.75rem' }}>
          <label>Point step (ms) for routes without timestamps</label>
          <input type="number" min={100} step={100} value={pointStepMs} onChange={e => setPointStepMs(parseInt(e.target.value))} className="field" />
        </div>
      )}

      <div className="metrics" style={{ marginTop: '.5rem' }}>
        <Metric k="Current Lat" v={fmt(hud.lat)} />
        <Metric k="Current Lng" v={fmt(hud.lng)} />
        <Metric k="Timestamp"  v={hud.ts ? new Date(hud.ts).toISOString().replace('T',' ').replace('Z',' UTC') : '–'} />
        <Metric k="Speed"      v={hud.speed ? `${hud.speed.toFixed(2)} m/s` : '–'} />
      </div>

      <details style={{ color: 'var(--muted)', marginTop: '.5rem' }}>
        <summary>Data source & fallback</summary>
        <p>We try to fetch <code>/dummy-route.json</code> (public/). If absent, we fall back to an embedded Hyderabad route.</p>
      </details>
    </aside>
  )
}
