"use client";

import { Inter as FontSans } from "next/font/google";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MapboxMap from "@/components/mapbox";
import TravelTracks from "@/components/traveTracks";
import CreateMarkerDialog from "@/components/dialogs/createMarkerDialog";
import { useMapStore } from "@/app/store/mapStore";
import mapboxgl from "mapbox-gl";
import _ from "lodash";
import { DayTrack } from "@/components/traveTracks/Track";
import { useAuth0 } from "@auth0/auth0-react";
import Link from "next/link";
import { http } from "@/lib/http";
import { useAuthStore } from "@/store/authStore";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const TravelPlanWithSearchParams = () => {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0();
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  const mapInstance = useMapStore((state) => state.mapboxInstance);
  const currentTrackRef = useRef<any>({});
  const [tracks, setTracks] = useState<DayTrack[]>([]);
  const [createMarkerDialogIsOpen, setOpenCreateMarkerDialog] =
    useState<any>(false);
  const [routeProfile, setRouteProfile] = useState<string>("driving");
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileView, setIsMobileView] = useState<"tracks" | "map">("map");
  const [hasInitializedMap, setHasInitializedMap] = useState(false);
  const searchParams = useSearchParams();
  const packetId = searchParams.get('packetId');
  const [currentPacket, setCurrentPacket] = useState<any>(null);
  const [packetName, setPacketName] = useState<string>(t.myTravelPlan);
  const [packetDescription, setPacketDescription] = useState<string>(t.carefullyPlannedRoute);

    // When packet updates, sync tracks data
  const handlePacketUpdate = (newPacket: any) => {
    setCurrentPacket(newPacket);
    
    // Update packet basic info
    if (newPacket?.name) {
      setPacketName(newPacket.name);
    }
    if (newPacket?.description) {
      setPacketDescription(newPacket.description);
    }
    
    // If new packet has itineraryDays data, update tracks
    if (newPacket?.itineraryDays && Array.isArray(newPacket.itineraryDays)) {
      const updatedTracks = newPacket.itineraryDays.map((item: any) => ({
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
      
      setTracks(updatedTracks);
      console.log("Updated tracks from packet:", updatedTracks);
      
      // Trigger map to re-render markers
      setTimeout(() => {
        if (mapInstance) {
          onLoadMap();
        }
      }, 100);
    }
  };

  const getMarkers = async (): Promise<any> => {
    try {
      // Ensure token exists in store
      let token = useAuthStore.getState().token;
      if (!token) {
        // If no token in store, get from Auth0 and set to store
        token = await getAccessTokenSilently();
        useAuthStore.getState().setToken(token);
      }
      
      // If there's packetId parameter, get specified packet, otherwise get default packet
      const endpoint = packetId ? `/api/packets/${packetId}` : "/api/packets/7";
      let data: any = {data: {}};
      if(packetId) {
        data = await http.get(endpoint) as any;
      }
      
      if(data && data?.data) {
        data.data.itineraryDays = data.data?.itineraryDays?.map((item: any) => {
          return {
            ...item,
            day: item.day || `Day ${item.dayNumber || 1}`,
            dayText: item.name || item.dayText || `Day ${item.dayNumber || 1}`,
            markers: item.markers?.map((marker: any) => {
              return {
                ...marker,
                location: {
                  lng: marker?.lng || 0,
                  lat: marker?.lat || 0,
                },
              };
            }) || [],
          };
        });
      }
      return data || '{}';
    } catch (error) {
      console.error("Error fetching markers:", error);
      return '{}';
    }
  }

  useEffect(() => {
    if (isInitialized) return;
    
    const initializeTracks = async () => {
      try {
        // Reset map initialization state when changing packets
        setHasInitializedMap(false);
        
        // If has packetId, get existing data; otherwise use default data (create mode)
        if (packetId) {
          const response = await getMarkers();
          const savedTracks = response?.data?.itineraryDays || [];
          setCurrentPacket(response?.data || null);
          
          // Set packet basic info
          if (response?.data?.name) {
            setPacketName(response.data.name);
          }
          if (response?.data?.description) {
            setPacketDescription(response.data.description);
          }
          
          if (Array.isArray(savedTracks) && savedTracks.length > 0) {
            setTracks(savedTracks);
          } else {
            setTracks([
              {
                day: "Day 1",
                dayText: "Day 1",
                description: "",
                markers: [],
              },
            ]);
          }
        } else {
          // Create mode: use default data
          setTracks([
            {
              day: "Day 1",
              dayText: "Day 1",
              description: "",
              markers: [],
            },
          ]);
          setCurrentPacket(null);
          // Reset to default values
          setPacketName(t.myTravelPlan);
          setPacketDescription(t.carefullyPlannedRoute);
        }
        setIsInitialized(true);
      } catch (error) {
        console.error("Error fetching markers:", error);
        // If API request fails, set default tracks
        setTracks([
          {
            day: "Day 1",
            dayText: "Day 1",
            description: "",
            markers: [],
          },
        ]);
        setCurrentPacket(null);
        setIsInitialized(true);
      }
    };

    initializeTracks();
  }, [isInitialized, packetId]);

  // Reset initialization state when packetId changes
  useEffect(() => {
    setIsInitialized(false);
    setHasInitializedMap(false);
  }, [packetId]);

  useEffect(() => {
    if (!isInitialized) return;
    if (Array.isArray(tracks) && tracks.length > 0) {
      try {
        localStorage?.setItem("currentTracks", JSON.stringify(tracks));
      } catch (error) {
        console.error("Error saving tracks:", error);
      }
    }
  }, [tracks, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !mapInstance) return;
    onLoadMap();
  }, [tracks, mapInstance, isInitialized]);

  // Get user location
  const getUserLocation = useCallback(() => {
    return new Promise<{ lng: number; lat: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lng: position.coords.longitude,
            lat: position.coords.latitude,
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
          // Default to a central location if geolocation fails
          resolve({ lng: 116.4074, lat: 39.9042 }); // Beijing coordinates as fallback
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000, // 10 minutes
        }
      );
    });
  }, []);

  // Find first marker in all tracks
  const findFirstMarker = useCallback(() => {
    if (!Array.isArray(tracks) || tracks.length === 0) return null;
    
    for (const dayTrack of tracks) {
      if (dayTrack && Array.isArray(dayTrack.markers) && dayTrack.markers.length > 0) {
        const firstMarker = dayTrack.markers[0];
        if (firstMarker && firstMarker.location) {
          return {
            lng: parseFloat(firstMarker.location.lng),
            lat: parseFloat(firstMarker.location.lat),
          };
        }
      }
    }
    return null;
  }, [tracks]);

  // Initialize map position
  const initializeMapPosition = useCallback(async () => {
    if (!mapInstance || hasInitializedMap) return;

    const firstMarker = findFirstMarker();
    
    if (firstMarker) {
      // If we have existing data, fly to first marker
      console.log("Flying to first marker:", firstMarker);
      mapInstance.flyTo({
        center: [firstMarker.lng, firstMarker.lat],
        zoom: 13,
        duration: 2000,
      });
    } else if (!packetId) {
      // If it's a new plan (no packetId), use user location
      try {
        console.log("Getting user location for new plan...");
        const userLocation = await getUserLocation();
        console.log("Flying to user location:", userLocation);
        mapInstance.flyTo({
          center: [userLocation.lng, userLocation.lat],
          zoom: 13,
          duration: 2000,
        });
      } catch (error) {
        console.error("Failed to get user location:", error);
        // Fallback to default location
        mapInstance.flyTo({
          center: [116.4074, 39.9042], // Beijing
          zoom: 10,
          duration: 2000,
        });
      }
    }
    
    setHasInitializedMap(true);
  }, [mapInstance, hasInitializedMap, findFirstMarker, getUserLocation, packetId]);

  const onLoadMap = useCallback(() => {
    if (!mapInstance) return;

    // Clear all existing markers
    const markers = document.getElementsByClassName("marker");
    while (markers.length > 0) {
      markers[0].remove();
    }

    // Clear all existing paths and arrows
    const layers = mapInstance.getStyle()?.layers || [];
    if (layers.length > 0) {
      layers.forEach((layer: any) => {
        if (
          layer.id.startsWith("route-segment-") ||
          layer.id.startsWith("route-arrows-")
        ) {
          if (mapInstance.getLayer(layer.id)) mapInstance.removeLayer(layer.id);
        }
      });
    }
    const sources = mapInstance.getStyle()?.sources || {};
    Object.keys(sources).forEach((sourceId) => {
      if (sourceId.startsWith("route-segment-")) {
        if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
      }
    });

    // Re-add all markers
    if (Array.isArray(tracks) && tracks.length > 0) {
      tracks.forEach((dayTrack: DayTrack, dayIndex: number) => {
        if (dayTrack && Array.isArray(dayTrack.markers)) {
          dayTrack.markers.forEach((track: any, idx: number) => {
            if (track && track.type && track.location) {
              addMarkerToMap(
                track.type,
                track.location.lng,
                track.location.lat,
                `[${dayIndex + 1}-${idx + 1}]${track.title}`
              );
            }
          });
        }
      });
    }

    // Initialize map position after loading markers
    if (isInitialized) {
      initializeMapPosition();
    }
  }, [mapInstance, tracks, isInitialized, initializeMapPosition]);

  // Trigger map initialization when tracks change (for cases where data loads after map)
  useEffect(() => {
    if (mapInstance && isInitialized && !hasInitializedMap) {
      initializeMapPosition();
    }
  }, [mapInstance, isInitialized, hasInitializedMap, initializeMapPosition]);

  const openCreateMarkerDialogHandle = () => {
    setOpenCreateMarkerDialog(true);
  };

  const onOpenDialogChange = (open: boolean) => {
    setOpenCreateMarkerDialog(open);
  };

  const addMarkerToMap = (
    type: string,
    lng: string,
    lat: string,
    label?: string
  ) => {
    if (!mapInstance) {
      console.error("mapInstance is not ready in addMarkerToMap", mapInstance);
      return;
    }
    if (!(mapInstance instanceof mapboxgl.Map)) {
      console.error("mapInstance is not a valid mapboxgl.Map instance", mapInstance);
      return;
    }
    if (!mapInstance._container) {
      console.error("mapInstance container is destroyed, cannot add marker", mapInstance);
      return;
    }
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
      .setLngLat([parseFloat(lng), parseFloat(lat)])
      .addTo(mapInstance);
    console.log("addTo mapInstance success", marker);

    if (mapInstance.getCanvas()?.style) {
      mapInstance.getCanvas().style.cursor = "grab";
    }

    return marker;
  };

  const addToTracks = (title: string, description: string) => {
    if (!currentTrackRef.current?.location?.lng) {
      console.error(t.noLocationData);
      return;
    }
    if (!mapInstance) {
      alert(t.mapNotLoaded);
      return;
    }

    try {
      const newTracks = _.cloneDeep(tracks);
      
      // Ensure tracks array exists
      if (!Array.isArray(newTracks)) {
        console.error("Tracks is not an array:", newTracks);
        return;
      }

      // If no itinerary days, create one
      if (newTracks.length === 0) {
        newTracks.push({
          day: "Day 1",
          dayText: "Day 1",
          description: "",
          markers: [],
        });
        // Reset currentDayIndex to 0
        setCurrentDayIndex(0);
      }

      // Ensure currentDayIndex is within valid range
      const validDayIndex = Math.min(currentDayIndex, newTracks.length - 1);
      
      // Ensure current day exists and has markers array
      if (!newTracks[validDayIndex]) {
        console.error("Day not found at index:", validDayIndex);
        return;
      }
      
      if (!Array.isArray(newTracks[validDayIndex].markers)) {
        console.error("Markers is not an array for day:", validDayIndex);
        newTracks[validDayIndex].markers = [];
      }

      // Safely add new marker
      newTracks[validDayIndex].markers.push({
        ...currentTrackRef.current,
        title,
        description,
      });

      setTracks(newTracks);
      // Add map marker
      addMarkerToMap(
        currentTrackRef.current.type,
        currentTrackRef.current.location.lng,
        currentTrackRef.current.location.lat,
        `${validDayIndex + 1}-${newTracks[validDayIndex].markers.length}${title}`
      );

      // Clean current reference
      currentTrackRef.current = {};
      
    } catch (error) {
      console.error("Error adding track:", error);
      alert(t.errorOccurred);
    }
  };

  const onAddOneMarker = useCallback(
    (fileName: string, lng: string, lat: string) => {
      currentTrackRef.current = {
        type: fileName,
        location: {
          lng,
          lat,
        },
      };
    },
    []
  );

  const createTracksPath = async (mode: string) => {
    let effectiveProfile = mode;
    if (mode === "transit") {
      alert(t.transitNotSupported);
      effectiveProfile = "walking";
    }

    if (!mapInstance) return;

    // Check if current day's tracks exist
    if (!tracks[currentDayIndex] || !Array.isArray(tracks[currentDayIndex].markers)) {
      alert(t.currentItineraryNoMarkers);
      return;
    }

    const dayTracks = tracks[currentDayIndex].markers;
    if (dayTracks.length < 2) {
      alert(t.needTwoMarkers);
      return;
    }

    // Clean old paths and arrows
    const layers = mapInstance.getStyle()?.layers || [];
    if (layers.length > 0) {
      layers.forEach((layer: any) => {
        if (
          layer.id.startsWith("route-segment-") ||
          layer.id.startsWith("route-arrows-")
        ) {
          if (mapInstance.getLayer(layer.id)) mapInstance.removeLayer(layer.id);
        }
      });
    }
    const sources = mapInstance.getStyle()?.sources || {};
    Object.keys(sources).forEach((sourceId) => {
      if (sourceId.startsWith("route-segment-")) {
        if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
      }
    });

    // Color array
    const colors = [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFA500",
      "#800080",
      "#008080",
      "#FFC0CB",
      "#A52A2A",
      "#808080",
      "#000000",
    ];

    // Request directions for each segment
    for (let i = 0; i < dayTracks.length - 1; i++) {
      const from = dayTracks[i];
      const to = dayTracks[i + 1];
      
      if (!from || !to || !from.location || !to.location) {
        console.error("Invalid track data:", { from, to });
        continue;
      }

      const waypoints = `${parseFloat(from.location.lng)},${parseFloat(
        from.location.lat
      )};${parseFloat(to.location.lng)},${parseFloat(to.location.lat)}`;
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${effectiveProfile}/${waypoints}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        const data = await response.json();
        if (!data.routes || data.routes.length === 0) continue;
        const geometry = data.routes[0].geometry;
        const segmentSourceId = `route-segment-${currentDayIndex}-${i}`;
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
            "line-color": colors[currentDayIndex % colors.length],
            "line-width": 8,
            "line-opacity": 1,
          },
        });
        // Add arrow layer
        mapInstance.addLayer({
          id: `route-arrows-${currentDayIndex}-${i}`,
          type: "symbol",
          source: segmentSourceId,
          layout: {
            "symbol-placement": "line",
            "text-field": `${currentDayIndex + 1}-${i + 1}>>`,
            "text-size": 24,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
            "text-keep-upright": false,
            "symbol-spacing": 20,
          },
          paint: {
            "text-color": colors[currentDayIndex % colors.length],
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
            "text-opacity": 0.9,
          },
        });
      } catch (error) {
        console.error("Error generating segment", currentDayIndex, i, error);
      }
    }
  };

  // Generate total route for all days
  const createAllTracksPath = async (mode: string) => {
    let effectiveProfile = mode;
    if (mode === "transit") {
      alert(t.transitNotSupported);
      effectiveProfile = "walking";
    }
    if (!mapInstance) return;

    // Clean old paths and arrows
    const layers = mapInstance.getStyle()?.layers || [];
    if (layers.length > 0) {
      layers.forEach((layer: any) => {
        if (
          layer.id.startsWith("route-segment-") ||
          layer.id.startsWith("route-arrows-")
        ) {
          if (mapInstance.getLayer(layer.id)) mapInstance.removeLayer(layer.id);
        }
      });
    }
    const sources = mapInstance.getStyle()?.sources || {};
    Object.keys(sources).forEach((sourceId) => {
      if (sourceId.startsWith("route-segment-")) {
        if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
      }
    });

    // Color array
    const colors = [
      "#FF0000",
      "#00FF00",
      "#0000FF",
      "#FFA500",
      "#800080",
      "#008080",
      "#FFC0CB",
      "#A52A2A",
      "#808080",
      "#000000",
    ];

    for (let dayIndex = 0; dayIndex < tracks.length; dayIndex++) {
      const dayTracks = tracks[dayIndex].markers;
      if (dayTracks.length < 2) {
        continue;
      }
      for (let i = 0; i < dayTracks.length - 1; i++) {
        const from = dayTracks[i];
        const to = dayTracks[i + 1];
        
        if (!from || !to || !from.location || !to.location) {
          console.error("Invalid track data:", { from, to });
          continue;
        }

        const waypoints = `${parseFloat(from.location.lng)},${parseFloat(
          from.location.lat
        )};${parseFloat(to.location.lng)},${parseFloat(to.location.lat)}`;
        try {
          const response = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/${effectiveProfile}/${waypoints}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
          );
          const data = await response.json();
          if (!data.routes || data.routes.length === 0) continue;
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
              "line-width": 8,
              "line-opacity": 1,
            },
          });
          // Add arrow layer
          mapInstance.addLayer({
            id: `route-arrows-${dayIndex}-${i}`,
            type: "symbol",
            source: segmentSourceId,
            layout: {
              "symbol-placement": "line",
              "text-field": `${dayIndex + 1}-${i + 1}>>`,
              "text-size": 24,
              "text-allow-overlap": true,
              "text-ignore-placement": true,
              "text-keep-upright": false,
              "symbol-spacing": 20,
            },
            paint: {
              "text-color": colors[dayIndex % colors.length],
              "text-halo-color": "#ffffff",
              "text-halo-width": 2,
              "text-opacity": 0.9,
            },
          });
        } catch (error) {
          console.error("Error generating segment", dayIndex, i, error);
        }
      }
    }
  };

  const handleTracksChange = (newTracks: DayTrack[]) => {
    if (!Array.isArray(newTracks)) {
      console.error("Invalid tracks data:", newTracks);
      return;
    }
    
    setTracks(newTracks);
    // Force trigger map marker re-rendering
    if (mapInstance) {
      // Clear all existing markers
      const markers = document.getElementsByClassName("marker");
      while (markers.length > 0) {
        markers[0].remove();
      }

      // Re-add all markers
      newTracks.forEach((dayTrack: DayTrack, dayIndex: number) => {
        if (dayTrack && Array.isArray(dayTrack.markers)) {
          dayTrack.markers.forEach((track: any, idx: number) => {
            if (track && track.type && track.location) {
              addMarkerToMap(
                track.type,
                track.location.lng,
                track.location.lat,
                `${dayIndex + 1}-${idx + 1}${dayTrack.markers[idx].title}`
              );
            }
          });
        }
      });
    }
  };

  const handleDeleteTrack = (dayIndex: number, trackIndex: number) => {
    try {
      if (!Array.isArray(tracks)) {
        console.error("Tracks is not an array");
        return;
      }
      
      if (dayIndex < 0 || dayIndex >= tracks.length) {
        console.error("Invalid day index:", dayIndex);
        return;
      }
      
      if (!tracks[dayIndex] || !Array.isArray(tracks[dayIndex].markers)) {
        console.error("Invalid day or markers array:", dayIndex);
        return;
      }
      
      if (trackIndex < 0 || trackIndex >= tracks[dayIndex].markers.length) {
        console.error("Invalid track index:", trackIndex);
        return;
      }

      const newTracks = _.cloneDeep(tracks);
      newTracks[dayIndex].markers.splice(trackIndex, 1);
      setTracks(newTracks);
      
    } catch (error) {
      console.error("Error deleting track:", error);
      alert(t.errorDeletingMarker);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">
            {t.verifyingLoginStatus}
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#35b368] mx-auto"></div>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {t.loginRequired}
          </h1>
          <p className="text-gray-600 mb-6">
            {t.needToLogin}
          </p>
          <Link href="/login">
            <Button className="bg-[#35b368] hover:bg-[#2d9a5a] text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              {t.goToLogin}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full flex flex-col md:flex-row")}>
      <CreateMarkerDialog
        onOpenChange={onOpenDialogChange}
        open={createMarkerDialogIsOpen}
        setCreateMarkerDialogDisplayStatus={setOpenCreateMarkerDialog}
        onconfirm={addToTracks}
      />
      
      {/* Mobile Toggle Buttons */}
      <div className="md:hidden flex bg-white border-b border-gray-200 p-2 gap-2">
        <button
          onClick={() => setIsMobileView("tracks")}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
            isMobileView === "tracks"
              ? "bg-[#35b368] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {t.itineraryPlanning}
        </button>
        <button
          onClick={() => setIsMobileView("map")}
          className={cn(
            "flex-1 py-2 px-4 rounded-lg font-medium transition-colors",
            isMobileView === "map"
              ? "bg-[#35b368] text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          {t.mapView}
        </button>
      </div>

      {/* Travel Tracks Panel */}
      <div className={cn(
        "md:block",
        isMobileView === "tracks" ? "block" : "hidden"
      )}>
        <TravelTracks
          createTracksPath={createTracksPath}
          createAllTracksPath={createAllTracksPath}
          tracks={tracks}
          onTracksChange={handleTracksChange}
          onDeleteTrack={handleDeleteTrack}
          currentDayIndex={currentDayIndex}
          onDaySelect={setCurrentDayIndex}
          currentPacket={currentPacket}
          onPacketUpdate={handlePacketUpdate}
          packetName={packetName}
          packetDescription={packetDescription}
          onPacketNameChange={setPacketName}
          onPacketDescriptionChange={setPacketDescription}
        />
      </div>

      {/* Map Panel */}
      <div className={cn(
        "flex-1 md:grow",
        isMobileView === "map" ? "block" : "hidden"
      )}>
        <MapboxMap
          className={cn("w-full h-full")}
          onAddOneMarker={onAddOneMarker}
          onLoadMap={onLoadMap}
          createMarkerDialogIsOpen={createMarkerDialogIsOpen}
          openCreateMarkerDialog={openCreateMarkerDialogHandle}
        />
      </div>
    </div>
  );
};

const LoadingFallback = () => {
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-semibold text-gray-700 mb-4">
          {t.loadingTravelPlan}
        </div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#35b368] mx-auto"></div>
      </div>
    </div>
  );
};

const TravelPlan = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TravelPlanWithSearchParams />
    </Suspense>
  );
};

export default TravelPlan;
