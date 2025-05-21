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

  const createTracksPath = () => {
    if(tracks.length === 0) {
      alert('先添加标记点才能生成路径哟！')
      return;
    }
    const overlays = mapInstance.getOverlays(); // [2,3](@ref)
    overlays.forEach((overlay: any) => {
      if (overlay instanceof (window as any).BMapGL.Polyline) {
        mapInstance.removeOverlay(overlay); // [2,5](@ref)
      }
    });

    const points = tracks.map((track: any) => {
      return new (window as any).BMapGL.Point(track.lng, track.lat);
    });

    const polyline = new (window as any).BMapGL.Polyline(points, {
      enableEditing: false, //是否启用线编辑，默认为false
      enableClicking: true, //是否响应点击事件，默认为true
      // strokeColor: "#18a45b", //折线颜色
      strokeTexture: {
        url: "/markers/lineArrowRight.png", // 箭头纹理图路径
        width: 16, // 图片宽度（需为2的n次方）
        height: 64, // 图片高度（需为2的n次方）
      },
      strokeWeight: 10, //折线的宽度，以像素为单位
      strokeOpacity:1, //折线的透明度，取值范围0 - 1

    });

    mapInstance.addOverlay(polyline);
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
