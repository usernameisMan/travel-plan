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

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const TravelPlanWithSearchParams = () => {
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0();
  const mapInstance = useMapStore((state) => state.mapboxInstance);
  const currentTrackRef = useRef<any>({});
  const [tracks, setTracks] = useState<DayTrack[]>([]);
  const [createMarkerDialogIsOpen, setOpenCreateMarkerDialog] =
    useState<any>(false);
  const [routeProfile, setRouteProfile] = useState<string>("driving");
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMobileView, setIsMobileView] = useState<"tracks" | "map">("map");
  const searchParams = useSearchParams();
  const packetId = searchParams.get('packetId');
  const [currentPacket, setCurrentPacket] = useState<any>(null);
  const [packetName, setPacketName] = useState<string>("我的旅行计划");
  const [packetDescription, setPacketDescription] = useState<string>("精心规划的旅行路线");

    // 当packet更新时，同步更新tracks数据
  const handlePacketUpdate = (newPacket: any) => {
    setCurrentPacket(newPacket);
    
    // 更新packet的基本信息
    if (newPacket?.name) {
      setPacketName(newPacket.name);
    }
    if (newPacket?.description) {
      setPacketDescription(newPacket.description);
    }
    
    // 如果新packet有itineraryDays数据，更新tracks
    if (newPacket?.itineraryDays && Array.isArray(newPacket.itineraryDays)) {
      const updatedTracks = newPacket.itineraryDays.map((item: any) => ({
        ...item,
        day: item.day || `Day ${item.dayNumber || 1}`,
        dayText: item.name || item.dayText || `第${item.dayNumber || 1}天`,
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
      
      // 触发地图重新渲染标记点
      setTimeout(() => {
        if (mapInstance) {
          onLoadMap();
        }
      }, 100);
    }
  };

  const getMarkers = async (): Promise<any> => {
    try {
      // 确保 token 存在于 store 中
      let token = useAuthStore.getState().token;
      if (!token) {
        // 如果 store 中没有 token，直接从 Auth0 获取并设置到 store
        token = await getAccessTokenSilently();
        useAuthStore.getState().setToken(token);
      }
      
      // 如果有 packetId 参数，则获取指定的 packet，否则获取默认的 packet
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
            dayText: item.name || item.dayText || `第${item.dayNumber || 1}天`,
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
        // 如果有 packetId，则获取现有数据；否则使用默认数据（创建模式）
        if (packetId) {
          const response = await getMarkers();
          const savedTracks = response?.data?.itineraryDays || [];
          setCurrentPacket(response?.data || null);
          
          // 设置packet的基本信息
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
                dayText: "第1天",
                description: "",
                markers: [],
              },
            ]);
          }
        } else {
          // 创建模式：使用默认数据
          setTracks([
            {
              day: "Day 1",
              dayText: "第1天",
              description: "",
              markers: [],
            },
          ]);
          setCurrentPacket(null);
          // 重置为默认值
          setPacketName("我的旅行计划");
          setPacketDescription("精心规划的旅行路线");
        }
        setIsInitialized(true);
      } catch (error) {
        console.error("Error fetching markers:", error);
        // 如果 API 请求失败，设置默认的 tracks
        setTracks([
          {
            day: "Day 1",
            dayText: "第1天",
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

  const onLoadMap = useCallback(() => {
    if (!mapInstance) return;

    // 清除所有现有的标记点
    const markers = document.getElementsByClassName("marker");
    while (markers.length > 0) {
      markers[0].remove();
    }

    // 清除所有现有的路径和箭头
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

    // 重新添加所有标记点
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
  }, [mapInstance, tracks]);

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
    console.log("addTo mapInstance 成功", marker);

    if (mapInstance.getCanvas()?.style) {
      mapInstance.getCanvas().style.cursor = "grab";
    }

    return marker;
  };

  const addToTracks = (title: string, description: string) => {
    if (!currentTrackRef.current?.location?.lng) {
      console.error("No location data available");
      return;
    }
    if (!mapInstance) {
      alert("地图还没加载好，请稍后再试！");
      return;
    }

    try {
      const newTracks = _.cloneDeep(tracks);
      
      // 确保tracks数组存在
      if (!Array.isArray(newTracks)) {
        console.error("Tracks is not an array:", newTracks);
        return;
      }

      // 如果没有行程日，创建一个
      if (newTracks.length === 0) {
        newTracks.push({
          day: "Day 1",
          dayText: "第1天",
          description: "",
          markers: [],
        });
        // 重置currentDayIndex为0
        setCurrentDayIndex(0);
      }

      // 确保currentDayIndex在有效范围内
      const validDayIndex = Math.min(currentDayIndex, newTracks.length - 1);
      
      // 确保当前day存在且有markers数组
      if (!newTracks[validDayIndex]) {
        console.error("Day not found at index:", validDayIndex);
        return;
      }
      
      if (!Array.isArray(newTracks[validDayIndex].markers)) {
        console.error("Markers is not an array for day:", validDayIndex);
        newTracks[validDayIndex].markers = [];
      }

      // 安全地添加新标记
      newTracks[validDayIndex].markers.push({
        ...currentTrackRef.current,
        title,
        description,
      });

      setTracks(newTracks);
      // 添加地图标记
      addMarkerToMap(
        currentTrackRef.current.type,
        currentTrackRef.current.location.lng,
        currentTrackRef.current.location.lat,
        `${validDayIndex + 1}-${newTracks[validDayIndex].markers.length}${title}`
      );

      // 清理当前引用
      currentTrackRef.current = {};
      
    } catch (error) {
      console.error("Error adding track:", error);
      alert("添加标记点时出现错误，请重试");
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
      alert("公交路线暂不支持，已为你用步行路线代替。");
      effectiveProfile = "walking";
    }

    if (!mapInstance) return;

    // 检查当前day的tracks是否存在
    if (!tracks[currentDayIndex] || !Array.isArray(tracks[currentDayIndex].markers)) {
      alert("当前行程日没有有效的标记点！");
      return;
    }

    const dayTracks = tracks[currentDayIndex].markers;
    if (dayTracks.length < 2) {
      alert("请至少添加两个标记点来生成路径！");
      return;
    }

    // 清理旧的路径和箭头
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

    // 颜色数组
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

    // 依次请求每一段的 directions
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
        // 添加 source
        mapInstance.addSource(segmentSourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry,
          },
        });
        // 添加线条 layer
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
        // 添加箭头 layer
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

  // 生成所有天的总路线
  const createAllTracksPath = async (mode: string) => {
    let effectiveProfile = mode;
    if (mode === "transit") {
      alert("公交路线暂不支持，已为你用步行路线代替。");
      effectiveProfile = "walking";
    }
    if (!mapInstance) return;

    // 清理旧的路径和箭头
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

    // 颜色数组
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
          // 添加 source
          mapInstance.addSource(segmentSourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry,
            },
          });
          // 添加线条 layer
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
          // 添加箭头 layer
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
    // 强制触发地图标记重新渲染
    if (mapInstance) {
      // 清除所有现有的标记点
      const markers = document.getElementsByClassName("marker");
      while (markers.length > 0) {
        markers[0].remove();
      }

      // 重新添加所有标记点
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
      alert("删除标记点时出现错误");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">
            正在验证登录状态...
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
            需要登录
          </h1>
          <p className="text-gray-600 mb-6">
            您需要登录才能创建旅行计划。请先登录您的账户。
          </p>
          <Link href="/login">
            <Button className="bg-[#35b368] hover:bg-[#2d9a5a] text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              前往登录
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
          行程规划
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
          地图视图
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

const TravelPlan = () => {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-4">
            正在加载旅行计划...
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#35b368] mx-auto"></div>
        </div>
      </div>
    }>
      <TravelPlanWithSearchParams />
    </Suspense>
  );
};

export default TravelPlan;
