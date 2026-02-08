import type MapLibreGL from 'maplibre-gl'
import type { MapRef } from '@/components/ui/map'
import { useEffect, useRef, useState } from 'react'
import { Map, MapControls } from '@/components/ui/map'
import './App.css'

const styles = {
  default: {
    version: 8,
    name: 'ArcGIS Satellite',
    sources: {
      'arcgis-tiles': {
        type: 'raster' as const,
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        minzoom: 1,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'arcgis-tiles',
        type: 'raster',
        source: 'arcgis-tiles',
        paint: {
          'raster-fade-duration': 100,
        },
      },
    ],
  } as MapLibreGL.StyleSpecification,
  openstreetmap: 'https://tiles.openfreemap.org/styles/bright',
  openstreetmap3d: 'https://tiles.openfreemap.org/styles/liberty',
}

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
          zoom={18}
          styles={
            selectedStyle
              ? { light: selectedStyle, dark: selectedStyle }
              : undefined
          }
        >
          <MapControls
            position="bottom-right"
            showZoom
            showCompass
            showLocate
            showFullscreen
            resetViewport
          />
        </Map>
        <div className="absolute top-2 right-2 z-10">
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
