"use client";
import { Inter as FontSans } from "next/font/google";
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Script from "next/script";
import BaiduMap from "@/components/baiduMap";
import TravelTracks from "@/components/traveTracks";
import CreateMarkerDialog from "@/components/dialogs/createMarkerDialog";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const TravelPlan = () => {
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
    setTracks((prev: any) => {
      prev[prev.length - 1].title = title;
      prev[prev.length - 1].description = description;
      return [...prev];
    });
  };

  const onAddOneMarker = useCallback(
    (fileName: string, lng: string, lat: string) => {
      setTracks((prev: any) => [
        ...prev,
        {
          type: fileName,
          lng,
          lat,
        },
      ]);
    },
    []
  );

  return (
    <div className={cn("w-full h-full flex")}>
      <CreateMarkerDialog
        onOpenChange={onOpenDialogChange}
        open={createMarkerDialogIsOpen}
        setCreateMarkerDialogDisplayStatus={setOpenCreateMarkerDialog}
        onconfirm={addToTracks}
      />
      <TravelTracks tracks={tracks} />
      <BaiduMap
        className={cn("grow")}
        onAddOneMarker={onAddOneMarker}
        tracks={tracks}
        createMarkerDialogIsOpen={createMarkerDialogIsOpen}
        openCreateMarkerDialog={openCreateMarkerDialogHandle}
      />
    </div>
  );
};

export default TravelPlan;
