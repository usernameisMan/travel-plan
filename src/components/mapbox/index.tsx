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
  readOnly?: boolean; // 只读模式，禁用添加 markers 功能
}

const MapboxMap: React.FC<Props> = React.memo(({ className, readOnly = false, ...props }) => {
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
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [markerTypeSelected, setMarkerTypeSelected] = useState(false);
  const isMobileRef = useRef(false);
  const propsRef = useRef(props);
  const touchHandlersRef = useRef<{
    handleTouchStart: ((e: TouchEvent) => void) | null;
    handleTouchEnd: (() => void) | null;
    handleTouchMove: ((e: TouchEvent) => void) | null;
  }>({ handleTouchStart: null, handleTouchEnd: null, handleTouchMove: null });

  // Keep propsRef and isMobileRef in sync so closures always read latest values
  useEffect(() => { propsRef.current = props; });
  useEffect(() => { isMobileRef.current = isMobile; }, [isMobile]);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const val = window.innerWidth < 640 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(val);
      isMobileRef.current = val;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

    map.current.addControl(geolocateControl, "top-left");
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

    // Add context menu event listener (disabled in read-only mode)
    if (!readOnly) {
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
    }

    // Close context menu on map click (only in non-read-only mode)
    if (!readOnly) {
      map.current.on("click", () => {
        setContextMenu({ x: 0, y: 0, lngLat: null });
        setShowFloatingMenu(false);
      });
    }

    // Add touch event listeners for long press detection (disabled in read-only mode)
    const canvas = map.current.getCanvas();
    
    if (!readOnly) {
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
              if (currentSelectMarkerType.current) {
                // Type already selected — place directly
                propsRef.current.onAddOneMarker(
                  currentSelectMarkerType.current,
                  lngLat.lng.toString(),
                  lngLat.lat.toString()
                );
                propsRef.current.openCreateMarkerDialog();
                if (navigator.vibrate) navigator.vibrate(50);
              } else {
                // No type selected — show context menu
                setContextMenu({
                  x: rect.left + point[0],
                  y: rect.top + point[1],
                  lngLat: lngLat,
                });
              }
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

      // Store handlers in ref for cleanup
      touchHandlersRef.current = {
        handleTouchStart,
        handleTouchEnd,
        handleTouchMove
      };

      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      
      // Remove touch event listeners (only if they were added)
      if (!readOnly && touchHandlersRef.current.handleTouchStart) {
        canvas.removeEventListener('touchstart', touchHandlersRef.current.handleTouchStart);
        canvas.removeEventListener('touchend', touchHandlersRef.current.handleTouchEnd!);
        canvas.removeEventListener('touchmove', touchHandlersRef.current.handleTouchMove!);
      }
      
      if (map.current) {
        map.current.remove();
      }
      addMapboxMap(null);
    };
  }, [readOnly]);

  // Reset states when switching to read-only mode
  useEffect(() => {
    if (readOnly) {
      setShowFloatingMenu(false);
      setContextMenu({ x: 0, y: 0, lngLat: null });
      currentSelectMarkerType.current = "";
      if (mapInstance?.getCanvas()?.style) {
        mapInstance.getCanvas().style.cursor = "grab";
      }
    }
  }, [readOnly, mapInstance]);

  useEffect(() => {
    if (mapInstance) {
      props.onLoadMap();
      // Only enable click-to-add-marker in non-read-only mode
      if (!readOnly) {
        mapInstance.on("click", (e) => {
          // On mobile, marker placement is handled by long press — skip single tap
          if (isMobileRef.current) return;
          const { lng, lat } = e.lngLat;
          if (currentSelectMarkerType.current) {
            propsRef.current.onAddOneMarker(
              currentSelectMarkerType.current,
              lng.toString(),
              lat.toString()
            );
            propsRef.current.openCreateMarkerDialog();
          }
        });
      }
    }
  }, [mapInstance, readOnly]);

  useEffect(() => {
    if (!props.createMarkerDialogIsOpen && mapInstance) {
      if (mapInstance.getCanvas()?.style) {
        mapInstance.getCanvas().style.cursor = "grab";
      }
      currentSelectMarkerType.current = "";
      setMarkerTypeSelected(false);
    }
  }, [props.createMarkerDialogIsOpen, mapInstance]);

  const selectMenu = (fileName: string) => {
    if (readOnly) return; // Disable in read-only mode
    if (mapInstance) {
      mapInstance.getCanvas().style.cursor = `url('/markers/resized/${fileName}.png') 25 51, auto`;
      currentSelectMarkerType.current = fileName;
      setMarkerTypeSelected(true);
    }
  };

  const handleContextMenuClick = (fileName: string) => {
    if (readOnly) return; // Disable in read-only mode
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
      
      {/* Floating Add Marker Button - Only show in non-read-only mode */}
      {!readOnly && (
        <>
          <Button
            className={cn(
              "absolute bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transition-all duration-300",
              isLongPressing && "scale-110 ring-4 ring-purple-300 ring-opacity-50"
            )}
            onTouchStart={(e) => {
              if (isMobile) {
                e.preventDefault();
                setIsLongPressing(true);
                const timer = setTimeout(() => {
                  setShowFloatingMenu(true);
                  setIsLongPressing(false);
                  // Haptic feedback if available
                  if (navigator.vibrate) {
                    navigator.vibrate(50);
                  }
                }, 500);
                setLongPressTimer(timer);
              }
            }}
            onTouchEnd={(e) => {
              if (isMobile && longPressTimer) {
                e.preventDefault();
                clearTimeout(longPressTimer);
                setLongPressTimer(null);
                setIsLongPressing(false);
              }
            }}
            onTouchMove={(e) => {
              if (isMobile && longPressTimer) {
                e.preventDefault();
                clearTimeout(longPressTimer);
                setLongPressTimer(null);
                setIsLongPressing(false);
              }
            }}
            onClick={() => {
              if (!isMobile) {
                setShowFloatingMenu(!showFloatingMenu);
              }
            }}
            title={isMobile ? t.longPressToAddMarker : t.addMarker}
          >
            <Plus className={cn("h-6 w-6 transition-transform duration-300", isLongPressing && "rotate-90")} />
          </Button>
          
          {/* Instruction text for mobile users */}
          {isMobile && !showFloatingMenu && (
            <div
              className={cn(
                "absolute bottom-4 left-4 z-30 text-white text-xs px-3 py-2 rounded-lg shadow-lg border transition-all duration-300",
                markerTypeSelected
                  ? "bg-purple-600/90 border-purple-400/50 backdrop-blur-sm animate-pulse"
                  : "bg-black/70 border-white/20 backdrop-blur-sm"
              )}
            >
              {markerTypeSelected ? "长按地图放置标记 📍" : t.longPressToAddMarker}
            </div>
          )}
          
          {/* Floating Tools Menu */}
          {showFloatingMenu && (
            <>
              {/* Backdrop for mobile */}
              {isMobile && (
                <div 
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                  onClick={() => setShowFloatingMenu(false)}
                />
              )}
              <div className={cn(
                "absolute z-50",
                isMobile ? "bottom-32 right-4 left-4" : "bottom-36 right-4"
              )}>
                <ToolsMenu
                  className={isMobile ? "w-full" : "w-[180px]"}
                  onClickMenu={(fileName) => {
                    setShowFloatingMenu(false);
                    selectMenu(fileName);
                  }}
                  onClose={() => setShowFloatingMenu(false)}
                />
              </div>
            </>
          )}
        </>
      )}
      
      {/* Context Menu (Right-click or Long-press) - Only show in non-read-only mode */}
      {!readOnly && contextMenu.lngLat && (
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
