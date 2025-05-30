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

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const TravelPlan = () => {
  const mapInstance = useMapStore((state) => state.mapboxInstance);
  const currentTrackRef = useRef<any>({});
  const [tracks, setTracks] = useState<any>(false);
  const [createMarkerDialogIsOpen, setOpenCreateMarkerDialog] =
    useState<any>(false);
  const [routeProfile, setRouteProfile] = useState<string>('driving');

  useEffect(() => {
    const savedTracks = localStorage?.getItem("currentTracks");
    if (savedTracks) {
      setTracks(JSON.parse(savedTracks));
    }
  }, []);

  useEffect(() => {
    console.log("currentTrackRef", currentTrackRef);
    if (_.isArray(tracks)) {
      localStorage?.setItem("currentTracks", JSON.stringify(tracks));
    }
  }, [tracks]);

  const onLoadMap = () => {
    if (tracks?.length) {
      tracks.forEach((track: any, idx: number) => {
        addMarkerToMap(track.type, track.lng, track.lat, idx);
      });
    }
  };

  const openCreateMarkerDialogHandle = () => {
    setOpenCreateMarkerDialog(true);
  };

  const onOpenDialogChange = (open: boolean) => {
    setOpenCreateMarkerDialog(open);
  };

  const addMarkerToMap = (type: string, lng: string, lat: string, idx?: number) => {
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

    if (typeof idx === 'number') {
      const label = document.createElement('div');
      label.innerText = (idx + 1).toString();
      label.style.position = 'absolute';
      label.style.left = '50%';
      label.style.top = '100%';
      label.style.transform = 'translateX(-50%)';
      label.style.marginTop = '2px';
      label.style.background = 'rgba(0,0,0,0.7)';
      label.style.color = '#fff';
      label.style.fontSize = '16px';
      label.style.fontWeight = 'bold';
      label.style.padding = '2px 8px';
      label.style.borderRadius = '12px';
      label.style.pointerEvents = 'none';
      el.appendChild(label);
    }

    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
      offset: [0, 0],
    })
      .setLngLat([parseFloat(lng), parseFloat(lat)])
      .addTo(mapInstance);
    if (mapInstance.getCanvas()?.style) {
      mapInstance.getCanvas().style.cursor = "grab";
    }
  };

  const addToTracks = (title: string, description: string) => {
    const idx = Array.isArray(tracks) ? tracks.length : 0;
    addMarkerToMap(
      currentTrackRef?.current?.type,
      currentTrackRef?.current?.lng,
      currentTrackRef?.current?.lat,
      idx
    );

    setTracks((prev: any) => {
      if (!currentTrackRef.current.lng) {
        return prev;
      }

      if (!_.isBoolean(prev)) {
        return [
          ...prev,
          {
            ...currentTrackRef.current,
            title,
            description,
          },
        ];
      }
      return [
        {
          ...currentTrackRef.current,
          title,
          description,
        },
      ];
    });

    currentTrackRef.current = {};
  };

  const onAddOneMarker = useCallback(
    (fileName: string, lng: string, lat: string) => {
      currentTrackRef.current = {
        type: fileName,
        lng,
        lat,
      };
    },
    []
  );

  const createTracksPath = async (mode: string) => {
    let effectiveProfile = mode;
    if (mode === 'transit') {
      alert('公交路线暂不支持，已为你用步行路线代替。');
      effectiveProfile = 'walking';
    }
    if (!Array.isArray(tracks) || tracks.length < 2) {
      alert("Please add at least two markers to generate a path!");
      return;
    }
    if (!mapInstance) return;

    // 清理旧的路径和箭头
    const layers = mapInstance.getStyle().layers;
    if (layers) {
      layers.forEach((layer: any) => {
        if (layer.id.startsWith('route-segment-') || layer.id.startsWith('route-arrows-')) {
          if (mapInstance.getLayer(layer.id)) mapInstance.removeLayer(layer.id);
        }
      });
    }
    const sources = mapInstance.getStyle().sources;
    Object.keys(sources).forEach((sourceId) => {
      if (sourceId.startsWith('route-segment-')) {
        if (mapInstance.getSource(sourceId)) mapInstance.removeSource(sourceId);
      }
    });

    // 颜色数组
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080', '#008080', '#FFC0CB', '#A52A2A', '#808080', '#000000'];

    // 依次请求每一段的 directions
    for (let i = 0; i < tracks.length - 1; i++) {
      const from = tracks[i];
      const to = tracks[i + 1];
      const waypoints = `${parseFloat(from.lng)},${parseFloat(from.lat)};${parseFloat(to.lng)},${parseFloat(to.lat)}`;
      try {
        const response = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/${effectiveProfile}/${waypoints}?geometries=geojson&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        const data = await response.json();
        if (!data.routes || data.routes.length === 0) continue;
        const geometry = data.routes[0].geometry;
        const segmentSourceId = `route-segment-${i}`;
        // 添加 source
        mapInstance.addSource(segmentSourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry
          }
        });
        // 添加线条 layer
        mapInstance.addLayer({
          id: segmentSourceId,
          type: "line",
          source: segmentSourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": colors[i % colors.length],
            "line-width": 8,
            "line-opacity": 1
          }
        });
        // 添加箭头 layer
        mapInstance.addLayer({
          id: `route-arrows-${i}`,
          type: "symbol",
          source: segmentSourceId,
          layout: {
            "symbol-placement": "line",
            "text-field": `${i + 1}>>`,
            "text-size": 24,
            "text-allow-overlap": true,
            "text-ignore-placement": true,
            "text-keep-upright": false,
            "symbol-spacing": 20
          },
          paint: {
            "text-color": colors[i % colors.length],
            "text-halo-color": "#ffffff",
            "text-halo-width": 2,
            "text-opacity": 0.9
          }
        });
      } catch (error) {
        console.error('Error generating segment', i, error);
      }
    }
  };

  const handleTracksChange = (newTracks: any[]) => {
    setTracks(newTracks);
  };

  const handleDeleteTrack = (index: number) => {
    setTracks((prev: any) => {
      const newTracks = [...prev];
      newTracks.splice(index, 1);
      return newTracks;
    });
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
        tracks={tracks}
        onTracksChange={handleTracksChange}
        onDeleteTrack={handleDeleteTrack}
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
