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

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const TravelPlan = () => {
  const mapInstance = useMapStore((state) => state.mapboxInstance);
  const currentTrackRef = useRef<any>({});
  const [tracks, setTracks] = useState<DayTrack[]>([]);
  const [createMarkerDialogIsOpen, setOpenCreateMarkerDialog] =
    useState<any>(false);
  const [routeProfile, setRouteProfile] = useState<string>("driving");
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化数据
  useEffect(() => {
    if (isInitialized) return;
    
    const savedTracks = localStorage?.getItem("currentTracks");
    if (savedTracks) {
      try {
        const parsedTracks = JSON.parse(savedTracks);
        if (Array.isArray(parsedTracks) && parsedTracks.length > 0) {
          setTracks(parsedTracks);
        } else {
          // 如果没有保存的数据，创建一个初始的行程日
          setTracks([{
            day: 'Day 1',
            dayText: '第1天',
            description: '',
            tracks: []
          }]);
        }
      } catch (error) {
        console.error("Error parsing saved tracks:", error);
        // 如果解析出错，创建一个初始的行程日
        setTracks([{
          day: 'Day 1',
          dayText: '第1天',
          description: '',
          tracks: []
        }]);
      }
    } else {
      // 如果没有保存的数据，创建一个初始的行程日
      setTracks([{
        day: 'Day 1',
        dayText: '第1天',
        description: '',
        tracks: []
      }]);
    }
    setIsInitialized(true);
  }, [isInitialized]);

  // 保存数据
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

  // 更新地图
  useEffect(() => {
    if (!isInitialized || !mapInstance) return;
    onLoadMap();
  }, [tracks, mapInstance, isInitialized]);

  const onLoadMap = () => {
    if (!mapInstance) return;

    // 清除所有现有的标记点
    const markers = document.getElementsByClassName("marker");
    while (markers.length > 0) {
      markers[0].remove();
    }

    // 清除所有现有的路径和箭头
    const layers = mapInstance.getStyle().layers;
    if (layers) {
      layers.forEach((layer: any) => {
        if (
          layer.id.startsWith("route-segment-") ||
          layer.id.startsWith("route-arrows-")
        ) {
          if (mapInstance.getLayer(layer.id)) mapInstance.removeLayer(layer.id);
        }
      });
    }
    const sources = mapInstance.getStyle().sources;
    Object.keys(sources).forEach((sourceId) => {
      if (sourceId.startsWith("route-segment-")) {
        if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
      }
    });

    // 重新添加所有标记点
    if (tracks?.length) {
      tracks.forEach((dayTrack: DayTrack, dayIndex: number) => {
        dayTrack.tracks.forEach((track: any, idx: number) => {
          addMarkerToMap(
            track.type,
            track.location.lng,
            track.location.lat,
            `${dayIndex + 1}-${idx + 1}`
          );
        });
      });
    }
  };

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
      labelEl.style.fontSize = "16px";
      labelEl.style.fontWeight = "bold";
      labelEl.style.padding = "2px 8px";
      labelEl.style.borderRadius = "12px";
      labelEl.style.pointerEvents = "none";
      el.appendChild(labelEl);
    }

    const marker = new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
      offset: [0, 0],
    })
      .setLngLat([parseFloat(lng), parseFloat(lat)])
      .addTo(mapInstance);

    if (mapInstance.getCanvas()?.style) {
      mapInstance.getCanvas().style.cursor = "grab";
    }

    return marker;
  };

  const addToTracks = (title: string, description: string) => {
    if (!currentTrackRef.current?.location?.lng) return;

    const newTracks = _.cloneDeep(tracks);
    if (newTracks.length === 0) {
      // 如果没有行程日，创建一个
      newTracks.push({
        day: 'Day 1',
        dayText: '第1天',
        description: '',
        tracks: []
      });
    }
    
    newTracks[currentDayIndex].tracks.push({
      ...currentTrackRef.current,
      title,
      description,
    });

    setTracks(newTracks);
    addMarkerToMap(
      currentTrackRef.current.type,
      currentTrackRef.current.location.lng,
      currentTrackRef.current.location.lat,
      `${currentDayIndex + 1}-${newTracks[currentDayIndex].tracks.length}`
    );

    currentTrackRef.current = {};
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

    // 清理旧的路径和箭头
    const layers = mapInstance.getStyle().layers;
    if (layers) {
      layers.forEach((layer: any) => {
        if (
          layer.id.startsWith("route-segment-") ||
          layer.id.startsWith("route-arrows-")
        ) {
          if (mapInstance.getLayer(layer.id)) mapInstance.removeLayer(layer.id);
        }
      });
    }
    const sources = mapInstance.getStyle().sources;
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

    const dayTracks = tracks[currentDayIndex].tracks;
    if (dayTracks.length < 2) {
      alert("请至少添加两个标记点来生成路径！");
      return;
    }

    // 依次请求每一段的 directions
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
    const layers = mapInstance.getStyle().layers;
    if (layers) {
      layers.forEach((layer: any) => {
        if (
          layer.id.startsWith("route-segment-") ||
          layer.id.startsWith("route-arrows-")
        ) {
          if (mapInstance.getLayer(layer.id)) mapInstance.removeLayer(layer.id);
        }
      });
    }
    const sources = mapInstance.getStyle().sources;
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
      const dayTracks = tracks[dayIndex].tracks;
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
    setTracks(newTracks);
  };

  const handleDeleteTrack = (dayIndex: number, trackIndex: number) => {
    const newTracks = _.cloneDeep(tracks);
    newTracks[dayIndex].tracks.splice(trackIndex, 1);
    setTracks(newTracks);
  };

  return (
    <div className={cn("w-full h-full flex")}>
      <CreateMarkerDialog
        onOpenChange={onOpenDialogChange}
        open={createMarkerDialogIsOpen}
        setCreateMarkerDialogDisplayStatus={setOpenCreateMarkerDialog}
        onconfirm={addToTracks}
      />
      <TravelTracks
        createTracksPath={createTracksPath}
        createAllTracksPath={createAllTracksPath}
        tracks={tracks}
        onTracksChange={handleTracksChange}
        onDeleteTrack={handleDeleteTrack}
        currentDayIndex={currentDayIndex}
        onDaySelect={setCurrentDayIndex}
      />
      <MapboxMap
        className={cn("grow")}
        onAddOneMarker={onAddOneMarker}
        onLoadMap={onLoadMap}
        createMarkerDialogIsOpen={createMarkerDialogIsOpen}
        openCreateMarkerDialog={openCreateMarkerDialogHandle}
      />
    </div>
  );
};

export default TravelPlan;
