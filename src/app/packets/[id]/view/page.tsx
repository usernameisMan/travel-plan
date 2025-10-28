"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { http } from "@/lib/http";
import { useAuthStore } from "@/store/authStore";
import { useMapStore } from "@/app/store/mapStore";
import MapboxMap from "@/components/mapbox";
import { ArrowLeft, Map, Eye, ChevronDown, ChevronUp, MapPin, Navigation, ExternalLink, Share2, Copy, Check } from "lucide-react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import { getAvailableMapApps, openInMapApp, type MapApp } from "@/lib/mapUtils";
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
  
  const mapInstance = useMapStore((state) => state.mapboxInstance);
  const [packet, setPacket] = useState<Packet | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<DayTrack[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMapApps, setShowMapApps] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [availableMapApps, setAvailableMapApps] = useState<MapApp[]>([]);
  
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
        const shareUrl = response.data.shareUrl; // Use URL from backend
        setShareUrl(shareUrl);
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

    // Clear markers
    const markers = document.getElementsByClassName("marker");
    while (markers.length > 0) {
      markers[0].remove();
    }

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
  const displayDay = useCallback(async (dayIndex: number) => {
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
      const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFA500", "#800080"];
      
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
            
            // Add source
            mapInstance.addSource(segmentSourceId, {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry,
              },
            });
            
            // Add line layer
            mapInstance.addLayer({
              id: segmentSourceId,
              type: "line",
              source: segmentSourceId,
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": colors[dayIndex % colors.length],
                "line-width": 6,
                "line-opacity": 0.8,
              },
            });

            // Add arrows
            mapInstance.addLayer({
              id: `route-arrows-${dayIndex}-${i}`,
              type: "symbol",
              source: segmentSourceId,
              layout: {
                "symbol-placement": "line",
                "text-field": "→",
                "text-size": 20,
                "text-allow-overlap": true,
                "text-ignore-placement": true,
                "symbol-spacing": 100,
              },
              paint: {
                "text-color": colors[dayIndex % colors.length],
                "text-halo-color": "#ffffff",
                "text-halo-width": 2,
              },
            });
          }
        } catch (error) {
          console.error("Error generating route:", error);
        }
      }
    }

    // Fit map to markers
    if (dayMarkers.length > 0) {
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
        });
      }
    }
  }, [mapInstance, tracks, clearMapContent, addMarkerToMap]);

  // Handle day selection change
  const handleDayChange = (dayIndex: string) => {
    const index = parseInt(dayIndex);
    setSelectedDay(index);
    setIsExpanded(false); // Collapse when switching days
    displayDay(index);
  };

  // Initialize display when map and data are ready
  useEffect(() => {
    if (mapInstance && tracks.length > 0 && !loading) {
      displayDay(selectedDay);
    }
  }, [mapInstance, tracks, selectedDay, loading, displayDay]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">
            Verifying login status...
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
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md mx-4 border border-purple-100">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Login Required</h1>
          <p className="text-gray-600 mb-6">Please log in to view this travel plan.</p>
          <Link href="/login">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 border-0 shadow-lg">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          </div>
          <p className="text-gray-600">Loading travel plan...</p>
        </div>
      </div>
    );
  }

  if (error || !packet) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md mx-4 border border-purple-100">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error || "Travel plan not found"}</p>
          <Link href="/packets">
            <Button variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-500 hover:text-white transition-all duration-300">
              Back to Travel Plans
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentTrack = tracks[selectedDay];
  const currentMarkers = currentTrack?.markers || [];

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/packets">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900 truncate" title={packet.name}>
              {packet.name}
            </h1>
            {packet.description && (
              <p className="text-sm text-gray-600 truncate" title={packet.description}>
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
              "flex items-center gap-2 font-medium shadow-sm",
              packet.shareCode 
                ? "text-purple-600 border-purple-500 hover:bg-purple-50" 
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            )}
          >
            <Share2 className="h-4 w-4" />
            {shareLoading ? "Sharing..." : packet.shareCode ? "Shared" : "Share"}
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
        />
        
        {/* Unified Navigation Panel */}
        {tracks.length > 0 && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg w-80 max-h-[calc(100vh-120px)] flex flex-col">
            {/* Day Selection Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <Map className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <Select value={selectedDay.toString()} onValueChange={handleDayChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {tracks.map((track, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{track.dayText}</span>
                            <span className="text-gray-500 ml-2">({track.markers?.length || 0} stops)</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Current Day Summary */}
              {currentTrack && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Eye className="h-4 w-4" />
                    <span>{currentTrack.dayText}</span>
                  </div>
                  <span className="text-gray-500">{currentMarkers.length} stops</span>
                </div>
              )}
            </div>

            {/* Expandable Content */}
            {isExpanded && currentTrack && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Day Description */}
                {currentTrack.description && (
                  <div className="p-4 border-b border-gray-100">
                    <p className="text-sm text-gray-600">{currentTrack.description}</p>
                  </div>
                )}
                
                {/* Markers List */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-3">
                    {currentMarkers.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-1 mb-2">
                          Itinerary Stops
                        </div>
                        {currentMarkers.map((marker: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-purple-200 group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium flex items-center justify-center">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-gray-900 truncate group-hover:text-purple-600">
                                    {marker.title || `Stop ${index + 1}`}
                                  </h4>
                                </div>
                                {marker.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                                    {marker.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <button
                                    onClick={() => focusOnMarker(marker)}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors"
                                  >
                                    <Navigation className="h-3 w-3" />
                                    Focus on map
                                  </button>
                                  <button
                                    onClick={() => openMapAppSelection(marker)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Use Local App
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium mb-1">No stops planned</p>
                        <p className="text-xs">This day has no itinerary items</p>
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
                  Open in Map App
                </h3>
                <p className="text-sm text-gray-600">
                  Navigate to: {selectedMarker?.title || 'Location'}
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
                          Open navigation in {app.name}
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
                  Cancel
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
                Share Travel Plan
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Share your travel plan with others. Choose how you want to share:
              </p>
              
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
                    <div className="font-medium text-gray-900">Free Sharing</div>
                    <div className="text-sm text-gray-500">
                      Anyone with the link can view your travel plan for free
                    </div>
                  </label>
                </div>
                
                <div className="flex items-center space-x-2 opacity-50">
                  <input
                    type="radio"
                    id="paid-share"
                    name="shareType"
                    value="paid"
                    disabled
                    className="w-4 h-4"
                  />
                  <label htmlFor="paid-share" className="flex-1">
                    <div className="font-medium text-gray-400">Premium Sharing</div>
                    <div className="text-sm text-gray-400">
                      Charge for access to your travel plan (Coming Soon)
                    </div>
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowShareConfirmDialog(false)}
                disabled={shareLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmShare}
                disabled={shareLoading}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {shareLoading ? "Creating..." : "Create Share Link"}
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
                Share Link Created
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="share-link" className="text-sm font-medium">
                  Share Link
                </Label>
                <div className="flex mt-2">
                  <Input
                    id="share-link"
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="ml-2"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Anyone with this link can view your travel plan
                </p>
              </div>

              {packet?.shareViews !== undefined && packet.shareViews > 0 && (
                <div className="text-sm text-gray-600">
                  <Eye className="h-4 w-4 inline mr-1" />
                  {packet.shareViews} view{packet.shareViews !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDisableShare}
                disabled={shareLoading}
              >
                Stop Sharing
              </Button>
              <Button onClick={() => setShowShareLinkDialog(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

export default PacketViewPage; 