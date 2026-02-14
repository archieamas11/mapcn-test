/* eslint-disable no-alert */
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { ExternalLink, Info, MapPin, Navigation, Pencil, PrinterIcon, SearchIcon, X } from 'lucide-react'
import maplibregl from 'maplibre-gl'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
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
import { useNichesByPlotId, usePlotsGeoJson, useUnitCodeSearch } from '@/hooks/use-plots'
import { useSidebarStore } from '@/stores/sidebar-store'
import { PLOT_CATEGORY } from '@/types/plot.types'
import EditPlotDialog from './dialogs/EditPlotDialog'
import { LawnDetails } from './LawnDetails'
import { NicheDetails } from './NicheDetails'

type SelectedPlot = import('@/types/plot.types').SelectedPlot
type UnitSearchResult = import('@/types/plot.types').UnitSearchResult

// ─── Map Layer Content ───────────────────────────────────────────────────────

interface MarkersLayerContentProps {
  selectedPlot: SelectedPlot | null
  onSelectPlot: (plot: SelectedPlot) => void
  branchId: number | null
}

function mapFeatureToSelectedPlot(
  props: Record<string, string | number | null>,
  coordinates: [number, number],
): SelectedPlot {
  return {
    plot_id: Number(props.plot_id),
    category: props.category as SelectedPlot['category'],
    cluster: props.cluster != null ? String(props.cluster) : null,
    bay: props.bay != null ? Number(props.bay) : null,
    coordinates,
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
  }
}

function mapSearchResultToSelectedPlot(result: UnitSearchResult): SelectedPlot | null {
  if (result.lng == null || result.lat == null) {
    return null
  }

  return {
    plot_id: Number(result.plot_id),
    category: result.category,
    cluster: result.cluster,
    bay: result.bay != null ? Number(result.bay) : null,
    coordinates: [Number(result.lng), Number(result.lat)],
    image_url: result.image_url ?? '',
    niche_row: result.niche_row != null ? Number(result.niche_row) : null,
    niche_column: result.niche_column != null ? Number(result.niche_column) : null,
    lawn_status: result.lawn_status,
    lawn_type: result.lawn_type,
    width: result.width != null ? Number(result.width) : null,
    length: result.length != null ? Number(result.length) : null,
    area: result.area != null ? Number(result.area) : null,
    unit_code: result.unit_code,
    block: result.block,
  }
}

function isNicheCategory(category: SelectedPlot['category']): boolean {
  return category === PLOT_CATEGORY.CHAMBERS || category === PLOT_CATEGORY.COLUMBARIUM
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

const NORMALIZED_CLUSTER_LABELS: Record<string, string> = {
  A: 'Cluster A',
  B: 'Cluster B',
  C: 'Cluster C',
  D: 'Cluster D',
  E: 'Cluster E',
  F: 'Cluster F',
  SM: 'St. Michael',
  SG: 'St. Gabriel',
}

function MarkersLayerContent({ selectedPlot, onSelectPlot, branchId }: MarkersLayerContentProps) {
  const { map, isLoaded } = useMap()
  const id = useId()
  const sourceId = `markers-source-${id}`
  const layerId = `markers-layer-${id}`
  const mapPinMarkerRef = useRef<maplibregl.Marker | null>(null)

  const { data: geoJson } = usePlotsGeoJson(branchId)

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

      onSelectPlot(mapFeatureToSelectedPlot(props, coords))
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
  }, [map, isLoaded, geoJson, sourceId, layerId, onSelectPlot])

  // Selected marker pin overlay function
  useEffect(() => {
    if (!map || !isLoaded)
      return

    if (selectedPlot) {
      map.flyTo({
        center: selectedPlot.coordinates,
        zoom: Math.max(map.getZoom(), 18),
        duration: 1000,
        essential: true,
      })
    }

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

interface FloatingSearchBarProps {
  onSelectSearchResult: (result: UnitSearchResult) => void
}

function FloatingSearchBar({ onSelectSearchResult }: FloatingSearchBarProps) {
  const { open, openMobile, isMobile } = useSidebarStore(
    useShallow(s => ({
      open: s.open,
      openMobile: s.openMobile,
      isMobile: s.isMobile,
    })),
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const isOpen = isMobile ? openMobile : open
  const { data: searchResults = [], isFetching: isSearching } = useUnitCodeSearch(debouncedSearchTerm)
  const hasSearchTerm = debouncedSearchTerm.trim().length > 0
  const hasResults = searchResults.length > 0

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setDebouncedSearchTerm('')
    }
  }, [isOpen])

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
          onSubmit={e => e.preventDefault()}
        >
          <div className="relative flex-1">
            <Input
              className="peer dark:bg-background h-12 w-full rounded-full bg-white ps-12 pe-10 text-xs md:h-14 md:text-sm"
              placeholder="Search..."
              aria-label="Search lot"
              autoComplete="off"
              name="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-5">
              <SearchIcon size={20} />
            </div>

            {hasSearchTerm && (
              <div className="absolute top-full mt-2 w-full rounded-2xl border bg-background shadow-lg overflow-hidden">
                {isSearching
                  ? (
                      <p className="px-4 py-3 text-xs text-muted-foreground">Searching unit code...</p>
                    )
                  : hasResults
                    ? (
                        <ul className="max-h-72 overflow-y-auto">
                          {searchResults.map(result => (
                            <li key={`${result.source_type}-${result.plot_id}-${result.unit_code ?? 'unknown'}-${result.niche_number ?? '0'}`}>
                              <button
                                type="button"
                                className="w-full px-4 py-3 text-left hover:bg-muted/60 transition-colors cursor-pointer"
                                onClick={() => onSelectSearchResult(result)}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-sm">{result.unit_code ?? 'No Unit Code'}</span>
                                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    {CATEGORY_LABEL[result.category] ?? result.category}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {result.category === PLOT_CATEGORY.LAWN
                                    ? `Block ${result.block ?? 'N/A'}`
                                    : `Niche #${result.niche_number ?? 'N/A'}`}
                                </p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )
                    : (
                        <p className="px-4 py-3 text-xs text-muted-foreground">
                          No matching unit code found.
                        </p>
                      )}
              </div>
            )}
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  )
}

// ─── Sidebar Content ─────────────────────────────────────────────────────────

interface SidebarContentComponentProps {
  selectedPlot: SelectedPlot | null
  setSelectedPlot: (plot: SelectedPlot | null) => void
  highlightedUnitCode: string | null
  onSelectSearchResult: (result: UnitSearchResult) => void
}

function SidebarContentComponent({
  selectedPlot,
  setSelectedPlot,
  highlightedUnitCode,
  onSelectSearchResult,
}: SidebarContentComponentProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  // Fetch niches for chambers/columbarium plots
  const isNicheCategory
    = selectedPlot?.category === PLOT_CATEGORY.CHAMBERS
      || selectedPlot?.category === PLOT_CATEGORY.COLUMBARIUM

  const { data: nicheData, isLoading: isNichesLoading } = useNichesByPlotId(
    isNicheCategory ? selectedPlot?.plot_id : null,
  )

  const niches = nicheData?.niches ?? []
  const fallbackNiche = niches[0] ?? null
  const displayCluster = selectedPlot?.cluster ?? fallbackNiche?.cluster ?? null
  const normalizedClusterLabel = NORMALIZED_CLUSTER_LABELS[displayCluster ?? ''] ?? displayCluster
  const displayBay = selectedPlot?.bay ?? fallbackNiche?.bay ?? null

  const { setOpen, setOpenMobile, isMobile } = useSidebarStore(
    useShallow(s => ({
      setOpen: s.setOpen,
      setOpenMobile: s.setOpenMobile,
      isMobile: s.isMobile,
    })),
  )
  const { data: searchResults = [], isFetching: isSearching } = useUnitCodeSearch(debouncedSearchTerm)
  const hasSearchTerm = debouncedSearchTerm.trim().length > 0
  const hasResults = searchResults.length > 0

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [searchTerm])

  const handleClear = () => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
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

  return (
    <div className="flex flex-col h-full">
      {/* Plot information searchbar */}
      <div className="sticky top-0 z-10 px-2 py-4 bg-transparent">
        <motion.form
          layoutId="search-bar"
          className="flex w-full gap-1"
          role="search"
          aria-label="Admin lot search"
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          onSubmit={e => e.preventDefault()}
        >
          <div className="relative flex-1">
            <Input
              className="peer dark:bg-background h-9 w-full rounded-full bg-muted ps-12 pe-10 text-xs md:h-12 md:text-sm"
              placeholder="Search..."
              aria-label="Search lot"
              autoComplete="off"
              name="search"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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

            {hasSearchTerm && (
              <div className="absolute top-full mt-2 w-full rounded-2xl border bg-background shadow-lg overflow-hidden z-20">
                {isSearching
                  ? (
                      <p className="px-4 py-3 text-xs text-muted-foreground">Searching unit code...</p>
                    )
                  : hasResults
                    ? (
                        <ul className="max-h-72 overflow-y-auto">
                          {searchResults.map(result => (
                            <li key={`${result.source_type}-${result.plot_id}-${result.unit_code ?? 'unknown'}-${result.niche_number ?? '0'}`}>
                              <button
                                type="button"
                                className="w-full px-4 py-3 text-left hover:bg-muted/60 transition-colors cursor-pointer"
                                onClick={() => {
                                  onSelectSearchResult(result)
                                  setSearchTerm('')
                                  setDebouncedSearchTerm('')
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-medium text-sm">{result.unit_code ?? 'No Unit Code'}</span>
                                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                    {CATEGORY_LABEL[result.category] ?? result.category}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {result.category === PLOT_CATEGORY.LAWN
                                    ? `Block ${result.block ?? 'N/A'}`
                                    : `Niche #${result.niche_number ?? 'N/A'}`}
                                </p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )
                    : (
                        <p className="px-4 py-3 text-xs text-muted-foreground">
                          No matching unit code found.
                        </p>
                      )}
              </div>
            )}
          </div>
        </motion.form>
      </div>

      <div className="flex flex-col h-full w-full overflow-y-auto scrollbar-thin px-2 space-y-2">
        {/* Image and plot information Display */}
        <div className="w-full bg-secondary rounded-3xl">
          <div className="relative">
            <img
              src={selectedPlot?.image_url}
              className="object-cover w-full h-50 rounded-t-3xl"
              alt="plot"
            />
          </div>

          <div className="space-y-2 p-4">
            <span className="text-lg font-medium text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABEL[selectedPlot.category] ?? ''}
            </span>
            <p className="font-semibold text-sm text-foreground leading-tight mb-8">
              {CATEGORY_DESCRIPTION[selectedPlot.category] ?? ''}
            </p>
            {selectedPlot.category !== 'lawn_lot' && (
              <span className="flex items-center text-sm gap-1">
                <Info size={16} />
                <span className="flex gap-1">
                  {isNicheCategory && isNichesLoading
                    ? <Skeleton className="h-4 w-28 rounded-sm" />
                    : (normalizedClusterLabel ? `${normalizedClusterLabel}${displayBay != null ? ` - Bay ${displayBay}` : ''}` : '')}
                </span>
              </span>
            )}
            {selectedPlot.unit_code && (
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Selected Unit:
                {' '}
                {selectedPlot.unit_code}
              </span>
            )}

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

        {/* Stats & Details (moved to dedicated components) */}
        {isNicheCategory
          ? (
              <NicheDetails
                selectedPlot={selectedPlot}
                nicheData={nicheData}
                isNichesLoading={isNichesLoading}
                highlightedUnitCode={highlightedUnitCode}
              />
            )
          : selectedPlot.category === PLOT_CATEGORY.LAWN
            ? (
                <LawnDetails selectedPlot={selectedPlot} />
              )
            : null}

        {/* Niche/Lawn details moved to dedicated components above. */}

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

interface MarkersLayerProps {
  branchId: number | null
}

export function MarkersLayer({ branchId }: MarkersLayerProps) {
  const [selectedPlot, setSelectedPlot] = useState<SelectedPlot | null>(null)
  const [highlightedUnitCode, setHighlightedUnitCode] = useState<string | null>(null)
  const { isLoading: isPlotsLoading, isFetching: isPlotsFetching } = usePlotsGeoJson(branchId)
  const previousBranchIdRef = useRef<number | null>(branchId)
  const { setOpen, setOpenMobile, isMobile } = useSidebarStore(
    useShallow(s => ({
      setOpen: s.setOpen,
      setOpenMobile: s.setOpenMobile,
      isMobile: s.isMobile,
    })),
  )

  const handleSelectPlot = useCallback((plot: SelectedPlot, options?: { highlightedUnitCode?: string | null }) => {
    setSelectedPlot(plot)
    setHighlightedUnitCode(options?.highlightedUnitCode ?? null)

    if (isMobile) {
      setOpenMobile(true)
    }
    else {
      setOpen(true)
    }
  }, [isMobile, setOpen, setOpenMobile])

  const handleSelectSearchResult = useCallback((result: UnitSearchResult) => {
    const selectedFromSearch = mapSearchResultToSelectedPlot(result)
    if (!selectedFromSearch) {
      return
    }

    const shouldHighlightNiche
      = isNicheCategory(selectedFromSearch.category)
        && (result.unit_code?.trim().length ?? 0) > 0

    handleSelectPlot(selectedFromSearch, {
      highlightedUnitCode: shouldHighlightNiche ? result.unit_code : null,
    })
  }, [handleSelectPlot])

  useEffect(() => {
    if (previousBranchIdRef.current === branchId)
      return

    previousBranchIdRef.current = branchId
    setSelectedPlot(null)
    setHighlightedUnitCode(null)
    setOpen(false)
    setOpenMobile(false)
  }, [branchId, setOpen, setOpenMobile])

  useEffect(() => {
    if (!selectedPlot) {
      setHighlightedUnitCode(null)
    }
  }, [selectedPlot])

  const shouldShowPlotsSkeleton = branchId != null && (isPlotsLoading || isPlotsFetching)

  return (
    <SidebarProvider defaultOpen={false}>
      <LayoutGroup>
        <FloatingSearchBar onSelectSearchResult={handleSelectSearchResult} />
        <Sidebar>
          <SidebarContent>
            <SidebarContentComponent
              selectedPlot={selectedPlot}
              setSelectedPlot={setSelectedPlot}
              highlightedUnitCode={highlightedUnitCode}
              onSelectSearchResult={handleSelectSearchResult}
            />
          </SidebarContent>
        </Sidebar>
      </LayoutGroup>

      <MarkersLayerContent
        selectedPlot={selectedPlot}
        onSelectPlot={plot => handleSelectPlot(plot)}
        branchId={branchId}
      />
      <main className="relative">
        {shouldShowPlotsSkeleton && (
          <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex gap-2">
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </div>
        )}
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
