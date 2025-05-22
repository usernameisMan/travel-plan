"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ToolsMenu from "./toolsMenu";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/app/store/mapStore";

interface Props {
  className?: string;
  onAddOneMarker: (fileName: string, lng: string, lat: string) => void;
  openCreateMarkerDialog: any;
  createMarkerDialogIsOpen: boolean;
}

const MapboxMap: React.FC<Props> = React.memo(({ className, ...props }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const currentSelectMarkerType = useRef("");
  const addMapboxMap = useMapStore((state) => state.addMapboxMap);
  const mapInstance = useMapStore((state) => state.mapboxInstance);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process?.env?.NEXT_PUBLIC_MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [116.404, 39.915],
      zoom: 15
    });

    map.current.on('load', () => {
      if (map.current) {
        addMapboxMap(map.current);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstance) {
      mapInstance.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        if (currentSelectMarkerType.current) {
          props.onAddOneMarker(currentSelectMarkerType.current, lng.toString(), lat.toString());
          props.openCreateMarkerDialog();
        }
      });
    }
  }, [mapInstance]);

  useEffect(() => {
    if (!props.createMarkerDialogIsOpen && mapInstance) {
      mapInstance.getCanvas().style.cursor = 'grab';
      currentSelectMarkerType.current = "";
    }
  }, [props.createMarkerDialogIsOpen, mapInstance]);

  const selectMenu = (fileName: string) => {
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = `url('/markers/resized/${fileName}.png') 25 51, auto`;
      currentSelectMarkerType.current = fileName;
    }
  };

  return (
    <div className={cn("relative", className)}>
      <ToolsMenu
        className={cn("z-10 absolute top-3 right-5")}
        onClickMenu={selectMenu}
      />
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
});

MapboxMap.displayName = "MapboxMap";

export default MapboxMap; 