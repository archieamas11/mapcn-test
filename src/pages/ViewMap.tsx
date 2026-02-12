import type { MapRef } from '@/components/ui/map'
import { SearchIcon, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
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
          <form className="flex w-full gap-1 max-w-md absolute top-2 right-1/2 transform translate-x-1/2" role="search" aria-label="Admin lot search">
            <div className="relative flex-1">
              <Input
                className="peer dark:bg-background h-9 w-full rounded-full bg-white ps-12 pe-10 text-xs md:h-14 md:text-sm"
                placeholder="Search..."
                aria-label="Search lot"
                autoComplete="off"
                name="search"
              />
              <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-5">
                <SearchIcon size={20} />
              </div>
            </div>
          </form>
          <MarkersLayer />
        </Map>
        <div className="absolute top-2 right-2 z-10">
          <select
            value={style}
            onChange={e => setStyle(e.target.value as StyleKey)}
            className="bg-background text-foreground border rounded-md px-2 py-1 text-sm shadow"
          >
            <option value="default">Default (3D)</option>
            <option value="openstreetmap">OpenStreetMap</option>
            <option value="openstreetmap3d">OpenStreetMap 3D</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default App
