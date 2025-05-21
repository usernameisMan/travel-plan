import { useState } from "react";
import Track from "./Track";
import { cn } from "@/lib/utils";
import { ScrollArea, Viewport } from "@radix-ui/react-scroll-area";
import { Button } from "../ui/button";

interface Props {
  className?: string;
  tracks: any[];
  createTracksPath?: () => void;
  onTracksChange?: (newTracks: any[]) => void;
}

const TravelTracks: React.FC<Props> = ({
  className,
  tracks,
  onTracksChange,
  ...props
}) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
    // 添加一些透明度效果
    (e.target as HTMLElement).style.opacity = "0.4";
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
          <h4 className="mb-2 text-sm font-medium leading-none">路径标记</h4>
          <p className=" text-[12px] text-[#999] font-medium leading-none">
              拖拽标记点可以调整顺序
          </p>
          <div className="flex items-center justify-end">
            <Button variant={"default"} onClick={props.createTracksPath}>生成路径</Button>
          </div>
          <div className="space-y-2 mt-4">
            {tracks.map((track, index) => (
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
                <Track track={track} step={index} />
              </div>
            ))}
          </div>
        </div>
      </Viewport>
    </ScrollArea>
  );
};

export default TravelTracks;
