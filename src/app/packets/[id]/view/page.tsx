"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { http } from "@/lib/http";
import { useAuthStore } from "@/store/authStore";
import { useMapStore } from "@/app/store/mapStore";
import MapboxMap from "@/components/mapbox";
import { ArrowLeft, Map, Eye, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MapPin, Navigation, ExternalLink, Share2, Copy, Check } from "lucide-react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import { getAvailableMapApps, openInMapApp, type MapApp } from "@/lib/mapUtils";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DayTrack {
  day: string;
  dayText: string;
  description: string;
  markers: any[];
}

interface Packet {
  id: string;
  name: string;
  description?: string;
  itineraryDays?: DayTrack[];
  shareCode?: string;
  shareType?: string;
  shareViews?: number;
}

const PacketViewPage = () => {
  const { isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const params = useParams();
  const router = useRouter();
  const packetId = params.id as string;
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  
  const mapInstance = useMapStore((state) => state.mapboxInstance);
  const [packet, setPacket] = useState<Packet | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<DayTrack[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [showMapApps, setShowMapApps] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [availableMapApps, setAvailableMapApps] = useState<MapApp[]>([]);
  const [hasInitializedFocus, setHasInitializedFocus] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Share-related state
  const [showShareConfirmDialog, setShowShareConfirmDialog] = useState(false);
  const [showShareLinkDialog, setShowShareLinkDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [isSharing, setIsSharing] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedShareType, setSelectedShareType] = useState<'free' | 'paid'>('free');

  // Fetch packet data
  const fetchPacket = useCallback(async () => {
    if (!packetId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Ensure token exists
      let token = useAuthStore.getState().token;
      if (!token) {
        token = await getAccessTokenSilently();
        useAuthStore.getState().setToken(token);
      }

      const response = await http.get(`/api/packets/${packetId}`) as any;
      
      if (response && response.data) {
        const packetData = response.data;
        setPacket(packetData);
        
        // Process itinerary days
        if (packetData.itineraryDays && Array.isArray(packetData.itineraryDays)) {
          const processedTracks = packetData.itineraryDays.map((item: any) => ({
            ...item,
            day: item.day || `Day ${item.dayNumber || 1}`,
            dayText: item.name || item.dayText || `Day ${item.dayNumber || 1}`,
            markers: item.markers?.map((marker: any) => ({
              ...marker,
              location: {
                lng: marker?.lng || marker?.location?.lng || 0,
                lat: marker?.lat || marker?.location?.lat || 0,
              },
            })) || [],
          }));
          setTracks(processedTracks);
        }
      }
    } catch (error) {
      console.error("Error fetching packet:", error);
      setError("Failed to load travel plan");
    } finally {
      setLoading(false);
    }
  }, [packetId, getAccessTokenSilently]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchPacket();
    }
  }, [isAuthenticated, isLoading, fetchPacket]);

  // Initialize available map apps
  useEffect(() => {
    setAvailableMapApps(getAvailableMapApps());
  }, []);

  // Share functionality
  const handleShare = useCallback(() => {
    if (!packet) return;
    
    // If already sharing, show the link dialog directly
    if (packet.shareCode) {
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/shared/${packet.shareCode}`);
      setIsSharing(true);
      setShowShareLinkDialog(true);
      return;
    }

    // Show confirmation dialog for new sharing
    setShowShareConfirmDialog(true);
  }, [packet]);

  const handleConfirmShare = useCallback(async () => {
    if (!packet) return;
    
    try {
      setShareLoading(true);
      
      let token = useAuthStore.getState().token;
      if (!token) {
        token = await getAccessTokenSilently();
        useAuthStore.getState().setToken(token);
      }

      const response = await http.post(`/api/packets/${packetId}/share`, {
        shareType: selectedShareType
      }) as any;

      if (response && response.data) {
        const shareCode = response.data.shareCode;
        setShareUrl(`${window.location.origin}/shared/${shareCode}`);
        setIsSharing(true);
        
        // Update packet state
        setPacket(prev => prev ? {
          ...prev,
          shareCode: shareCode,
          shareType: selectedShareType,
          shareViews: 0
        } : null);
        
        // Close confirmation dialog and show link dialog
        setShowShareConfirmDialog(false);
        setShowShareLinkDialog(true);
      }
    } catch (error) {
      console.error('Error enabling sharing:', error);
      // TODO: Show error toast
    } finally {
      setShareLoading(false);
    }
  }, [packet, packetId, selectedShareType, getAccessTokenSilently]);

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [shareUrl]);

  const handleDisableShare = useCallback(async () => {
    if (!packet?.shareCode) return;
    
    try {
      setShareLoading(true);
      
      let token = useAuthStore.getState().token;
      if (!token) {
        token = await getAccessTokenSilently();
        useAuthStore.getState().setToken(token);
      }

      await http.delete(`/api/packets/${packetId}/share`);
      
      // Update packet state
      setPacket(prev => prev ? {
        ...prev,
        shareCode: undefined,
        shareType: 'private',
      } : null);
      
      setIsSharing(false);
      setShowShareLinkDialog(false);
      setShareUrl('');
    } catch (error) {
      console.error('Error disabling sharing:', error);
      // TODO: Show error toast
    } finally {
      setShareLoading(false);
    }
  }, [packet, packetId, getAccessTokenSilently]);

  // Add markers to map
  const addMarkerToMap = useCallback((
    type: string,
    lng: number,
    lat: number,
    label?: string
  ) => {
    if (!mapInstance) return;
    
    const el = document.createElement("div");
    el.className = "marker";
    el.style.position = "absolute";
    el.style.width = "50px";
    el.style.height = "50px";
    el.style.backgroundImage = `url('/markers/resized/${type}.png')`;
    el.style.backgroundSize = "cover";
    el.style.transform = "translate(-50%, -100%)";
    el.style.pointerEvents = "none";

    if (label) {
      const labelEl = document.createElement("div");
      labelEl.innerText = label;
      labelEl.style.position = "absolute";
      labelEl.style.left = "50%";
      labelEl.style.top = "100%";
      labelEl.style.transform = "translateX(-50%)";
      labelEl.style.marginTop = "2px";
      labelEl.style.background = "rgba(0,0,0,0.7)";
      labelEl.style.color = "#fff";
      labelEl.style.fontSize = "13px";
      labelEl.style.fontWeight = "400";
      labelEl.style.padding = "2px 4px";
      labelEl.style.borderRadius = "8px";
      labelEl.style.pointerEvents = "none";
      labelEl.style.width = "max-content";
      el.appendChild(labelEl);
    }

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
      offset: [0, 0],
    })
      .setLngLat([lng, lat])
      .addTo(mapInstance);

    return marker;
  }, [mapInstance]);

  // Clear all markers and routes
  const clearMapContent = useCallback(() => {
    if (!mapInstance) return;

    // Clear markers — remove the mapbox marker wrapper elements
    document.querySelectorAll(".mapboxgl-marker").forEach((el) => el.remove());

    // Clear routes
    const layers = mapInstance.getStyle()?.layers || [];
    layers.forEach((layer: any) => {
      if (
        layer.id.startsWith("route-segment-") ||
        layer.id.startsWith("route-arrows-")
      ) {
        if (mapInstance.getLayer(layer.id)) mapInstance.removeLayer(layer.id);
      }
    });

    const sources = mapInstance.getStyle()?.sources || {};
    Object.keys(sources).forEach((sourceId) => {
      if (sourceId.startsWith("route-segment-")) {
        if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
      }
    });
  }, [mapInstance]);

  // Focus on specific marker
  const focusOnMarker = useCallback((marker: any) => {
    if (!mapInstance || !marker.location) return;
    
    mapInstance.flyTo({
      center: [marker.location.lng, marker.location.lat],
      zoom: 16,
      duration: 1000,
    });
  }, [mapInstance]);

  // Open map app selection
  const openMapAppSelection = useCallback((marker: any) => {
    setSelectedMarker(marker);
    setShowMapApps(true);
  }, []);

  // Handle map app selection
  const handleMapAppSelect = useCallback((app: MapApp) => {
    if (!selectedMarker) return;
    
    const location = {
      lng: selectedMarker.location.lng,
      lat: selectedMarker.location.lat,
      title: selectedMarker.title || 'Travel Destination',
    };
    
    openInMapApp(app, location);
    setShowMapApps(false);
    setSelectedMarker(null);
  }, [selectedMarker]);

  // Display selected day's markers and routes
  const displayDay = useCallback(async (dayIndex: number, shouldFocus: boolean = true) => {
    if (!mapInstance || !tracks[dayIndex] || !tracks[dayIndex].markers) return;

    clearMapContent();

    const dayTrack = tracks[dayIndex];
    const dayMarkers = dayTrack.markers;

    // Add markers
    dayMarkers.forEach((marker: any, idx: number) => {
      if (marker && marker.type && marker.location) {
        addMarkerToMap(
          marker.type,
          marker.location.lng,
          marker.location.lat,
          `${idx + 1}. ${marker.title}`
        );
      }
    });

    // Generate routes if there are at least 2 markers
    if (dayMarkers.length >= 2) {
      const colors = ["#7C3AED","#0EA5E9","#10B981","#F59E0B","#EF4444","#EC4899","#6366F1","#14B8A6"];
      const color = colors[dayIndex % colors.length];

      for (let i = 0; i < dayMarkers.length - 1; i++) {
        const from = dayMarkers[i];
        const to = dayMarkers[i + 1];

        if (!from?.location || !to?.location) continue;

        const waypoints = `${from.location.lng},${from.location.lat};${to.location.lng},${to.location.lat}`;

        try {
          const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
          );
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            const geometry = data.routes[0].geometry;
            const segmentSourceId = `route-segment-${dayIndex}-${i}`;
            mapInstance.addSource(segmentSourceId, {
              type: "geojson",
              data: { type: "Feature", properties: {}, geometry },
            });
            // White casing
            mapInstance.addLayer({
              id: `route-segment-casing-${dayIndex}-${i}`,
              type: "line",
              source: segmentSourceId,
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": "#ffffff", "line-width": 7, "line-opacity": 0.5 },
            });
            // Colored line
            mapInstance.addLayer({
              id: segmentSourceId,
              type: "line",
              source: segmentSourceId,
              layout: { "line-join": "round", "line-cap": "round" },
              paint: { "line-color": color, "line-width": 4.5, "line-opacity": 0.9 },
            });
            // Direction arrows
            mapInstance.addLayer({
              id: `route-arrows-${dayIndex}-${i}`,
              type: "symbol",
              source: segmentSourceId,
              layout: {
                "symbol-placement": "line",
                "text-field": "▶",
                "text-size": 11,
                "text-allow-overlap": false,
                "text-ignore-placement": false,
                "text-keep-upright": false,
                "symbol-spacing": 120,
              },
              paint: {
                "text-color": "#ffffff",
                "text-halo-color": color,
                "text-halo-width": 1.5,
                "text-opacity": 0.85,
              },
            });
          }
        } catch (error) {
          console.error("Error generating route:", error);
        }
      }
    }

    // Fit map to markers (only if shouldFocus is true)
    if (shouldFocus && dayMarkers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      dayMarkers.forEach((marker: any) => {
        if (marker.location) {
          bounds.extend([marker.location.lng, marker.location.lat]);
        }
      });
      
      if (!bounds.isEmpty()) {
        mapInstance.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15,
          duration: 1000, // Add smooth animation
        });
      }
    }
  }, [mapInstance, tracks, clearMapContent, addMarkerToMap]);

  // Focus on all markers when page loads
  const focusOnAllMarkers = useCallback(() => {
    if (!mapInstance || tracks.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    let hasMarkers = false;

    tracks.forEach((track) => {
      if (track.markers && Array.isArray(track.markers)) {
        track.markers.forEach((marker: any) => {
          if (marker && marker.location && marker.location.lng && marker.location.lat) {
            bounds.extend([marker.location.lng, marker.location.lat]);
            hasMarkers = true;
          }
        });
      }
    });

    if (hasMarkers && !bounds.isEmpty()) {
      mapInstance.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 350 }, // Extra padding on right for panel
        maxZoom: 15,
        duration: 1500,
      });
    }
  }, [mapInstance, tracks]);

  // Handle day selection change
  const handleDayChange = (dayIndex: string) => {
    const index = parseInt(dayIndex);
    setSelectedDay(index);
    setIsExpanded(false); // Collapse when switching days
    displayDay(index, true); // Focus when user manually changes day
    
    // Scroll to selected day
    if (scrollContainerRef.current) {
      const button = scrollContainerRef.current.children[index] as HTMLElement;
      if (button) {
        button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  // Navigate to previous/next day
  const navigateDay = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedDay > 0) {
      handleDayChange((selectedDay - 1).toString());
    } else if (direction === 'next' && selectedDay < tracks.length - 1) {
      handleDayChange((selectedDay + 1).toString());
    }
  };

  // Initialize display when map and data are ready
  useEffect(() => {
    if (mapInstance && tracks.length > 0 && !loading) {
      // On first load, display markers but don't focus yet
      if (!hasInitializedFocus) {
        displayDay(selectedDay, false); // Don't focus on individual day
        // Focus on all markers when page first loads (only once)
        setTimeout(() => {
          focusOnAllMarkers();
          setHasInitializedFocus(true);
        }, 500);
      } else {
        // After initialization, normal behavior
        displayDay(selectedDay, true);
      }
    }
  }, [mapInstance, tracks, selectedDay, loading, displayDay, focusOnAllMarkers, hasInitializedFocus]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">
            {t.verifyingLogin}
          </div>
          <div className="relative inline-flex">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md mx-4 border border-purple-100">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{t.loginRequired}</h1>
          <p className="text-gray-600 mb-6">{t.loginToViewPlan}</p>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 border-0 shadow-lg">
              {t.goToLogin}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          </div>
          <p className="text-gray-600">{t.loadingPlan}</p>
        </div>
      </div>
    );
  }

  if (error || !packet) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md mx-4 border border-purple-100">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error || t.sharedPlanNotFound}</p>
          <Link href="/packets">
            <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-500 hover:text-white transition-all duration-300">
              {t.backToPlans}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentTrack = tracks[selectedDay];
  const currentMarkers = currentTrack?.markers || [];

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 px-3 py-2.5 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <Link href="/packets">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 flex items-center justify-center">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-semibold text-gray-900 truncate" title={packet.name}>
              {packet.name}
            </h1>
            {packet.description && (
              <p className="text-xs text-gray-600 truncate" title={packet.description}>
                {packet.description}
              </p>
            )}
          </div>
          <Button
            variant={packet.shareCode ? "outline" : "default"}
            size="sm"
            onClick={handleShare}
            disabled={shareLoading}
            className={cn(
              "h-9 px-3 flex items-center gap-1.5 font-medium shadow-sm",
              packet.shareCode 
                ? "text-purple-600 border-purple-500 hover:bg-purple-50" 
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            )}
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">
              {shareLoading ? t.sharing : packet.shareCode ? t.shared : t.shareAction}
            </span>
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <MapboxMap
          className="w-full h-full"
          onAddOneMarker={() => {}} // Not needed for view-only
          onLoadMap={() => {}} // Not needed for view-only
          createMarkerDialogIsOpen={false}
          openCreateMarkerDialog={() => {}} // Not needed for view-only
          readOnly={true} // View page is read-only, disable marker adding
        />
        
        {/* Backdrop Overlay - Mobile Only */}
        {isPanelVisible && tracks.length > 0 && (
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 sm:hidden"
            onClick={() => {
              setIsPanelVisible(false);
              setIsExpanded(false);
            }}
          />
        )}
        
        {/* Floating Day Selector Button - Mobile */}
        {tracks.length > 0 && (
          <button
            onClick={() => {
              setIsPanelVisible(!isPanelVisible);
              if (!isPanelVisible) {
                setIsExpanded(true);
              }
            }}
            className="fixed bottom-20 right-4 sm:hidden z-40 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-300 active:scale-95"
            aria-label="Toggle itinerary"
          >
            {isPanelVisible ? (
              <ChevronDown className="h-6 w-6" />
            ) : (
              <Map className="h-6 w-6" />
            )}
          </button>
        )}
        
        {/* Day Selection Banner - Always Visible Outside Panel (Hidden when panel is visible) */}
        {tracks.length > 0 && !isPanelVisible && (
          <div className="fixed bottom-4 left-4 right-20 sm:absolute sm:top-4 sm:left-4 sm:right-auto sm:bottom-auto z-40 max-w-[calc(100vw-120px)] sm:max-w-[500px]">
            <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-purple-100 overflow-hidden">
              {/* Left Arrow */}
              <button
                onClick={() => navigateDay('prev')}
                disabled={selectedDay === 0}
                className={cn(
                  "absolute left-0 top-0 bottom-0 z-20 w-16 flex items-center justify-center",
                  "bg-gradient-to-r from-purple-500/10 to-transparent",
                  "hover:from-purple-500/20 transition-all duration-200",
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                  "active:scale-95"
                )}
              >
                <ChevronLeft className={cn(
                  "h-8 w-8 text-purple-600",
                  selectedDay === 0 ? "opacity-30" : "opacity-100"
                )} />
              </button>

              {/* Right Arrow */}
              <button
                onClick={() => navigateDay('next')}
                disabled={selectedDay === tracks.length - 1}
                className={cn(
                  "absolute right-0 top-0 bottom-0 z-20 w-16 flex items-center justify-center",
                  "bg-gradient-to-l from-purple-500/10 to-transparent",
                  "hover:from-purple-500/20 transition-all duration-200",
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                  "active:scale-95"
                )}
              >
                <ChevronRight className={cn(
                  "h-8 w-8 text-purple-600",
                  selectedDay === tracks.length - 1 ? "opacity-30" : "opacity-100"
                )} />
              </button>

              {/* Day Cards Container */}
              <div 
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth px-16 py-4"
              >
                {tracks.map((track, index) => (
                  <button
                    key={index}
                    onClick={() => handleDayChange(index.toString())}
                    className={cn(
                      "flex-shrink-0 w-24 sm:w-28 rounded-xl font-semibold transition-all duration-300 snap-start",
                      "border-2 shadow-lg active:scale-95",
                      selectedDay === index
                        ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white border-purple-600 shadow-purple-500/40 scale-110 z-10"
                        : "bg-white text-gray-700 border-purple-200 hover:border-purple-300 hover:bg-purple-50 hover:scale-105"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5 p-3">
                      <span className={cn(
                        "font-bold text-sm sm:text-base",
                        selectedDay === index ? "text-white" : "text-gray-900"
                      )}>
                        {track.dayText}
                      </span>
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        selectedDay === index
                          ? "bg-white/20 text-white"
                          : "bg-purple-100 text-purple-700"
                      )}>
                        <MapPin className="h-3 w-3" />
                        <span>{track.markers?.length || 0}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Page Indicator */}
              <div className="flex justify-center gap-1.5 pb-3">
                {tracks.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDayChange(index.toString())}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      selectedDay === index
                        ? "w-6 bg-purple-500"
                        : "w-1.5 bg-purple-200 hover:bg-purple-300"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating Day Selector Button - Desktop */}
        {tracks.length > 0 && (
          <button
            onClick={() => setIsPanelVisible(!isPanelVisible)}
            className="hidden sm:flex absolute top-4 right-4 z-40 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-12 h-12 shadow-lg items-center justify-center hover:from-purple-600 hover:to-pink-600 transition-all duration-300 active:scale-95"
            aria-label="Toggle itinerary"
          >
            {isPanelVisible ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <Map className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Bottom Drawer - Mobile First Design */}
        {tracks.length > 0 && isPanelVisible && (
          <div className={cn(
            "fixed inset-x-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out z-30 flex flex-col backdrop-blur-xl bg-white/95",
            "sm:absolute sm:top-4 sm:right-4 sm:inset-x-auto sm:rounded-2xl sm:w-96 sm:max-h-[calc(100vh-120px)] sm:shadow-xl",
            isExpanded 
              ? "bottom-0 max-h-[85vh]" 
              : "bottom-0 translate-y-[calc(100%-60px)] sm:translate-y-0"
          )}>
            {/* Drawer Handle - Mobile Only */}
            <div className="flex justify-center pt-4 pb-3 sm:hidden cursor-grab active:cursor-grabbing" onClick={() => setIsExpanded(!isExpanded)}>
              <div className="w-16 h-1.5 bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 rounded-full" />
            </div>

            {/* Day Selection Header - Enhanced Design */}
            <div className="px-5 py-4 bg-gradient-to-br from-purple-50/50 to-pink-50/50 border-b border-purple-100/50">
              
              {/* Icon, Current Day Summary and Expand Button Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30 flex-shrink-0">
                    <Map className="h-5 w-5 text-white" />
                  </div>
                  {currentTrack && (
                    <div className="flex items-center gap-2 text-gray-700 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse flex-shrink-0" />
                      <span className="font-semibold text-base truncate">{currentTrack.dayText}</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 flex-shrink-0 ml-auto">
                        <MapPin className="h-3.5 w-3.5 text-purple-600" />
                        <span className="text-sm font-bold text-purple-700">{currentMarkers.length}</span>
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex-shrink-0 h-10 w-10 p-0 rounded-xl hover:bg-purple-100 transition-colors ml-2"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-purple-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-purple-600" />
                  )}
                </Button>
              </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && currentTrack && (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {/* Day Description */}
                {currentTrack.description && (
                  <div className="px-5 py-3 bg-gradient-to-r from-purple-50/30 to-pink-50/30 border-b border-purple-100/50">
                    <p className="text-sm text-gray-700 leading-relaxed">{currentTrack.description}</p>
                  </div>
                )}
                
                {/* Markers List */}
                <div className="flex-1 overflow-y-auto overscroll-contain">
                  <div className="p-5">
                    {currentMarkers.length > 0 ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
                          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider px-3 py-1 rounded-full bg-purple-50">
                            {t.itineraryStops}
                          </span>
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
                        </div>
                        {currentMarkers.map((marker: any, index: number) => (
                          <div
                            key={index}
                            className="group relative p-5 rounded-2xl bg-gradient-to-br from-white to-purple-50/30 border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-lg hover:shadow-purple-100 active:scale-[0.98]"
                          >
                            {/* Marker Icon Overlay - Bottom Right Corner */}
                            {marker.type && (
                              <div className="absolute bottom-4 right-4 w-8 h-8 rounded-lg bg-white border-2 border-purple-200 flex items-center justify-center shadow-md z-10">
                                <img 
                                  src={`/markers/resized/${marker.type}.png`} 
                                  alt={marker.type}
                                  className="w-5 h-5 object-contain"
                                />
                              </div>
                            )}
                            
                            {/* Connection Line (except last item) */}
                            {index < currentMarkers.length - 1 && (
                              <div className="absolute left-8 top-16 w-0.5 h-4 bg-gradient-to-b from-purple-300 to-pink-300 opacity-50" />
                            )}
                            
                            <div className="flex items-start gap-4 pr-12">
                              {/* Marker Number Badge */}
                              <div className="relative flex-shrink-0">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 text-white text-base font-bold flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                                  {index + 1}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0 pt-1">
                                <h4 className="font-bold text-gray-900 mb-1.5 text-lg group-hover:text-purple-700 transition-colors">
                                  {marker.title || `Stop ${index + 1}`}
                                </h4>
                                {marker.description && (
                                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                                    {marker.description}
                                  </p>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <button
                                    onClick={() => {
                                      focusOnMarker(marker);
                                      // On mobile, collapse the drawer so the map is visible
                                      if (window.innerWidth < 640) {
                                        setIsExpanded(false);
                                      }
                                    }}
                                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-purple-200 rounded-xl text-sm font-semibold text-purple-700 hover:bg-purple-50 hover:border-purple-300 active:scale-95 transition-all duration-200 shadow-sm"
                                  >
                                    <Navigation className="h-4 w-4" />
                                    {t.focus}
                                  </button>
                                  <button
                                    onClick={() => openMapAppSelection(marker)}
                                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-pink-600 active:scale-95 transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    {t.navigate}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                          <MapPin className="h-10 w-10 text-purple-400" />
                        </div>
                        <p className="text-lg font-semibold text-gray-700 mb-2">{t.noStopsPlanned}</p>
                        <p className="text-sm text-gray-500">{t.noItineraryItems}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

        {/* Map Apps Selection Modal */}
        {showMapApps && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop with blur */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMapApps(false)}
            />
            
            {/* Bottom Sheet */}
            <div className="relative w-full max-w-md mx-4 mb-4 bg-white rounded-t-2xl shadow-2xl transform transition-all duration-300 ease-out">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="px-6 pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {t.openInMapApp}
                </h3>
                <p className="text-sm text-gray-600">
                  {t.navigate}: {selectedMarker?.title || ''}
                </p>
              </div>
              
              {/* App List */}
              <div className="px-6 pb-6">
                <div className="space-y-2">
                  {availableMapApps.map((app, index) => (
                    <button
                      key={index}
                      onClick={() => handleMapAppSelect(app)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${app.color}15` }}
                      >
                        {app.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">{app.name}</div>
                        <div className="text-sm text-gray-500">
                          {t.openNavigationIn} {app.name}
                        </div>
                      </div>
                      <ExternalLink className="h-5 w-5 text-gray-400" />
                    </button>
                  ))}
                </div>
                
                {/* Cancel Button */}
                <button
                  onClick={() => setShowMapApps(false)}
                  className="w-full mt-4 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium text-gray-700 transition-colors"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share Confirmation Dialog */}
        <Dialog open={showShareConfirmDialog} onOpenChange={setShowShareConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                {t.shareTravelPlan}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">{t.shareDialogDesc}</p>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="free-share"
                    name="shareType"
                    value="free"
                    checked={selectedShareType === 'free'}
                    onChange={(e) => setSelectedShareType(e.target.value as 'free')}
                    className="w-4 h-4"
                  />
                  <label htmlFor="free-share" className="flex-1 cursor-pointer">
                    <div className="font-medium text-gray-900">{t.freeSharing}</div>
                    <div className="text-sm text-gray-500">{t.freeSharingDesc}</div>
                  </label>
                </div>
                <div className="flex items-center space-x-2 opacity-50">
                  <input type="radio" id="paid-share" name="shareType" value="paid" disabled className="w-4 h-4" />
                  <label htmlFor="paid-share" className="flex-1">
                    <div className="font-medium text-gray-400">{t.premiumSharing}</div>
                    <div className="text-sm text-gray-400">{t.premiumSharingDesc} ({t.comingSoon})</div>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowShareConfirmDialog(false)} disabled={shareLoading}>
                {t.cancel}
              </Button>
              <Button
                onClick={handleConfirmShare}
                disabled={shareLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {shareLoading ? t.creating : t.createShareLink}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Link Dialog */}
        <Dialog open={showShareLinkDialog} onOpenChange={setShowShareLinkDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                {t.shareLinkCreated}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="share-link" className="text-sm font-medium">{t.shareLink}</Label>
                <div className="flex mt-2 gap-2">
                  <Input id="share-link" value={shareUrl} readOnly className="flex-1" />
                  <Button type="button" size="sm" onClick={handleCopyLink}
                    className={cn("transition-all", copied ? "bg-green-500 hover:bg-green-600 text-white" : "")}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t.anyoneCanView}</p>
              </div>
              {packet?.shareViews !== undefined && packet.shareViews > 0 && (
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {packet.shareViews} {t.views}
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={handleDisableShare} disabled={shareLoading}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              >
                {shareLoading ? t.stopping : t.stopSharing}
              </Button>
              <Button onClick={() => setShowShareLinkDialog(false)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
              >
                {t.done}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

export default PacketViewPage; 