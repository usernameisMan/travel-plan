"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { http } from "@/lib/http";
import { useMapStore } from "@/app/store/mapStore";
import { useAuthStore } from "@/store/authStore";
import MapboxMap from "@/components/mapbox";
import { 
  ArrowLeft, 
  Map, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Navigation, 
  ExternalLink,
  User,
  Calendar,
  Share2,
  Download,
  Heart,
  BookmarkPlus
} from "lucide-react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import { getAvailableMapApps, openInMapApp, type MapApp } from "@/lib/mapUtils";

interface DayTrack {
  day: string;
  dayText: string;
  description: string;
  markers: any[];
}

interface SharedPacket {
  id: number;
  name: string;
  description: string;
  shareType: string;
  shareViews: number;
  author: {
    name: string;
    userId: string;
  };
  itineraryDays: DayTrack[];
  markers: any[];
  createdAt: string;
}

const SharedPacketPage = () => {
  const { isAuthenticated, isLoading: authLoading, getAccessTokenSilently } = useAuth0();
  const params = useParams();
  const router = useRouter();
  const shareCode = params.shareCode as string;
  
  const mapInstance = useMapStore((state) => state.mapboxInstance);
  const [packet, setPacket] = useState<SharedPacket | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<DayTrack[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMapApps, setShowMapApps] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [availableMapApps, setAvailableMapApps] = useState<MapApp[]>([]);
  
  // Import to own plan states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  // Fetch shared packet data
  const fetchSharedPacket = useCallback(async () => {
    if (!shareCode) return;
    
    try {
      setLoading(true);
      setError(null);

      // Note: This endpoint doesn't require authentication
      const data = await http.get(`/api/shared/${shareCode}`, {
        requiresAuth: false
      }) as any;

      if (data && data.data && data.data.packet) {
        const packetData = data.data.packet;
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
      console.error("Error fetching shared packet:", error);
      setError(error instanceof Error ? error.message : "Failed to load shared content");
    } finally {
      setLoading(false);
    }
  }, [shareCode]);

  useEffect(() => {
    fetchSharedPacket();
  }, [fetchSharedPacket]);

  // Initialize available map apps
  useEffect(() => {
    setAvailableMapApps(getAvailableMapApps());
  }, []);

  // Import to own plan functionality
  const handleImportToPlan = useCallback(() => {
    if (!isAuthenticated) {
      // Show login prompt instead of direct redirect
      setShowImportDialog(true);
      return;
    }
    setShowImportDialog(true);
  }, [isAuthenticated]);

  const handleConfirmImport = useCallback(async () => {
    if (!packet || !isAuthenticated) return;
    
    try {
      setImportLoading(true);
      
      // Get auth token
      let token = useAuthStore.getState().token;
      if (!token) {
        token = await getAccessTokenSilently();
        useAuthStore.getState().setToken(token);
      }

      // Prepare the travel plan data for import
      const importData = {
        name: `${packet.name} (Copy)`,
        description: packet.description,
        itinerary: tracks.map((track, index) => ({
          dayText: track.dayText,
          day: index + 1,
          description: track.description,
          tracks: track.markers.map((marker, markerIndex) => ({
            title: marker.title,
            description: marker.description,
            type: marker.type,
            location: {
              lng: marker.location.lng,
              lat: marker.location.lat,
            },
            sortOrder: markerIndex,
          })),
        })),
      };

      // Import the travel plan
      const response = await http.post('/api/packets/with-itinerary', importData) as any;

      if (response && response.data) {
        setImportSuccess(true);
        setTimeout(() => {
          setShowImportDialog(false);
          // Redirect to the imported travel plan
          router.push(`/packets/${response.data.id}/view`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error importing travel plan:', error);
      // TODO: Show error toast
    } finally {
      setImportLoading(false);
    }
  }, [packet, isAuthenticated, tracks, getAccessTokenSilently, router]);

  // Add markers to map
  const addMarkerToMap = useCallback((
    type: string,
    lng: number,
    lat: number,
    title: string
  ) => {
    if (!mapInstance) return;

    const markerElement = document.createElement("div");
    markerElement.style.backgroundImage = `url(/markers/resized/${type}.png)`;
    markerElement.style.width = "30px";
    markerElement.style.height = "30px";
    markerElement.style.backgroundSize = "contain";
    markerElement.style.backgroundRepeat = "no-repeat";
    markerElement.style.cursor = "pointer";

    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
      `<div class="p-2"><strong>${title}</strong></div>`
    );

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat([lng, lat])
      .setPopup(popup)
      .addTo(mapInstance);

    markerElement.addEventListener("click", () => {
      openMapAppSelection({ title, location: { lng, lat } });
    });

    return marker;
  }, [mapInstance]);

  // Clear map content
  const clearMapContent = useCallback(() => {
    if (!mapInstance) return;

    // Remove existing markers
    const markers = document.querySelectorAll(".mapboxgl-marker");
    markers.forEach((marker) => marker.remove());

    // Remove existing layers and sources
    const map = mapInstance;
    if (map.getStyle()) {
      const layers = map.getStyle().layers || [];
      const sources = map.getStyle().sources || {};

      layers.forEach((layer: any) => {
        if (layer.id.includes("route")) {
          try {
            map.removeLayer(layer.id);
          } catch (e) {
            // Layer might not exist
          }
        }
      });

      Object.keys(sources).forEach((sourceId) => {
        if (sourceId.includes("route")) {
          try {
            map.removeSource(sourceId);
          } catch (e) {
            // Source might not exist
          }
        }
      });
    }
  }, [mapInstance]);

  // Handle day selection
  const handleDayChange = useCallback((value: string) => {
    const dayIndex = parseInt(value);
    setSelectedDay(dayIndex);
  }, []);

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
                "text-font": ["Open Sans Regular"],
                "symbol-spacing": 100,
                "text-rotation-alignment": "map",
                "text-pitch-alignment": "viewport",
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

    // Fit map to show all markers
    if (dayMarkers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      dayMarkers.forEach((marker: any) => {
        if (marker?.location) {
          bounds.extend([marker.location.lng, marker.location.lat]);
        }
      });
      
      mapInstance.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 350 },
        maxZoom: 15,
      });
    }
  }, [mapInstance, tracks, clearMapContent, addMarkerToMap]);

  // Display selected day on tracks or selectedDay change
  useEffect(() => {
    if (tracks.length > 0 && mapInstance) {
      displayDay(selectedDay);
    }
  }, [selectedDay, tracks, mapInstance, displayDay]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-flex mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          </div>
          <p className="text-gray-600">Loading shared travel plan...</p>
        </div>
      </div>
    );
  }

  if (error || !packet) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error || "Shared travel plan not found"}</p>
          <Button 
            variant="outline" 
            className="border-purple-300 text-purple-600 hover:bg-purple-500 hover:text-white transition-colors"
            onClick={() => router.back()}
          >
            Go Back
          </Button>
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
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-gray-900 truncate" title={packet.name}>
                {packet.name}
              </h1>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Share2 className="h-4 w-4" />
                <span>Shared</span>
              </div>
            </div>
            {packet.description && (
              <p className="text-sm text-gray-600 truncate" title={packet.description}>
                {packet.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>by {packet.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(packet.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>{packet.shareViews} views</span>
              </div>
            </div>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={handleImportToPlan}
            disabled={importLoading}
            className={cn(
              "flex items-center gap-2 font-medium shadow-sm",
              !isAuthenticated 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
            )}
          >
            <BookmarkPlus className="h-4 w-4" />
            {importLoading ? "Adding..." : !isAuthenticated ? "Login to Save" : "Add to My Plans"}
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
                  <div className="p-4 space-y-3">
                    {currentMarkers.map((marker: any, index: number) => (
                      <Card 
                        key={`${marker.id}-${index}`} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openMapAppSelection(marker)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8">
                              <img 
                                src={`/markers/resized/${marker.type}.png`} 
                                alt={marker.type}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm truncate">
                                    {index + 1}. {marker.title}
                                  </h4>
                                  {marker.description && (
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                      {marker.description}
                                    </p>
                                  )}
                                </div>
                                <Navigation className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {currentMarkers.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No locations for this day</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Map App Selection Modal */}
        {showMapApps && selectedMarker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4">
            <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[70vh] overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Navigate to {selectedMarker.title}
                  </h3>
                  <p className="text-gray-600">Choose your preferred map application</p>
                </div>

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

        {/* Import Confirmation Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookmarkPlus className="h-5 w-5" />
                {!isAuthenticated ? "Login Required" : "Add to My Plans"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {importSuccess ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Successfully Added!</h3>
                  <p className="text-sm text-gray-600">
                    This travel plan has been added to your account.
                  </p>
                </div>
              ) : !isAuthenticated ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Login to Save</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You need to login to add this travel plan to your collection. You&apos;ll be able to view and edit your own copy.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Travel Plan:</span>
                      <span className="font-medium">{packet?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Days:</span>
                      <span className="font-medium">{tracks.length} days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Locations:</span>
                      <span className="font-medium">
                        {tracks.reduce((total, track) => total + (track.markers?.length || 0), 0)} places
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Add &quot;{packet?.name}&quot; to your travel plans? You&apos;ll be able to view and edit your own copy.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Travel Plan:</span>
                      <span className="font-medium">{packet?.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Days:</span>
                      <span className="font-medium">{tracks.length} days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Locations:</span>
                      <span className="font-medium">
                        {tracks.reduce((total, track) => total + (track.markers?.length || 0), 0)} places
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!importSuccess && (
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowImportDialog(false)}
                  disabled={importLoading}
                >
                  {!isAuthenticated ? "Maybe Later" : "Cancel"}
                </Button>
                {!isAuthenticated ? (
                  <Link href="/login">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Login to Save
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    onClick={handleConfirmImport}
                    disabled={importLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {importLoading ? "Adding..." : "Add to My Plans"}
                  </Button>
                )}
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SharedPacketPage;