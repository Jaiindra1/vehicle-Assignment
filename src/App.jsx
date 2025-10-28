import { PlaybackProvider } from './context/PlaybackContext'
import ControlsPanel from './components/ControlsPanel'
import MapPanel from './components/MapPanel'

export default function App() {
  return (
    <PlaybackProvider>
      <div className="app">
        <header className="header">
          <h1>Vehicle Route Simulator</h1>
        </header>

        <div className="layout">
          <ControlsPanel />
          <MapPanel />
        </div>

       
      </div>
    </PlaybackProvider>
  )
}
