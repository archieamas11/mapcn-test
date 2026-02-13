/* eslint-disable no-alert */
import type { PlotMarkerData } from '@/api/plots'
import type { PlotFeatureProperties, PlotStatusCounts, SelectedPoint } from '@/types/plot-marker.types'
import type { PlotCategoryType } from '@/types/plot.types'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { ExternalLink, MapPin, Navigation, Pencil, PrinterIcon, SearchIcon, X } from 'lucide-react'
import maplibregl from 'maplibre-gl'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { useShallow } from 'zustand/react/shallow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MapControls, useMap } from '@/components/ui/map'
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useNichesByPlot } from '@/hooks/use-niches-by-plot'
import { usePlotMarkers } from '@/hooks/use-plot-markers'
import { useSidebarStore } from '@/stores/sidebar-store'
import { PLOT_CATEGORY, PLOT_STATUS } from '@/types/plot.types'
import EditPlotDialog from './dialogs/EditPlotDialog'
import { NicheGrids } from './NicheGrids'

type PlotFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, PlotFeatureProperties>

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1575223970966-76ae61ee7838?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1496588152823-86ff7695e68f?w=300&h=200&fit=crop',
  'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=300&h=200&fit=crop',
] as const

const EMPTY_FEATURE_COLLECTION: PlotFeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

function getFallbackImage(plotId: number): string {
  return FALLBACK_IMAGES[plotId % FALLBACK_IMAGES.length]
}

function getCategoryName(category: PlotCategoryType): string {
  if (category === PLOT_CATEGORY.CHAMBERS) {
    return 'Memorial Chambers'
  }

  if (category === PLOT_CATEGORY.COLUMBARIUM) {
    return 'Columbarium'
  }

  return 'Lawn Lot'
}

function buildFeatureCollection(plotMarkersData: PlotMarkerData[]): PlotFeatureCollection {
  const features = plotMarkersData
    .filter(({ plot }) => plot.isVisible)
    .filter(({ plot }) => Number.isFinite(plot.lng) && Number.isFinite(plot.lat))
    .map(({ plot, niche, lawnLot }) => {
      const status = plot.category === PLOT_CATEGORY.LAWN
        ? lawnLot?.lawn_status ?? PLOT_STATUS.AVAILABLE
        : niche?.niche_status ?? PLOT_STATUS.AVAILABLE

      return {
        id: plot.plot_id,
        type: 'Feature',
        properties: {
          id: plot.plot_id,
          name: `${getCategoryName(plot.category)} ${plot.plot_id}`,
          category: plot.category,
          image: plot.image_url || getFallbackImage(plot.plot_id),
          status,
          lawn_type: lawnLot?.lawn_type,
          width: lawnLot?.width,
          length: lawnLot?.length,
          area: lawnLot?.area,
          rows: plot.niche_row,
          columns: plot.niche_columns,
        },
        geometry: {
          type: 'Point',
          coordinates: [plot.lng, plot.lat],
        },
      } satisfies GeoJSON.Feature<GeoJSON.Point, PlotFeatureProperties> & { id: number }
    })

  return {
    type: 'FeatureCollection',
    features,
  }
}

interface MarkersLayerContentProps {
  pointsData: PlotFeatureCollection
  selectedPoint: SelectedPoint | null
  setSelectedPoint: (point: SelectedPoint | null) => void
}

function MarkersLayerContent({ pointsData, selectedPoint, setSelectedPoint }: MarkersLayerContentProps) {
  const { map, isLoaded } = useMap()
  const id = useId()
  const sourceId = `markers-source-${id}`
  const layerId = `markers-layer-${id}`
  const mapPinMarkerRef = useRef<maplibregl.Marker | null>(null)
  const pointsDataRef = useRef<PlotFeatureCollection>(pointsData)

  useEffect(() => {
    pointsDataRef.current = pointsData
  }, [pointsData])

  const { setOpen, setOpenMobile, isMobile } = useSidebarStore(
    useShallow(s => ({
      setOpen: s.setOpen,
      setOpenMobile: s.setOpenMobile,
      isMobile: s.isMobile,
    })),
  )
  useEffect(() => {
    if (!map || !isLoaded)
      return

    map.addSource(sourceId, {
      type: 'geojson',
      data: EMPTY_FEATURE_COLLECTION,
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
      const rawFeatureId = feature.id
      if (rawFeatureId === undefined)
        return

      const featureId = typeof rawFeatureId === 'number'
        ? rawFeatureId
        : Number(rawFeatureId)

      if (!Number.isFinite(featureId))
        return

      const selectedFeature = pointsDataRef.current.features.find(currentFeature => currentFeature.id === featureId)
      if (!selectedFeature)
        return

      const coords = (feature.geometry as GeoJSON.Point).coordinates as [
        number,
        number,
      ]
      const pointData = selectedFeature.properties

      setSelectedPoint({
        id: pointData.id,
        name: pointData.name,
        category: pointData.category,
        image: pointData.image,
        coordinates: coords,
        lawn_type: pointData.lawn_type,
        status: pointData.status,
        width: pointData.width,
        length: pointData.length,
        area: pointData.area,
        rows: pointData.rows,
        columns: pointData.columns,
      })

      map.flyTo({
        center: coords,
        zoom: Math.max(map.getZoom(), 18),
        duration: 1000,
        essential: true,
      })

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
  }, [map, isLoaded, sourceId, layerId, isMobile, setOpen, setOpenMobile, setSelectedPoint])

  useEffect(() => {
    if (!map || !isLoaded)
      return

    const source = map.getSource(sourceId)
    if (!source)
      return

    const geoJsonSource = source as maplibregl.GeoJSONSource
    geoJsonSource.setData(pointsData)
  }, [map, isLoaded, sourceId, pointsData])

  useEffect(() => {
    if (!map || !isLoaded)
      return

    if (mapPinMarkerRef.current) {
      mapPinMarkerRef.current.remove()
      mapPinMarkerRef.current = null
    }

    if (selectedPoint) {
      map.setFilter(layerId, ['!=', ['get', 'id'], selectedPoint.id])

      const el = document.createElement('div')
      el.innerHTML = renderToString(
        <MapPin
          className="w-5 h-5 text-red-500 drop-shadow-lg"
          fill="currentColor"
        />,
      )
      el.style.cursor = 'pointer'

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(selectedPoint.coordinates)
        .addTo(map)

      mapPinMarkerRef.current = marker
    }
    else {
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

function FloatingSearchBar() {
  const { open, openMobile, isMobile } = useSidebarStore(
    useShallow(s => ({
      open: s.open,
      openMobile: s.openMobile,
      isMobile: s.isMobile,
    })),
  )
  const isOpen = isMobile ? openMobile : open

  return (
    <AnimatePresence>
      {!isOpen && (
        <motion.form
          layoutId="search-bar"
          className="flex w-full gap-1 absolute top-2 right-1/2 transform translate-x-1/2 z-20 max-w-xs sm:max-w-lg"
          role="search"
          aria-label="Admin lot search"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="relative flex-1">
            <Input
              className="peer dark:bg-background h-12 w-full rounded-full bg-white ps-12 pe-10 text-xs md:h-14 md:text-sm"
              placeholder="Search..."
              aria-label="Search lot"
              autoComplete="off"
              name="search"
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-5">
              <SearchIcon size={20} />
            </div>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  )
}

interface SidebarContentComponentProps {
  selectedPoint: SelectedPoint | null
  isLoadingData: boolean
  isErrorData: boolean
  setSelectedPoint: (point: SelectedPoint | null) => void
}

function SidebarContentComponent({ selectedPoint, isLoadingData, isErrorData, setSelectedPoint }: SidebarContentComponentProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const selectedNichePlotId = selectedPoint
    && (selectedPoint.category === PLOT_CATEGORY.CHAMBERS || selectedPoint.category === PLOT_CATEGORY.COLUMBARIUM)
    ? selectedPoint.id
    : null

  const { data: selectedPlotNiches = [], isLoading: isLoadingSelectedPlotNiches } = useNichesByPlot(selectedNichePlotId)

  const nicheStatusCounts = useMemo(() => {
    return selectedPlotNiches.reduce<PlotStatusCounts>((summary, niche) => {
      summary[niche.niche_status] += 1
      return summary
    }, {
      available: 0,
      sold: 0,
      reserved: 0,
      hold: 0,
      not_available: 0,
    })
  }, [selectedPlotNiches])

  useEffect(() => {
    setImageLoaded(false)
    // Check if the image is already cached/loaded
    if (imgRef.current?.complete) {
      setImageLoaded(true)
    }
  }, [selectedPoint])

  const { setOpen, setOpenMobile, isMobile } = useSidebarStore(
    useShallow(s => ({
      setOpen: s.setOpen,
      setOpenMobile: s.setOpenMobile,
      isMobile: s.isMobile,
    })),
  )

  const handleClear = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
    else {
      setOpen(false)
    }
    setSelectedPoint(null)
  }

  const handleEditPlot = () => {
    setIsEditOpen(true)
  }

  if (!selectedPoint) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {isLoadingData && <p>Loading plot markers...</p>}
        {isErrorData && <p>Failed to load markers. Please try refreshing.</p>}
        {!isLoadingData && !isErrorData && <p>Select a marker on the map to view details</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Plot information searchbar */}
      <div className="sticky top-0 z-10 px-2 py-4 bg-transparent">
        <motion.form
          layoutId="search-bar"
          className="flex w-full gap-1"
          role="search"
          aria-label="Admin lot search"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="relative flex-1">
            <Input
              className="peer dark:bg-background h-9 w-full rounded-full bg-muted ps-12 pe-10 text-xs md:h-12 md:text-sm"
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
        </motion.form>
      </div>

      <div className="flex flex-col h-full w-full overflow-y-auto scrollbar-thin px-2 space-y-2">
        {/* Image and plot information Display */}
        <div className="w-full bg-primary/40 rounded-3xl">
          <div className="relative">
            {!imageLoaded && <Skeleton className="w-full rounded-t-3xl absolute inset-0" />}
            <img
              ref={imgRef}
              src={selectedPoint.image}
              alt={selectedPoint.name}
              className="object-cover w-full h-50 rounded-t-3xl"
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <div className="space-y-2 p-4">
            <span className="text-lg font-medium text-muted-foreground uppercase tracking-wide">
              {selectedPoint.category === 'chambers' ? 'Memorial Chambers' : selectedPoint.category === 'columbarium' ? 'Columbarium' : selectedPoint.category === 'lawn_lot' ? 'Lawn Lot' : ''}
            </span>
            <p className="font-semibold text-sm text-foreground leading-tight mb-8">
              {selectedPoint.category === 'chambers' && 'A dignified memorial chamber with individual niches for placement and remembrance.'}
              {selectedPoint.category === 'columbarium' && 'A peaceful columbarium with organized niches for eternal rest and peaceful remembrance.'}
              {selectedPoint.category === 'lawn_lot' && 'A serene lawn lot perfect for gatherings, ceremonies, and peaceful moments of reflection.'}
            </p>

            {/* plot information buttons */}
            <div className="flex justify-evenly">
              {/* Get direction button for activating navigation to the plot, and share button for sharing the plot details. These buttons are placeholders and can be implemented with actual functionality as needed. */}
              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  variant="outline"
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
                  variant="outline"
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
                  variant="outline"
                  className="rounded-full w-10 h-10 flex items-center justify-center p-0"
                  title="Print Plot"
                  onClick={() => alert('Print Plot clicked')}
                >
                  <PrinterIcon className="size-4" />
                </Button>
                <span className="text-foreground-muted">Print</span>
              </div>

              <div className="flex flex-col items-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full w-10 h-10 flex items-center justify-center p-0"
                  title="Edit Plot"
                  onClick={handleEditPlot}
                >
                  <Pencil className="size-4" />
                </Button>
                <span className="text-foreground-muted">Edit</span>
              </div>
            </div>

            <EditPlotDialog
              isOpen={isEditOpen}
              selectedPoint={selectedPoint}
              onClose={() => setIsEditOpen(false)}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="bg-primary/40 p-2 rounded-3xl">
          {selectedPoint.category === 'chambers' || selectedPoint.category === 'columbarium'
            ? (
                <div className="grid grid-cols-3 divide-x divide-border text-center rounded-lg overflow-hidden">
                  <div className="flex flex-col items-center py-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rows</span>
                    <span className="text-lg font-bold text-foreground">{selectedPoint.rows ?? '—'}</span>
                  </div>
                  <div className="flex flex-col items-center py-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Columns</span>
                    <span className="text-lg font-bold text-foreground">{selectedPoint.columns ?? '—'}</span>
                  </div>
                  <div className="flex flex-col items-center py-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total</span>
                    <span className="text-lg font-bold text-foreground">
                      {selectedPoint.rows && selectedPoint.columns
                        ? selectedPoint.rows * selectedPoint.columns
                        : 'N/A'}
                    </span>
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
                niches={selectedPlotNiches}
                isLoadingNiches={isLoadingSelectedPlotNiches}
              />
            )}

            <div className="grid grid-cols-4 gap-2 text-xs bg-secondary p-1 rounded-3xl justify-evenly">
              <div className="flex justify-center items-center gap-1">
                <div className="rounded-full bg-green-50 dark:bg-green-200 p-2">
                  <div className="font-semibold">{nicheStatusCounts.available}</div>
                </div>
                <div className="text-green-600">Available</div>
              </div>
              <div className="flex justify-center items-center gap-1">
                <div className="rounded-full bg-yellow-50 dark:bg-yellow-200 p-2">
                  <div className="font-semibold">{nicheStatusCounts.reserved}</div>
                </div>
                <div className="text-yellow-600">Reserved</div>
              </div>
              <div className="flex justify-center items-center gap-1">
                <div className="rounded-full bg-red-50 dark:bg-red-200 p-2">
                  <div className="font-semibold">{nicheStatusCounts.sold}</div>
                </div>
                <div className="text-red-600">Sold</div>
              </div>
              <div className="flex justify-center items-center gap-1">
                <div className="rounded-full bg-cyan-200 dark:bg-cyan-400 p-2">
                  <div className="font-semibold">{nicheStatusCounts.hold}</div>
                </div>
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
    </div>
  )
}

export function MarkersLayer() {
  const { data: plotMarkersData = [], isLoading, isError } = usePlotMarkers()
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(
    null,
  )
  const pointsData = useMemo(() => buildFeatureCollection(plotMarkersData), [plotMarkersData])

  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutGroup>
        <FloatingSearchBar />
        <Sidebar>
          <SidebarContent>
            <SidebarContentComponent
              selectedPoint={selectedPoint}
              isLoadingData={isLoading}
              isErrorData={isError}
              setSelectedPoint={setSelectedPoint}
            />
          </SidebarContent>
        </Sidebar>
      </LayoutGroup>

      <MarkersLayerContent
        pointsData={pointsData}
        selectedPoint={selectedPoint}
        setSelectedPoint={setSelectedPoint}
      />
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
          editMarker={true}
        />
      </main>
    </SidebarProvider>
  )
}
