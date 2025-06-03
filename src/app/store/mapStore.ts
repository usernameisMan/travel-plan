import { create } from 'zustand'
import mapboxgl from 'mapbox-gl'

interface MapState {
  mapboxInstance: mapboxgl.Map | null
  addMapboxMap: (mapboxInstance: mapboxgl.Map | null) => void
}

export const useMapStore = create<MapState>()((set) => ({
  mapboxInstance: null,
  addMapboxMap: (mapboxInstance) => set(() => ({ mapboxInstance })),
}))