'use client';

import { useState } from "react";
import Track, { DayTrack } from "./Track";
import { cn } from "@/lib/utils";
import { ScrollArea, Viewport } from "@radix-ui/react-scroll-area";
import { Button } from "../ui/button";
import _ from "lodash";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


interface Props {
  className?: string;
  tracks: DayTrack[];
  createTracksPath?: (mode: string) => void;
  onTracksChange?: (newTracks: any[]) => void;
  onDeleteTrack?: (index: number) => void;
}

const TravelTracks: React.FC<Props> = ({
  className,
  tracks,
  onTracksChange,
  onDeleteTrack,
  ...props
}) => {
  const [currentDay, setCurrentDay] = useState<DayTrack | null>(null);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [transportMode, setTransportMode] = useState<string>("driving");

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    // Add some opacity effect
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedItem(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const newTracks = [...tracks];
    const draggedTrack = newTracks[draggedItem];
    newTracks.splice(draggedItem, 1);
    newTracks.splice(index, 0, draggedTrack);

    onTracksChange?.(newTracks);
  };

  return (
    <ScrollArea className="h-full w-[400px] overflow-y-auto rounded-md border p-4">
      <Viewport asChild className={cn("w-full h-full")}>
        <div>
          <h4 className="mb-1 text-sm font-medium leading-none">Path Markers</h4>
          <p className=" text-[12px] text-[#999] font-medium leading-none">
            Drag markers to adjust their order
          </p>
          <div className="mt-1 flex items-center justify-end gap-2">
            <Select 
              defaultValue="driving" 
              value={transportMode}
              onValueChange={(value: string) => setTransportMode(value)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="walking">步行</SelectItem>
                <SelectItem value="cycling">骑行</SelectItem>
                <SelectItem value="driving">驾车</SelectItem>
                <SelectItem value="transit">公交</SelectItem>
              </SelectContent>
            </Select>
            <Button variant={"default"} onClick={() => props.createTracksPath?.(transportMode)}>Generate Path</Button>
          </div>
          <div className="space-y-2 mt-4">
            {_.isArray(tracks) && tracks?.map((track, index) => (
              <div
                key={`${index}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  "cursor-move transition-all duration-200",
                  draggedItem === index && "opacity-50"
                )}
              >
                <Track track={track} step={index} onDelete={() => onDeleteTrack?.(index)} />
              </div>
            ))}
          </div>
        </div>
      </Viewport>
    </ScrollArea>
  );
};

export default TravelTracks;
