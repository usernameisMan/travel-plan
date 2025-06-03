'use client';

import { useState } from "react";
import Track, { DayTrack } from "./Track";
import { cn } from "@/lib/utils";
import { ScrollArea, Viewport } from "@radix-ui/react-scroll-area";
import { Button } from "../ui/button";
import _ from "lodash";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

interface Props {
  className?: string;
  tracks: DayTrack[];
  createTracksPath?: (mode: string) => void;
  onTracksChange?: (newTracks: DayTrack[]) => void;
  onDeleteTrack?: (dayIndex: number, trackIndex: number) => void;
  currentDayIndex: number;
  onDaySelect: (dayIndex: number) => void;
}

const TravelTracks: React.FC<Props> = ({
  className,
  tracks,
  onTracksChange,
  onDeleteTrack,
  currentDayIndex,
  onDaySelect,
  ...props
}) => {
  const [draggedItem, setDraggedItem] = useState<{ dayIndex: number; trackIndex: number } | null>(null);
  const [transportMode, setTransportMode] = useState<string>("driving");
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayTitle, setDayTitle] = useState("");
  const [dayDescription, setDayDescription] = useState("");

  const handleDragStart = (e: React.DragEvent, dayIndex: number, trackIndex: number) => {
    setDraggedItem({ dayIndex, trackIndex });
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

  const handleDrop = (e: React.DragEvent, dayIndex: number, trackIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const newTracks = _.cloneDeep(tracks);
    const draggedTrack = newTracks[draggedItem.dayIndex].tracks[draggedItem.trackIndex];
    
    // Remove from original position
    newTracks[draggedItem.dayIndex].tracks.splice(draggedItem.trackIndex, 1);
    
    // Add to new position
    newTracks[dayIndex].tracks.splice(trackIndex, 0, draggedTrack);

    onTracksChange?.(newTracks);
  };

  const addNewDay = () => {
    const newDay: DayTrack = {
      day: `Day ${tracks.length + 1}`,
      dayText: `第${tracks.length + 1}天`,
      description: '',
      tracks: []
    };
    onTracksChange?.([...tracks, newDay]);
  };

  const startEditingDay = (dayIndex: number) => {
    setEditingDay(dayIndex);
    setDayTitle(tracks[dayIndex].dayText);
    setDayDescription(tracks[dayIndex].description);
  };

  const saveDayEdit = () => {
    if (editingDay === null) return;
    
    const newTracks = _.cloneDeep(tracks);
    newTracks[editingDay].dayText = dayTitle;
    newTracks[editingDay].description = dayDescription;
    
    onTracksChange?.(newTracks);
    setEditingDay(null);
  };

  const deleteDay = (dayIndex: number) => {
    const newTracks = _.cloneDeep(tracks);
    newTracks.splice(dayIndex, 1);
    onTracksChange?.(newTracks);
    if (currentDayIndex === dayIndex) {
      onDaySelect(Math.max(0, dayIndex - 1));
    }
  };

  return (
    <ScrollArea className="h-full w-[400px] overflow-y-auto rounded-md border p-4">
      <Viewport asChild className={cn("w-full h-full")}>
        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-medium leading-none">行程安排</h4>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={addNewDay}
              className="flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              添加新的一天
            </Button>
          </div>
          
          <div className="space-y-4">
            {tracks.map((dayTrack, dayIndex) => (
              <div 
                key={dayIndex} 
                className={cn(
                  "border rounded-lg p-3 cursor-pointer transition-all duration-200",
                  currentDayIndex === dayIndex && "border-blue-500 bg-blue-50"
                )}
                onClick={() => onDaySelect(dayIndex)}
              >
                <div className="flex justify-between items-center mb-2">
                  {editingDay === dayIndex ? (
                    <div className="flex-1 mr-2">
                      <Input
                        value={dayTitle}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDayTitle(e.target.value)}
                        className="mb-2"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                      <Textarea
                        value={dayDescription}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDayDescription(e.target.value)}
                        placeholder="添加描述..."
                        className="mb-2"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      />
                      <Button 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          saveDayEdit();
                        }}
                      >
                        保存
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{dayTrack.dayText}</h5>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingDay(dayIndex);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDay(dayIndex);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {dayTrack.description && (
                        <p className="text-sm text-gray-500 mt-1">{dayTrack.description}</p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
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
                    {currentDayIndex === dayIndex && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.createTracksPath?.(transportMode);
                        }}
                      >
                        生成路径
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {dayTrack.tracks.map((track, trackIndex) => (
                    <div
                      key={`${dayIndex}-${trackIndex}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, dayIndex, trackIndex)}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, dayIndex, trackIndex)}
                      className={cn(
                        "cursor-move transition-all duration-200",
                        draggedItem?.dayIndex === dayIndex && 
                        draggedItem?.trackIndex === trackIndex && 
                        "opacity-50"
                      )}
                    >
                      <Track 
                        track={track} 
                        step={trackIndex} 
                        onDelete={() => onDeleteTrack?.(dayIndex, trackIndex)} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Viewport>
    </ScrollArea>
  );
};

export default TravelTracks;
