import type { MapRef } from '@/components/ui/map'
import { useEffect, useRef, useState } from 'react'
import { Map } from '@/components/ui/map'
import { Select, SelectContent, SelectItem, SelectPositioner, SelectTrigger, SelectValue } from '@/components/ui/select'
import { mapStyles } from './components/map.styles'
import { MarkersLayer } from './components/MapViewLayers'

function App() {
  const mapRef = useRef<MapRef>(null)
  const [style, setStyle] = useState<string>('arcgis-satellite')
  const selectedMapStyle = mapStyles.find(ms => ms.id === style)
  const selectedStyle = selectedMapStyle?.styleUrl
  const is3D = style === 'osm-3d'
  const MapCenter: [number, number] = [123.79779924469761, 10.249290885383175] // [lng, lat]

  useEffect(() => {
    mapRef.current?.easeTo({ pitch: is3D ? 60 : 0, duration: 500 })
  }, [is3D])

  return (
    <div className="h-screen w-screen">
      <div className="h-full p-0 w-full">
        <Map
          ref={mapRef}
          center={MapCenter}
          zoom={19}
          styles={
            selectedStyle
              ? { light: selectedStyle, dark: selectedStyle }
              : undefined
          }
        >
          {/* Minglanilla branch markers  */}
          <MarkersLayer />

          {/* Display other branch test */}
        </Map>

        {/* Display changing of branch of cemetery here, if needed. Branch is a property of plot, so we can filter the markers based on the selected branch. We can also display a dropdown to select the branch. */}

        {/* display new map styles here */}
        <div className="absolute bottom-2 right-2 z-10">
          <Select
            value={style}
            onValueChange={(value) => {
              if (value)
                setStyle(value)
            }}
          >
            <SelectTrigger className="bg-background text-foreground border rounded-md px-2 py-1 text-sm shadow w-fit">
              <SelectValue render={(_, { value }) => {
                const selected = mapStyles.find(ms => ms.id === value)
                return selected
                  ? (
                      <div className="flex gap-2">
                        {selected.name}
                        <img src={selected.image} alt={selected.name} className="w-4 h-4" />
                      </div>
                    )
                  : <span>Select a style</span>
              }}
              />
            </SelectTrigger>
            <SelectPositioner>
              <SelectContent>
                {mapStyles.map(ms => (
                  <SelectItem key={ms.id} value={ms.id}>
                    <div className="flex gap-2">
                      {ms.name}
                      <img src={ms.image} alt={ms.name} className="w-4 h-4" />
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectPositioner>
          </Select>
        </div>
      </div>
    </div>
  )
}

export default App
