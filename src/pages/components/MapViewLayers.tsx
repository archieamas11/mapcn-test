/* eslint-disable no-alert */
import { ExternalLink, MapPin, Navigation, Pencil, PrinterIcon, SearchIcon, X } from 'lucide-react'
import maplibregl from 'maplibre-gl'
import { useEffect, useId, useRef, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapControls, useMap } from '@/components/ui/map'
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { NicheGrids } from './NicheGrids'

// Generate random points around Finisterre Gardenz
function generateRandomPoints(count: number) {
  const center = { lng: 123.798102525943648, lat: 10.24864620598991 }
  const features = []

  for (let i = 0; i < count; i++) {
    const metersToDegrees = 1 / 111320
    const offsetLng = (Math.random() - 0.5) * 20 * metersToDegrees
    const offsetLat = (Math.random() - 0.5) * 20 * metersToDegrees
    const lng = center.lng + offsetLng
    const lat = center.lat + offsetLat
    const categories = ['chambers', 'lawn_lot', 'columbarium']
    const category = categories[Math.floor(Math.random() * categories.length)]
    const properties: any = {
      id: i,
      name: `Location ${i + 1}`,
      category,
    }

    const status = ['available', 'sold', 'reserved', 'hold', 'not_available'][
      Math.floor(Math.random() * 5)
    ]
    properties.status = status

    const law_type = ['bronze', 'diamond', 'platinum', 'silver'][
      Math.floor(Math.random() * 4)
    ]
    properties.law_type = law_type

    if (category === 'lawn_lot') {
      properties.width = Math.floor(Math.random() * 100) + 10
      properties.length = Math.floor(Math.random() * 100) + 10
      properties.area = properties.width * properties.length
    }

    if (category === 'chambers' || category === 'columbarium') {
      properties.rows = Math.floor(Math.random() * 10) + 1
      properties.columns = Math.floor(Math.random() * 20) + 1
    }

    features.push({
      type: 'Feature' as const,
      properties,
      geometry: {
        type: 'Point' as const,
        coordinates: [lng, lat],
      },
    })
  }

  return {
    type: 'FeatureCollection' as const,
    features,
  }
}

// 200 markers - would be slow with DOM markers, but fast with layers
const pointsData = generateRandomPoints(200)

interface SelectedPoint {
  id: number
  name: string
  category: string
  coordinates: [number, number]
  lawn_type?: string
  image: string
  status?: string
  width?: number
  length?: number
  area?: number
  rows?: number
  columns?: number
}

export function MarkersLayer() {
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(
    null,
  )

  // Move the map/marker logic into a child component so it can use `useSidebar()`
  // (which requires being within `SidebarProvider`).
  function MarkersLayerContent() {
    const { map, isLoaded } = useMap()
    const id = useId()
    const sourceId = `markers-source-${id}`
    const layerId = `markers-layer-${id}`
    const mapPinMarkerRef = useRef<maplibregl.Marker | null>(null)

    const { setOpen, setOpenMobile, isMobile } = useSidebar()

    useEffect(() => {
      if (!map || !isLoaded)
        return

      map.addSource(sourceId, {
        type: 'geojson',
        data: pointsData,
      })

      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'case',
            ['in', ['get', 'category'], ['literal', ['chambers', 'columbarium']]],
            '#9ca3af',
            [
              'match',
              ['get', 'status'],
              'available',
              '#10b981',
              'sold',
              '#ef4444',
              'reserved',
              '#f59e0b',
              'hold',
              '#8b5cf6',
              'not_available',
              '#6b7280',
              '#3b82f6',
            ],
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      const handleClick = (
        e: maplibregl.MapMouseEvent & {
          features?: maplibregl.MapGeoJSONFeature[]
        },
      ) => {
        if (!e.features?.length)
          return

        const feature = e.features[0]
        const coords = (feature.geometry as GeoJSON.Point).coordinates as [
          number,
          number,
        ]

        const images = [
          'https://images.unsplash.com/photo-1575223970966-76ae61ee7838?w=300&h=200&fit=crop',
          'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=300&h=200&fit=crop',
          'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=300&h=200&fit=crop',
        ]
        const randomImage = images[Math.floor(Math.random() * images.length)]

        // Update selected point
        setSelectedPoint({
          id: feature.properties?.id,
          name: feature.properties?.name,
          category: feature.properties?.category,
          image: randomImage,
          coordinates: coords,
          lawn_type: feature.properties?.law_type,
          status: feature.properties?.status,
          width: feature.properties?.width,
          length: feature.properties?.length,
          area: feature.properties?.area,
          rows: feature.properties?.rows,
          columns: feature.properties?.columns,
        })

        // Center camera on the clicked marker
        map.flyTo({
          center: coords,
          zoom: Math.max(map.getZoom(), 18),
          duration: 1000,
          essential: true,
        })

        // Ensure sidebar is open when a marker is clicked
        if (isMobile) {
          setOpenMobile(true)
        }
        else {
          setOpen(true)
        }
      }

      const handleMouseEnter = () => {
        map.getCanvas().style.cursor = 'pointer'
      }

      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = ''
      }

      map.on('click', layerId, handleClick)
      map.on('mouseenter', layerId, handleMouseEnter)
      map.on('mouseleave', layerId, handleMouseLeave)

      return () => {
        map.off('click', layerId, handleClick)
        map.off('mouseenter', layerId, handleMouseEnter)
        map.off('mouseleave', layerId, handleMouseLeave)

        try {
          if (map.getLayer(layerId))
            map.removeLayer(layerId)
          if (map.getSource(sourceId))
            map.removeSource(sourceId)
        }
        catch {
          // ignore cleanup errors
        }
      }
    }, [map, isLoaded, sourceId, layerId, isMobile, setOpen, setOpenMobile])

    // Handle MapPin marker for selected point
    useEffect(() => {
      if (!map || !isLoaded)
        return

      // Remove existing MapPin marker
      if (mapPinMarkerRef.current) {
        mapPinMarkerRef.current.remove()
        mapPinMarkerRef.current = null
      }

      if (selectedPoint) {
        // Filter out the selected marker from the circle layer
        map.setFilter(layerId, ['!=', ['get', 'id'], selectedPoint.id])

        // Create MapPin element
        const el = document.createElement('div')
        el.innerHTML = renderToString(
          <MapPin
            className="w-5 h-5 text-red-500 drop-shadow-lg"
            fill="currentColor"
          />,
        )
        el.style.cursor = 'pointer'

        // Create and add the MapPin marker
        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat(selectedPoint.coordinates)
          .addTo(map)

        mapPinMarkerRef.current = marker
      }
      else {
        // Reset filter to show all circle markers
        map.setFilter(layerId, null)
      }

      return () => {
        if (mapPinMarkerRef.current) {
          mapPinMarkerRef.current.remove()
          mapPinMarkerRef.current = null
        }
      }
    }, [map, isLoaded, selectedPoint, layerId])

    return null
  }

  function SidebarContentComponent() {
    const [imageLoaded, setImageLoaded] = useState(false)

    useEffect(() => {
      setImageLoaded(false)
    }, [selectedPoint])

    // Clear search handler (placeholder)
    const { setOpen, setOpenMobile, isMobile } = useSidebar()
    const handleClear = () => {
      // Close sidebar
      if (isMobile) {
        setOpenMobile(false)
      }
      else {
        setOpen(false)
      }
      // Hide sidebar trigger by clearing selectedPoint
      setSelectedPoint(null)
    }

    if (!selectedPoint) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <p>Select a marker on the map to view details</p>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4 overflow-y-auto scrollbar-thin py-4 px-2">
        <form className="flex w-full gap-1" role="search" aria-label="Admin lot search">
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
            {selectedPoint && (
              <button
                className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center rounded-e-full transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer pr-5"
                aria-label="Clear search"
                type="button"
                onClick={handleClear}
              >
                <X size={20} aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
        {/* Plot Information Header */}
        <div className="bg-secondary p-5 w-full relative ">
          <div className="absolute top-2 right-2">
            { }
            <Button size="icon" variant="outline" className="rounded-full" title="Print Niche" onClick={() => alert('Print Niche clicked')}>
              <PrinterIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Header */}
          <div className="text-center">
            <p className="text-xs tracking-wide uppercase text-muted-foreground">
              Finisterre Gardenz
            </p>
            <h2 className="text-xl font-semibold text-foreground">
              Plot Information
            </h2>
          </div>
        </div>

        {/* Image Display */}
        <div className="w-full h-full overflow-hidden">
          <div className="relative p-2 ">
            {!imageLoaded && <Skeleton className="w-full h-full absolute inset-0 " />}
            <img
              src={selectedPoint.image}
              alt={selectedPoint.name}
              className="object-cover w-full h-full rounded-md"
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <div className="space-y-2 p-4">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {selectedPoint.category === 'chambers' ? 'Memorial Chambers' : selectedPoint.category === 'columbarium' ? 'Columbarium' : selectedPoint.category === 'lawn_lot' ? 'Lawn Lot' : ''}
            </span>
            <p className="font-semibold text-foreground leading-tight">
              {selectedPoint.category === 'chambers' && 'A dignified memorial chamber with individual niches for placement and remembrance.'}
              {selectedPoint.category === 'columbarium' && 'A peaceful columbarium with organized niches for eternal rest and peaceful remembrance.'}
              {selectedPoint.category === 'lawn_lot' && 'A serene lawn lot perfect for gatherings, ceremonies, and peaceful moments of reflection.'}
            </p>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Stats Grid */}
            {selectedPoint.category === 'chambers' || selectedPoint.category === 'columbarium'
              ? (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-0">
                      <p className="text-xs text-muted-foreground">Rows</p>
                      <p className="text-lg font-semibold">{selectedPoint.rows ?? '—'}</p>
                    </div>
                    <div className="space-y-0">
                      <p className="text-xs text-muted-foreground">Columns</p>
                      <p className="text-lg font-semibold">{selectedPoint.columns ?? '—'}</p>
                    </div>
                    <div className="space-y-0">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-lg font-semibold">
                        {selectedPoint.rows && selectedPoint.columns
                          ? selectedPoint.rows * selectedPoint.columns
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                )
              : selectedPoint.category === 'lawn_lot'
                ? (
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="space-y-0">
                        <p className="text-xs text-muted-foreground">Width</p>
                        <p className="text-lg font-semibold">
                          {selectedPoint.width}
                        </p>
                      </div>
                      <div className="space-y-0">
                        <p className="text-xs text-muted-foreground">Length</p>
                        <p className="text-lg font-semibold">
                          {selectedPoint.length}
                          m
                        </p>
                      </div>
                      <div className="space-y-0">
                        <p className="text-xs text-muted-foreground">Area</p>
                        <p className="text-lg font-semibold">
                          {selectedPoint.area}
                          m²
                        </p>
                      </div>
                    </div>
                  )
                : null}

            <div className="flex justify-evenly pt-1">
              {/* Get direction button for activating navigation to the plot, and share button for sharing the plot details. These buttons are placeholders and can be implemented with actual functionality as needed. */}
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full w-10 h-10 flex items-center justify-center p-0"
                  title="Get Direction"
                  onClick={() => alert('Get Direction clicked')}
                >
                  <Navigation className="size-4" />
                </Button>
                <span className="text-foreground-muted">Direction</span>
              </div>
              {/* this button will share the plot via coppy link or via qr code and if the user scan it or paste the link it will auto popup specific plot */}
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full w-10 h-10 flex items-center justify-center p-0"
                  title="Share Plot"
                  onClick={() => alert('Share Plot clicked')}
                >
                  <ExternalLink className="size-4" />
                </Button>
                <span className="text-foreground-muted">Share</span>
              </div>
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full w-10 h-10 flex items-center justify-center p-0"
                  title="Edit Plot"
                  onClick={() => alert('Edit Plot clicked')}
                >
                  <Pencil className="size-4" />
                </Button>
                <span className="text-foreground-muted">Edit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category-specific Details */}
        {(selectedPoint.category === 'lawn_lot') && (
          <div className="bg-secondary rounded-md shadow-sm p-5 w-full">
            <div className="grid grid-cols-2 gap-4">
              {/* Plot Status */}
              <div className="text-center space-y-2">
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Status</div>
                <div className="flex justify-center">
                  <div
                    className="text-foreground font-bold text-md leading-none rounded-full px-2 py-1 flex gap-1 items-center justify-center"
                    aria-label="Plot Status"
                    title="Plot Status"
                  >
                    <span className="text-xs capitalize leading-none">{selectedPoint.status}</span>
                  </div>
                </div>
              </div>
              <div className="text-center space-y-2 border-l border-border">
                {/* Plot category */}
                <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Category</div>
                <div className="flex justify-center">
                  <span
                    className="text-foreground font-bold text-md leading-none rounded-full px-2 py-1 flex gap-1 items-center justify-center"
                  >
                    <span className="text-xs capitalize font-bold">{selectedPoint.lawn_type}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* popup for columbarium or chambers with niche grid display */}
        {(selectedPoint.category === 'columbarium'
          || selectedPoint.category === 'chambers') && (
          <div className="space-y-2">
            {/* {Niche grids are common in columbariums and chambers, showing available niches.} */}
            {selectedPoint.rows && selectedPoint.columns && (
              <NicheGrids
                rows={selectedPoint.rows}
                cols={selectedPoint.columns}
              />
            )}

            <div className="grid grid-cols-4 gap-2 text-xs bg-secondary p-2 rounded-md">
              <div className="rounded-lg bg-green-50 p-2 text-center dark:bg-green-200 border">
                <div className="font-semibold text-green-700">{pointsData.features.filter(f => f.properties.status === 'available').length}</div>
                <div className="text-green-600">Available</div>
              </div>
              <div className="rounded bg-yellow-50 p-2 text-center dark:bg-yellow-200 border">
                <div className="font-semibold text-yellow-700">{pointsData.features.filter(f => f.properties.status === 'reserved').length}</div>
                <div className="text-yellow-600">Reserved</div>
              </div>
              <div className="rounded bg-red-50 p-2 text-center dark:bg-red-200 border">
                <div className="font-semibold text-red-700">{pointsData.features.filter(f => f.properties.status === 'sold').length}</div>
                <div className="text-red-600">Sold</div>
              </div>
              <div className="rounded bg-cyan-200 p-2 text-center dark:bg-cyan-400 border">
                <div className="font-semibold text-cyan-700">{pointsData.features.filter(f => f.properties.status === 'hold').length}</div>
                <div className="text-cyan-600">Hold</div>
              </div>
            </div>
          </div>
        )}

        {/* else */}
        {!['lawn_lot', 'columbarium', 'chambers'].includes(
          selectedPoint.category,
        ) && (
          <p className="text-sm text-gray-500 italic">
            No additional info available.
          </p>
        )}
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <MarkersLayerContent />
      <Sidebar>
        <SidebarContent>
          <SidebarContentComponent />
        </SidebarContent>
      </Sidebar>

      <main className="relative">
        {selectedPoint && <SidebarTrigger />}
        <MapControls
          position="top-left"
          showZoom
          showCompass
          showLocate
          showFullscreen
          resetViewport
          use3D={true}
        />
      </main>
    </SidebarProvider>
  )
}
