import { create } from 'zustand'

interface MapState {
  baiduInstance: any
  addBaiduMap: (baiduInstance: any) => void
}

export const useMapStore = create<MapState>()((set) => ({
  baiduInstance: null,
  addBaiduMap: (baiduInstance) => set(() => ({ baiduInstance })),
}))