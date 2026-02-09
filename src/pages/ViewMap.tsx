import type { MapRef } from '@/components/ui/map'
import { useEffect, useRef, useState } from 'react'
import { Map, MapControls } from '@/components/ui/map'
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
          zoom={18}
          styles={
            selectedStyle
              ? { light: selectedStyle, dark: selectedStyle }
              : undefined
          }
        >
          { /* Map controls with various features enabled */ }
          <MapControls
            position="bottom-right"
            showZoom
            showCompass
            showLocate
            showFullscreen
            resetViewport
          />

          {/* Render markers for each place in the data */ }
          {/* {places.map(place => (
            <MapMarker
              key={place.id}
              longitude={place.lng}
              latitude={place.lat}
            >
              <MarkerContent>
                <div className="size-5 rounded-full bg-rose-500 border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" />
                <MarkerLabel position="bottom">{place.label}</MarkerLabel>
              </MarkerContent>
              <MarkerPopup className="p-0 w-62">
                <div className="relative h-32 overflow-hidden rounded-t-md">
                  <img
                    src={place.image}
                    alt={place.name}
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2 p-3">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {place.category}
                    </span>
                    <h3 className="font-semibold text-foreground leading-tight">
                      {place.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{place.rating}</span>
                      <span className="text-muted-foreground">
                        (
                        {place.reviews.toLocaleString()}
                        )
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span>{place.hours}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1 h-8">
                      <Navigation className="size-3.5 mr-1.5" />
                      Directions
                    </Button>
                    <Button size="sm" variant="outline" className="h-8">
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))} */}

          <MarkersLayer />
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
