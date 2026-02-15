import type { PlotStatusType, SelectedPlot, UnitSearchResult } from '@/types/plot.types'
import maplibregl from 'maplibre-gl'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { useShallow } from 'zustand/react/shallow'
import { MapControls, useMap } from '@/components/ui/map'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { usePlotsGeoJson } from '@/hooks/use-plots'
import { useSidebarStore } from '@/stores/sidebar-store'
import { getPlotStatusColor, PLOT_CATEGORY, PLOT_STATUS } from '@/types/plot.types'
import { MapViewSidebar } from './map-view-layers/MapViewSidebar'
import { isNicheCategory } from './map-view-layers/plot-category.utils'

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
            getPlotStatusColor(PLOT_STATUS.AVAILABLE as PlotStatusType),
            'sold',
            getPlotStatusColor(PLOT_STATUS.SOLD as PlotStatusType),
            'reserved',
            getPlotStatusColor(PLOT_STATUS.RESERVED as PlotStatusType),
            'hold',
            getPlotStatusColor(PLOT_STATUS.HOLD as PlotStatusType),
            'not_available',
            getPlotStatusColor(PLOT_STATUS.NOT_AVAILABLE as PlotStatusType),
            '#000000',
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

    /* Add Map Pin to the map when i click any marker */
    if (selectedPlot) {
      map.setFilter(layerId, ['!=', ['get', 'plot_id'], selectedPlot.plot_id])

      const el = document.createElement('div')
      el.innerHTML = renderToString(
        <div className="relative flex items-center justify-center mb-2">
          {/* Pin body */}
          <div className="w-7 h-7 bg-red-600 rounded-full shadow-xl border-2 flex items-center justify-center">
            {/* Inner dot */}
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
          </div>

          {/* Pointer tail */}
          <div className="absolute top-5 w-0 h-0
          border-l-8 border-l-transparent
          border-r-6 border-r-transparent
          border-t-15 border-t-red-600
          drop-shadow-xl"
          />
        </div>,
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

// ─── Main Export ──────────────────────────────────────────────────────────────

interface MarkersLayerProps {
  branchId: number | null
}

export function MarkersLayer({ branchId }: MarkersLayerProps) {
  const [selectedPlot, setSelectedPlot] = useState<SelectedPlot | null>(null)
  const [highlightedUnitCode, setHighlightedUnitCode] = useState<string | null>(null)
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

  return (
    <SidebarProvider defaultOpen={false}>
      <MarkersLayerContent
        selectedPlot={selectedPlot}
        onSelectPlot={plot => handleSelectPlot(plot)}
        branchId={branchId}
      />

      <MapViewSidebar
        selectedPlot={selectedPlot}
        setSelectedPlot={setSelectedPlot}
        highlightedUnitCode={highlightedUnitCode}
        onSelectSearchResult={handleSelectSearchResult}
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
