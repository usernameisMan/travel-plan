"use client";
import { Inter as FontSans } from "next/font/google";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Script from "next/script";
import BaiduMap from "@/components/baiduMap";
import TravelTracks from "@/components/traveTracks";
import CreateMarkerDialog from "@/components/dialogs/createMarkerDialog";
import { useMapStore } from "@/app/store/mapStore";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const TravelPlan = () => {
  const mapInstance = useMapStore((state) => state.baiduInstance);
  const currentTrackRef = useRef<any>({});
  const [tracks, setTracks] = useState<any>([]);
  const [createMarkerDialogIsOpen, setOpenCreateMarkerDialog] =
    useState<any>(false);

  const openCreateMarkerDialogHandle = () => {
    setOpenCreateMarkerDialog(true);
  };

  const onOpenDialogChange = (open: boolean) => {
    setOpenCreateMarkerDialog(open);
  };

  const addToTracks = (title: string, description: string) => {
    const myIcon = new (window as any).BMapGL.Icon(
      `/markers/resized/${currentTrackRef.current.type}.png`,
      new (window as any).BMapGL.Size(50, 50),
      {
        anchor: new (window as any).BMapGL.Size(25, 51),
      }
    );

    const pt = new (window as any).BMapGL.Point(
      currentTrackRef.current.lng,
      currentTrackRef.current.lat
    );

    const marker = new (window as any).BMapGL.Marker(pt, {
      icon: myIcon,
    });

    mapInstance.addOverlay(marker);
    mapInstance.setDefaultCursor("grab");

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
        tracks={tracks} 
        onTracksChange={handleTracksChange}
      />
      <BaiduMap
        className={cn("grow")}
        onAddOneMarker={onAddOneMarker}
        createMarkerDialogIsOpen={createMarkerDialogIsOpen}
        openCreateMarkerDialog={openCreateMarkerDialogHandle}
      />
    </div>
  );
};

export default TravelPlan;
