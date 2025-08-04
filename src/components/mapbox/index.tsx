"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ToolsMenu from "./toolsMenu";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/app/store/mapStore";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lngLat: mapboxgl.LngLat | null }>({
    x: 0,
    y: 0,
    lngLat: null
  });
  
  const [showFloatingMenu, setShowFloatingMenu] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);

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
      setShowFloatingMenu(false);
    });

    // Add touch event listeners for long press detection
    const canvas = map.current.getCanvas();
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        setTouchStartPos({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
        
        const timer = setTimeout(() => {
          // Long press detected
          const point = [touch.clientX - rect.left, touch.clientY - rect.top] as [number, number];
          const lngLat = map.current?.unproject(point);
          if (lngLat) {
            setContextMenu({
              x: rect.left + point[0],
              y: rect.top + point[1],
              lngLat: lngLat
            });
          }
        }, 500); // 500ms for long press
        
        setLongPressTimer(timer);
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      setTouchStartPos(null);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartPos && e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const currentPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        
        // If user moves finger too much, cancel long press
        const distance = Math.sqrt(
          Math.pow(currentPos.x - touchStartPos.x, 2) + 
          Math.pow(currentPos.y - touchStartPos.y, 2)
        );
        
        if (distance > 10 && longPressTimer) { // 10px threshold
          clearTimeout(longPressTimer);
          setLongPressTimer(null);
        }
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      
      // Remove touch event listeners
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchmove', handleTouchMove);
      
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
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      
      {/* Floating Add Marker Button */}
      <Button
        className="absolute bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-[#35b368] hover:bg-[#2d9a5a] shadow-lg"
        onClick={() => setShowFloatingMenu(!showFloatingMenu)}
        title={t.addMarker}
      >
        <Plus className="h-6 w-6" />
      </Button>
      
      {/* Instruction text for mobile users */}
      <div className="absolute bottom-4 left-4 z-30 bg-black/60 text-white text-xs px-2 py-1 rounded">
        {t.longPressToAddMarker}
      </div>
      
      {/* Floating Tools Menu */}
      {showFloatingMenu && (
        <div className="absolute bottom-36 right-4 z-50">
          <ToolsMenu
            className="w-[180px]"
            onClickMenu={(fileName) => {
              setShowFloatingMenu(false);
              selectMenu(fileName);
            }}
          />
        </div>
      )}
      
      {/* Context Menu (Right-click or Long-press) */}
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
