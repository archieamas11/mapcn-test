import type { MapRef } from '@/components/ui/map'
import { useEffect, useRef, useState } from 'react'
import { Map } from '@/components/ui/map'
import { styles } from './components/map.styles'
import { MarkersLayer } from './components/MapViewLayers'

type StyleKey = keyof typeof styles

function App() {
  const mapRef = useRef<MapRef>(null)
  const [style, setStyle] = useState<StyleKey>('default')
  const selectedStyle = styles[style]
  const is3D = style === 'openstreetmap3d'
  const center: [number, number] = [123.79779924469761, 10.249290885383175] // [lng, lat]

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 0, duration: 500 })
  }, [is3D])

  return (
    <div className="h-screen w-screen">
      <div className="h-full p-0 w-full">
        <Map
          ref={mapRef}
          center={center}
          zoom={19}
          styles={
            selectedStyle
              ? { light: selectedStyle, dark: selectedStyle }
              : undefined
          }
        >
          <MarkersLayer />
        </Map>
        <div className="absolute bottom-2 right-2 z-10">
          <select
            value={style}
            onChange={e => setStyle(e.target.value as StyleKey)}
            className="bg-background text-foreground border rounded-md px-2 py-1 text-sm shadow"
          >
            <option value="default">Default (Satellite)</option>
            <option value="openstreetmap">OpenStreetMap</option>
            <option value="openstreetmap3d">OpenStreetMap 3D</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default App
