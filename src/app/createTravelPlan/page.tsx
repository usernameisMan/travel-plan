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
import AiPlanner from "@/components/AiPlanner";

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
  const [pendingDrawMode, setPendingDrawMode] = useState<string | null>(null);
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

    const colors = [
      "#7C3AED", // violet
      "#0EA5E9", // sky
      "#10B981", // emerald
      "#F59E0B", // amber
      "#EF4444", // red
      "#EC4899", // pink
      "#6366F1", // indigo
      "#14B8A6", // teal
    ];
    const color = colors[currentDayIndex % colors.length];

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
        mapInstance.addSource(segmentSourceId, {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry },
        });
        // White casing (outline)
        mapInstance.addLayer({
          id: `route-segment-casing-${currentDayIndex}-${i}`,
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
          id: `route-arrows-${currentDayIndex}-${i}`,
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

    const colors = [
      "#7C3AED", // violet
      "#0EA5E9", // sky
      "#10B981", // emerald
      "#F59E0B", // amber
      "#EF4444", // red
      "#EC4899", // pink
      "#6366F1", // indigo
      "#14B8A6", // teal
    ];

    for (let dayIndex = 0; dayIndex < tracks.length; dayIndex++) {
      const dayTracks = tracks[dayIndex].markers;
      if (dayTracks.length < 2) continue;
      const color = colors[dayIndex % colors.length];

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
          mapInstance.addSource(segmentSourceId, {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry },
          });
          // White casing (outline)
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

  // Draw route lines after tracks state is updated (used by handleApplyAiRoute)
  useEffect(() => {
    if (!pendingDrawMode || !mapInstance || tracks.length === 0) return;
    createAllTracksPath(pendingDrawMode);
    setPendingDrawMode(null);
  }, [tracks, pendingDrawMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Called when user applies an AI-generated route:
  // fits the map to all markers then auto-draws route lines
  const handleApplyAiRoute = (newTracks: DayTrack[]) => {
    handleTracksChange(newTracks);

    if (!mapInstance) return;

    // Collect all coordinates from the new tracks
    const coords: [number, number][] = [];
    newTracks.forEach((day) => {
      day.markers?.forEach((marker: any) => {
        const lng = parseFloat(marker.location?.lng);
        const lat = parseFloat(marker.location?.lat);
        if (!isNaN(lng) && !isNaN(lat)) coords.push([lng, lat]);
      });
    });
    if (coords.length === 0) return;

    if (coords.length === 1) {
      mapInstance.flyTo({ center: coords[0], zoom: 14, duration: 1500 });
    } else {
      const bounds = coords.reduce(
        (b, c) => b.extend(c as mapboxgl.LngLatLike),
        new mapboxgl.LngLatBounds(coords[0], coords[0])
      );
      mapInstance.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 14,
        duration: 1500,
      });
    }

    // Trigger route drawing once tracks state settles
    setPendingDrawMode(routeProfile || "driving");
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
      <div className="text-center p-6 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl max-w-md mx-4">
        <div className="text-2xl font-semibold text-gray-700 mb-4">
            {t.verifyingLoginStatus}
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
        <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md mx-4 border border-purple-100">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {t.loginRequired}
          </h1>
          <p className="text-gray-600 mb-6">
            {t.needToLogin}
          </p>
          <Link href="/login" className="block w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 border-0 shadow-lg active:scale-95">
              {t.goToLogin}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full flex flex-col overflow-hidden")}>
      <CreateMarkerDialog
        onOpenChange={onOpenDialogChange}
        open={createMarkerDialogIsOpen}
        setCreateMarkerDialogDisplayStatus={setOpenCreateMarkerDialog}
        onconfirm={addToTracks}
      />
      
      {/* Mobile Toggle Buttons */}
      <div className="md:hidden flex bg-white border-b border-gray-200 px-3 py-2 gap-2 flex-shrink-0">
        <button
          onClick={() => setIsMobileView("tracks")}
          className={cn(
            "flex-1 min-h-[44px] px-4 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95",
            isMobileView === "tracks"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {t.itineraryPlanning}
        </button>
        <button
          onClick={() => setIsMobileView("map")}
          className={cn(
            "flex-1 min-h-[44px] px-4 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95",
            isMobileView === "map"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          {t.mapView}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex md:flex-row overflow-hidden">
        {/* Travel Tracks Panel */}
        <div className={cn(
          "md:block md:flex-shrink-0 overflow-hidden",
          isMobileView === "tracks" ? "flex-1" : "hidden"
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
          "md:flex-1 overflow-hidden relative",
          isMobileView === "map" ? "flex-1" : "hidden"
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

      {/* AI Route Planner — floats above map, accessible on both views */}
      <AiPlanner
        packetId={packetId}
        onApplyRoute={handleApplyAiRoute}
        currentTracksCount={tracks.reduce((acc, d) => acc + (d.markers?.length || 0), 0)}
      />
    </div>
  );
};

const LoadingFallback = () => {
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="text-center">
        <div className="text-2xl font-semibold text-gray-700 mb-4">
          {t.loadingTravelPlan}
        </div>
        <div className="relative inline-flex">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
        </div>
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
