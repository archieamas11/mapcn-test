/* eslint-disable no-alert */
import type { SelectedPlot } from '@/types/plot.types'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { ExternalLink, MapPin, Navigation, Pencil, PrinterIcon, SearchIcon, X } from 'lucide-react'
import maplibregl from 'maplibre-gl'
import { useEffect, useId, useRef, useState } from 'react'
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
import { useNichesByPlotId, usePlotsGeoJson } from '@/hooks/use-plots'
import { useSidebarStore } from '@/stores/sidebar-store'
import { PLOT_CATEGORY } from '@/types/plot.types'
import EditPlotDialog from './dialogs/EditPlotDialog'
import { NicheGrids } from './NicheGrids'

// ─── Map Layer Content ───────────────────────────────────────────────────────

interface MarkersLayerContentProps {
  selectedPlot: SelectedPlot | null
  setSelectedPlot: (plot: SelectedPlot | null) => void
}

function MarkersLayerContent({ selectedPlot, setSelectedPlot }: MarkersLayerContentProps) {
  const { map, isLoaded } = useMap()
  const id = useId()
  const sourceId = `markers-source-${id}`
  const layerId = `markers-layer-${id}`
  const mapPinMarkerRef = useRef<maplibregl.Marker | null>(null)

  const { data: geoJson } = usePlotsGeoJson()

  const { setOpen, setOpenMobile, isMobile } = useSidebarStore(
    useShallow(s => ({
      setOpen: s.setOpen,
      setOpenMobile: s.setOpenMobile,
      isMobile: s.isMobile,
    })),
  )

  // Add / update the GeoJSON source & circle layer
  useEffect(() => {
    if (!map || !isLoaded || !geoJson)
      return

    map.addSource(sourceId, {
      type: 'geojson',
      data: geoJson,
    })

    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': 6,
        'circle-color': [
          'case',
          ['in', ['get', 'category'], ['literal', [PLOT_CATEGORY.CHAMBERS, PLOT_CATEGORY.COLUMBARIUM]]],
          '#9ca3af',
          [
            'match',
            ['get', 'lawn_status'],
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
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number]
      const props = feature.properties as Record<string, string | number | null>

      setSelectedPlot({
        plot_id: Number(props.plot_id),
        category: props.category as SelectedPlot['category'],
        coordinates: coords,
        image_url: String(props.image_url ?? ''),
        niche_row: props.niche_row != null ? Number(props.niche_row) : null,
        niche_column: props.niche_column != null ? Number(props.niche_column) : null,
        lawn_status: (props.lawn_status as SelectedPlot['lawn_status']) ?? null,
        lawn_type: (props.lawn_type as SelectedPlot['lawn_type']) ?? null,
        width: props.width != null ? Number(props.width) : null,
        length: props.length != null ? Number(props.length) : null,
        area: props.area != null ? Number(props.area) : null,
        unit_code: props.unit_code != null ? String(props.unit_code) : null,
        block: props.block != null ? String(props.block) : null,
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
  }, [map, isLoaded, geoJson, sourceId, layerId, isMobile, setOpen, setOpenMobile, setSelectedPlot])

  // Selected marker pin overlay
  useEffect(() => {
    if (!map || !isLoaded)
      return

    if (mapPinMarkerRef.current) {
      mapPinMarkerRef.current.remove()
      mapPinMarkerRef.current = null
    }

    if (selectedPlot) {
      map.setFilter(layerId, ['!=', ['get', 'plot_id'], selectedPlot.plot_id])

      const el = document.createElement('div')
      el.innerHTML = renderToString(
        <MapPin
          className="w-5 h-5 text-red-500 drop-shadow-lg"
          fill="currentColor"
        />,
      )
      el.style.cursor = 'pointer'

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat(selectedPlot.coordinates)
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
  }, [map, isLoaded, selectedPlot, layerId])

  return null
}

// ─── Floating Search Bar ─────────────────────────────────────────────────────

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

// ─── Category Labels ─────────────────────────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  [PLOT_CATEGORY.CHAMBERS]: 'Memorial Chambers',
  [PLOT_CATEGORY.COLUMBARIUM]: 'Columbarium',
  [PLOT_CATEGORY.LAWN]: 'Lawn Lot',
}

const CATEGORY_DESCRIPTION: Record<string, string> = {
  [PLOT_CATEGORY.CHAMBERS]: 'A dignified memorial chamber with individual niches for placement and remembrance.',
  [PLOT_CATEGORY.COLUMBARIUM]: 'A peaceful columbarium with organized niches for eternal rest and peaceful remembrance.',
  [PLOT_CATEGORY.LAWN]: 'A serene lawn lot perfect for gatherings, ceremonies, and peaceful moments of reflection.',
}

// ─── Sidebar Content ─────────────────────────────────────────────────────────

interface SidebarContentComponentProps {
  selectedPlot: SelectedPlot | null
  setSelectedPlot: (plot: SelectedPlot | null) => void
}

function SidebarContentComponent({ selectedPlot, setSelectedPlot }: SidebarContentComponentProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Fetch niches for chambers/columbarium plots
  const isNicheCategory
    = selectedPlot?.category === PLOT_CATEGORY.CHAMBERS
      || selectedPlot?.category === PLOT_CATEGORY.COLUMBARIUM

  const { data: niches = [], isLoading: isNichesLoading } = useNichesByPlotId(
    isNicheCategory ? selectedPlot?.plot_id : null,
  )

  useEffect(() => {
    setImageLoaded(false)
    if (imgRef.current?.complete) {
      setImageLoaded(true)
    }
  }, [selectedPlot])

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
    setSelectedPlot(null)
  }

  const handleEditPlot = () => {
    setIsEditOpen(true)
  }

  if (!selectedPlot) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Select a marker on the map to view details</p>
      </div>
    )
  }

  // Niche status counts for the summary bar
  const nicheStatusCounts = {
    available: niches.filter(n => n.niche_status === 'available').length,
    reserved: niches.filter(n => n.niche_status === 'reserved').length,
    sold: niches.filter(n => n.niche_status === 'sold').length,
    hold: niches.filter(n => n.niche_status === 'hold').length,
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
            {selectedPlot && (
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
        <div className="w-full bg-secondary rounded-3xl">
          <div className="relative">
            {!imageLoaded && <Skeleton className="w-full rounded-t-3xl absolute inset-0" />}
            <img
              ref={imgRef}
              src={selectedPlot.image_url}
              alt={`Plot #${selectedPlot.plot_id}`}
              className="object-cover w-full h-50 rounded-t-3xl"
              onLoad={() => setImageLoaded(true)}
            />
          </div>

          <div className="space-y-2 p-4">
            <span className="text-lg font-medium text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABEL[selectedPlot.category] ?? ''}
            </span>
            <p className="font-semibold text-sm text-foreground leading-tight mb-8">
              {CATEGORY_DESCRIPTION[selectedPlot.category] ?? ''}
            </p>

            {/* plot information buttons */}
            <div className="flex justify-evenly">
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
              selectedPlot={selectedPlot}
              onClose={() => setIsEditOpen(false)}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="bg-secondary p-2 rounded-3xl">
          {isNicheCategory
            ? (
                <div className="grid grid-cols-3 divide-x divide-border text-center rounded-lg overflow-hidden">
                  <div className="flex flex-col items-center py-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rows</span>
                    <span className="text-lg font-bold text-foreground">{selectedPlot.niche_row ?? '—'}</span>
                  </div>
                  <div className="flex flex-col items-center py-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Columns</span>
                    <span className="text-lg font-bold text-foreground">{selectedPlot.niche_column ?? '—'}</span>
                  </div>
                  <div className="flex flex-col items-center py-2">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total</span>
                    <span className="text-lg font-bold text-foreground">
                      {selectedPlot.niche_row && selectedPlot.niche_column
                        ? selectedPlot.niche_row * selectedPlot.niche_column
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              )
            : selectedPlot.category === PLOT_CATEGORY.LAWN
              ? (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-0">
                      <p className="text-xs text-muted-foreground">Width</p>
                      <p className="text-lg font-semibold">
                        {selectedPlot.width}
                      </p>
                    </div>
                    <div className="space-y-0">
                      <p className="text-xs text-muted-foreground">Length</p>
                      <p className="text-lg font-semibold">
                        {selectedPlot.length}
                        m
                      </p>
                    </div>
                    <div className="space-y-0">
                      <p className="text-xs text-muted-foreground">Area</p>
                      <p className="text-lg font-semibold">
                        {selectedPlot.area}
                        m²
                      </p>
                    </div>
                  </div>
                )
              : null}
        </div>

        {/* Category-specific Details */}
        {selectedPlot.category === PLOT_CATEGORY.LAWN && (
          <div className="bg-secondary rounded-3xl p-5 w-full">
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
                    <span className="text-xs capitalize leading-none">{selectedPlot.lawn_status}</span>
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
                    <span className="text-xs capitalize font-bold">{selectedPlot.lawn_type}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Niche grid display for columbarium / chambers */}
        {isNicheCategory && (
          <div className="space-y-2">
            {selectedPlot.niche_row && selectedPlot.niche_column && (
              <NicheGrids
                rows={selectedPlot.niche_row}
                cols={selectedPlot.niche_column}
                niches={niches}
                isLoading={isNichesLoading}
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

        {/* Unknown category fallback */}
        {![PLOT_CATEGORY.LAWN, PLOT_CATEGORY.COLUMBARIUM, PLOT_CATEGORY.CHAMBERS].includes(
          selectedPlot.category,
        ) && (
          <p className="text-sm text-gray-500 italic">
            No additional info available.
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function MarkersLayer() {
  const [selectedPlot, setSelectedPlot] = useState<SelectedPlot | null>(null)

  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutGroup>
        <FloatingSearchBar />
        <Sidebar>
          <SidebarContent>
            <SidebarContentComponent
              selectedPlot={selectedPlot}
              setSelectedPlot={setSelectedPlot}
            />
          </SidebarContent>
        </Sidebar>
      </LayoutGroup>

      <MarkersLayerContent
        selectedPlot={selectedPlot}
        setSelectedPlot={setSelectedPlot}
      />
      <main className="relative">
        {selectedPlot && <SidebarTrigger />}
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
