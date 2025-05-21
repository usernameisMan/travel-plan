"use client";
import { Inter as FontSans } from "next/font/google";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import MapboxMap from "@/components/mapbox";
import TravelTracks from "@/components/traveTracks";
import CreateMarkerDialog from "@/components/dialogs/createMarkerDialog";
import { useMapStore } from "@/app/store/mapStore";
import mapboxgl from 'mapbox-gl';

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const TravelPlan = () => {
  const mapInstance = useMapStore((state) => state.mapboxInstance);
  const currentTrackRef = useRef<any>({});
  const [tracks, setTracks] = useState<any>([]);
  const [createMarkerDialogIsOpen, setOpenCreateMarkerDialog] = useState<any>(false);

  const openCreateMarkerDialogHandle = () => {
    setOpenCreateMarkerDialog(true);
  };

  const onOpenDialogChange = (open: boolean) => {
    setOpenCreateMarkerDialog(open);
  };

  const addToTracks = (title: string, description: string) => {
    if (!mapInstance) return;

    const el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = `url('/markers/resized/${currentTrackRef.current.type}.png')`;
    el.style.width = '50px';
    el.style.height = '50px';
    el.style.backgroundSize = 'cover';

    new mapboxgl.Marker(el)
      .setLngLat([parseFloat(currentTrackRef.current.lng), parseFloat(currentTrackRef.current.lat)])
      .addTo(mapInstance);

    mapInstance.getCanvas().style.cursor = 'grab';

    setTracks((prev: any) => {
      return [
        ...prev,
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

  const createTracksPath = () => {
    if (tracks.length === 0) {
      alert('先添加标记点才能生成路径哟！');
      return;
    }

    if (!mapInstance) return;

    // Remove existing path if any
    const existingPath = mapInstance.getSource('route');
    if (existingPath) {
      mapInstance.removeLayer('route');
      mapInstance.removeSource('route');
    }

    const coordinates = tracks.map((track: any) => [
      parseFloat(track.lng),
      parseFloat(track.lat)
    ]);

    mapInstance.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    });

    mapInstance.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#18a45b',
        'line-width': 8,
        'line-opacity': 1
      }
    });
  };

  const handleTracksChange = (newTracks: any[]) => {
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
        tracks={tracks}
        onTracksChange={handleTracksChange}
      />
      <MapboxMap
        className={cn("grow")}
        onAddOneMarker={onAddOneMarker}
        createMarkerDialogIsOpen={createMarkerDialogIsOpen}
        openCreateMarkerDialog={openCreateMarkerDialogHandle}
      />
    </div>
  );
};

export default TravelPlan;
