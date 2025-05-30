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
      tracks.forEach((track: any) => {
        addMarkerToMap(track.type, track.lng, track.lat);
      });
    }
  };

  const openCreateMarkerDialogHandle = () => {
    setOpenCreateMarkerDialog(true);
  };

  const onOpenDialogChange = (open: boolean) => {
    setOpenCreateMarkerDialog(open);
  };

  const addMarkerToMap = (type: string, lng: string, lat: string) => {
    if (!mapInstance) return;
    const el = document.createElement("div");
    el.className = "marker";
    el.style.backgroundImage = `url('/markers/resized/${type}.png')`;
    el.style.width = "50px";
    el.style.height = "50px";
    el.style.backgroundSize = "cover";

    new mapboxgl.Marker({
      element: el,
      anchor: "bottom",
      offset: [0, 0],
    })
      .setLngLat([parseFloat(lng), parseFloat(lat)])
      .addTo(mapInstance);

    mapInstance.getCanvas().style.cursor = "grab";
  };

  const addToTracks = (title: string, description: string) => {
    addMarkerToMap(
      currentTrackRef?.current?.type,
      currentTrackRef?.current?.lng,
      currentTrackRef?.current?.lat
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

  const createTracksPath = () => {
    if (tracks.length === 0) {
      alert("Please add markers first to generate a path!");
      return;
    }

    if (!mapInstance) return;

    // Remove existing path if any
    const existingPath = mapInstance.getSource("route");
    if (existingPath) {
      mapInstance.removeLayer("route");
      mapInstance.removeSource("route");
    }

    const coordinates = tracks?.map((track: any) => [
      parseFloat(track.lng),
      parseFloat(track.lat),
    ]);

    mapInstance.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      },
    });

    mapInstance.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#18a45b",
        "line-width": 8,
        "line-opacity": 1,
      },
    });
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
