import type MapLibreGL from 'maplibre-gl'

interface MapStyle {
  id: string
  name: string
  image: string
  styleUrl: string | MapLibreGL.StyleSpecification
  description: string
}

export const mapStyles: MapStyle[] = [
  {
    id: 'arcgis-satellite',
    name: 'Satellite',
    image:
      'https://raw.githubusercontent.com/muimsd/map-gl-style-switcher/refs/heads/main/public/arcgis-hybrid.png',
    styleUrl: {
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
    description: 'ArcGIS Satellite style',
  },
  {
    id: 'osm-3d',
    name: 'Openstreetmap 3D',
    image:
      'https://raw.githubusercontent.com/muimsd/map-gl-style-switcher/refs/heads/main/public/arcgis-hybrid.png',
    styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
    description: 'Openstreetmap 3D style',
  },
  {
    id: 'osm',
    name: 'Openstreetmap',
    image:
      'https://raw.githubusercontent.com/muimsd/map-gl-style-switcher/refs/heads/main/public/osm.png',
    styleUrl: 'https://tiles.openfreemap.org/styles/bright',
    description: 'OSM style',
  },
]
