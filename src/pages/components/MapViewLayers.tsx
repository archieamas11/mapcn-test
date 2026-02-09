import { useEffect, useId, useState } from 'react'
import { MapPopup, useMap } from '@/components/ui/map'
import { NicheGridDisplay } from './NicheDisplay'

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
  width?: number
  length?: number
  area?: number
  rows?: number
  columns?: number
}

export function MarkersLayer() {
  const { map, isLoaded } = useMap()
  const id = useId()
  const sourceId = `markers-source-${id}`
  const layerId = `markers-layer-${id}`
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(
    null,
  )

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
        'circle-color': '#3b82f6',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        // add more paint properties here to customize the appearance of the markers
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

      setSelectedPoint({
        id: feature.properties?.id,
        name: feature.properties?.name,
        category: feature.properties?.category,
        coordinates: coords,
        width: feature.properties?.width,
        length: feature.properties?.length,
        area: feature.properties?.area,
        rows: feature.properties?.rows,
        columns: feature.properties?.columns,
      })
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
  }, [map, isLoaded, sourceId, layerId])

  return (
    <>
      {selectedPoint && (
        <MapPopup
          longitude={selectedPoint.coordinates[0]}
          latitude={selectedPoint.coordinates[1]}
          onClose={() => setSelectedPoint(null)}
          closeOnClick={false}
          focusAfterOpen={false}
          offset={10}
        >
          <div className="min-w-[200px] max-w-[400px] bg-white border border-gray-200 rounded-lg p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg text-gray-900">
                {selectedPoint.name}
              </h3>
              <span className="text-xs text-gray-500 uppercase tracking-wide">
                {selectedPoint.category.replace('_', ' ')}
              </span>
            </div>

            {selectedPoint.category === 'lawn_lot' && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  This is a public lawn lot — good for events and gatherings.
                </p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <strong>Width:</strong>
                    {selectedPoint.width}
                    m
                  </div>
                  <div>
                    <strong>Length:</strong>
                    {selectedPoint.length}
                    m
                  </div>
                  <div>
                    <strong>Area:</strong>
                    {selectedPoint.area}
                    m²
                  </div>
                </div>
              </div>
            )}

            {(selectedPoint.category === 'columbarium'
              || selectedPoint.category === 'chambers') && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">
                  {selectedPoint.category === 'columbarium'
                    ? 'Columbarium — quiet memorial area.'
                    : 'Chambers — indoor facilities.'}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Grid Layout:</strong>
                  {selectedPoint.rows}
                  rows ×
                  {selectedPoint.columns}
                  columns
                </p>
                {selectedPoint.rows && selectedPoint.columns && (
                  <NicheGridDisplay
                    rows={selectedPoint.rows}
                    cols={selectedPoint.columns}
                  />
                )}
              </div>
            )}

            {!['lawn_lot', 'columbarium', 'chambers'].includes(
              selectedPoint.category,
            ) && (
              <p className="text-sm text-gray-500 italic">
                No additional info available.
              </p>
            )}
          </div>
        </MapPopup>
      )}
    </>
  )
}
