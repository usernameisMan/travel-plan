"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ToolsMenu from "./toolsMenu";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/app/store/mapStore";
// import { MapboxSearchBox } from '@mapbox/search-js-web';

interface Props {
  className?: string;
  onAddOneMarker: (fileName: string, lng: string, lat: string) => void;
  onLoadMap: () => void;
  openCreateMarkerDialog: any;
  createMarkerDialogIsOpen: boolean;
}

const MapboxMap: React.FC<Props> = React.memo(({ className, ...props }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const currentSelectMarkerType = useRef("");
  const addMapboxMap = useMapStore((state) => state.addMapboxMap);
  const mapInstance = useMapStore((state) => state.mapboxInstance);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lngLat: mapboxgl.LngLat | null }>({
    x: 0,
    y: 0,
    lngLat: null
  });

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process?.env?.NEXT_PUBLIC_MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      zoom: 11,
    });

    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      fitBoundsOptions: {
        zoom: 10,
      },
      trackUserLocation: true,
      showUserHeading: true,
    });

    map.current.addControl(geolocateControl, "bottom-right");
    map.current.addControl(new mapboxgl.ScaleControl());

    map.current.on("load", () => {
      if (map.current) {
        // const searchBox = new MapboxSearchBox();
        // searchBox.accessToken = process?.env?.NEXT_PUBLIC_MAPBOX_TOKEN || '';
        // searchBox.options = {
        //     types: 'address,poi',
        //     proximity: [-73.99209, 40.68933]
        // };
        // searchBox.marker = true;
        // searchBox.mapboxgl = mapboxgl;
        // map.current.addControl(searchBox as unknown as mapboxgl.IControl, "top-left");

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { longitude, latitude } = position.coords;
            map.current?.setCenter([longitude, latitude]);
          },
          (error) => {
            console.error("Error getting location:", error);
          }
        );
        addMapboxMap(map.current);
      }
    });

    // Add context menu event listener
    map.current.on("contextmenu", (e) => {
      e.preventDefault();
      if (mapContainer.current) {
        const rect = mapContainer.current.getBoundingClientRect();
        setContextMenu({
          x: rect.left + e.point.x,
          y: rect.top + e.point.y,
          lngLat: e.lngLat
        });
      }
    });

    // Close context menu on map click
    map.current.on("click", () => {
      setContextMenu({ x: 0, y: 0, lngLat: null });
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
      addMapboxMap(null);
    };
  }, []);

  useEffect(() => {
    if (mapInstance) {
      props.onLoadMap();
      mapInstance.on("click", (e) => {
        const { lng, lat } = e.lngLat;
        if (currentSelectMarkerType.current) {
          props.onAddOneMarker(
            currentSelectMarkerType.current,
            lng.toString(),
            lat.toString()
          );
          props.openCreateMarkerDialog();
        }
      });
    }
  }, [mapInstance]);

  useEffect(() => {
    if (!props.createMarkerDialogIsOpen && mapInstance) {
      if (mapInstance.getCanvas()?.style) {
        mapInstance.getCanvas().style.cursor = "grab";
      }
      currentSelectMarkerType.current = "";
    }
  }, [props.createMarkerDialogIsOpen, mapInstance]);

  const selectMenu = (fileName: string) => {
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = `url('/markers/resized/${fileName}.png') 25 51, auto`;
      currentSelectMarkerType.current = fileName;
    }
  };

  const handleContextMenuClick = (fileName: string) => {
    if (contextMenu.lngLat) {
      props.onAddOneMarker(
        fileName,
        contextMenu.lngLat.lng.toString(),
        contextMenu.lngLat.lat.toString()
      );
      props.openCreateMarkerDialog();
    }
    setContextMenu({ x: 0, y: 0, lngLat: null });
  };

  return (
    <div className={cn("relative", className)}>
      {/* <ToolsMenu
        className={cn("z-10 absolute top-3 right-5")}
        onClickMenu={selectMenu}
      /> */}
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      {contextMenu.lngLat && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200"
          style={{
            left: contextMenu.x + 5,
            top: contextMenu.y + 5,
            transform: 'translate(0, 0)'
          }}
        >
          <ToolsMenu
            className="w-[150px]"
            onClickMenu={handleContextMenuClick}
          />
        </div>
      )}
    </div>
  );
});

MapboxMap.displayName = "MapboxMap";

export default MapboxMap;
