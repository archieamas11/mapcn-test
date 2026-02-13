import type MapLibreGL from 'maplibre-gl'

export const styles = {
  default: {
    version: 8,
    name: 'ArcGIS Satellite',
    sources: {
      'arcgis-tiles': {
        type: 'raster' as const,
        tiles: [
          // 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          'https://wayback.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/WMTS/1.0.0/default028mm/MapServer/tile/58924/{z}/{y}/{x}',
        ],
        tileSize: 512,
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
