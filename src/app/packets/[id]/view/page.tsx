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
import { ArrowLeft, Map, Eye } from "lucide-react";
import Link from "next/link";
import mapboxgl from "mapbox-gl";

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#35b368] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Login Required</h1>
          <p className="text-gray-600 mb-6">Please log in to view this travel plan.</p>
          <Link href="/login">
            <Button className="bg-[#35b368] hover:bg-[#2d9a5a] text-white px-8 py-3 rounded-lg font-semibold transition-colors">
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#35b368] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading travel plan...</p>
        </div>
      </div>
    );
  }

  if (error || !packet) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600 mb-4">{error || "Travel plan not found"}</p>
          <Link href="/packets">
            <Button variant="outline" className="hover:bg-[#35b368] hover:text-white transition-colors">
              Back to Travel Plans
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/packets">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{packet.name}</h1>
            {packet.description && (
              <p className="text-sm text-gray-600">{packet.description}</p>
            )}
          </div>
        </div>

        {/* Day Selection */}
        {tracks.length > 0 && (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Map className="h-5 w-5 text-[#35b368]" />
                <Select value={selectedDay.toString()} onValueChange={handleDayChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {tracks.map((track, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {track.dayText} ({track.markers?.length || 0} stops)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tracks[selectedDay] && (
                  <div className="text-sm text-gray-600">
                    <Eye className="h-4 w-4 inline mr-1" />
                    Viewing: {tracks[selectedDay].dayText}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
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
        
        {/* Day Info Overlay */}
        {tracks[selectedDay] && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
            <h3 className="font-semibold text-gray-900 mb-2">{tracks[selectedDay].dayText}</h3>
            {tracks[selectedDay].description && (
              <p className="text-sm text-gray-600 mb-3">{tracks[selectedDay].description}</p>
            )}
            <div className="text-sm text-gray-500">
              {tracks[selectedDay].markers?.length || 0} stops planned
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PacketViewPage; 