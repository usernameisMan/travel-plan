'use client';

import { useState } from "react";
import Track, { DayTrack } from "./Track";
import { cn } from "@/lib/utils";
import { ScrollArea, Viewport } from "@radix-ui/react-scroll-area";
import { Button } from "../ui/button";
import _ from "lodash";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Plus, Pencil, Trash2, Map } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTrack } from "./SortableTrack";

interface Props {
  className?: string;
  tracks: DayTrack[];
  createTracksPath?: (mode: string) => void;
  onTracksChange?: (newTracks: DayTrack[]) => void;
  onDeleteTrack?: (dayIndex: number, trackIndex: number) => void;
  currentDayIndex: number;
  onDaySelect: (dayIndex: number) => void;
  createAllTracksPath?: (mode: string) => void;
}

const TravelTracks: React.FC<Props> = ({
  className,
  tracks,
  onTracksChange,
  onDeleteTrack,
  currentDayIndex,
  onDaySelect,
  createAllTracksPath,
  ...props
}) => {
  const [draggedItem, setDraggedItem] = useState<{ dayIndex: number; trackIndex: number } | null>(null);
  const [transportMode, setTransportMode] = useState<string>("driving");
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayTitle, setDayTitle] = useState("");
  const [dayDescription, setDayDescription] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (e: React.DragEvent, dayIndex: number, trackIndex: number) => {
    setDraggedItem({ dayIndex, trackIndex });
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnd = (event: any) => {
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
    <div className="w-[400px] h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">行程安排</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addNewDay}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              添加行程日
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createAllTracksPath?.(transportMode)}
              className="flex items-center gap-1"
            >
              <Map className="h-4 w-4" />
              生成总路线
            </Button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tracks.map((dayTrack, index) => (
            <Button
              key={index}
              variant={currentDayIndex === index ? "default" : "outline"}
              size="sm"
              onClick={() => onDaySelect(index)}
              className="whitespace-nowrap"
            >
              {dayTrack.dayText}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {tracks.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                {editingDay === currentDayIndex ? (
                  <div className="flex-1 mr-2">
                    <Input
                      value={dayTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setDayTitle(e.target.value)
                      }
                      className="mb-2"
                      placeholder="输入行程日标题"
                    />
                    <Textarea
                      value={dayDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setDayDescription(e.target.value)
                      }
                      placeholder="输入行程日描述"
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => saveDayEdit()}
                      >
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingDay(null)}
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium">{tracks[currentDayIndex].dayText}</h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditingDay(currentDayIndex)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {tracks.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteDay(currentDayIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    {tracks[currentDayIndex].description && (
                      <p className="text-sm text-gray-600 mb-4">
                        {tracks[currentDayIndex].description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">行程点</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => props.createTracksPath?.(transportMode)}
                  className="flex items-center gap-1"
                >
                  <Map className="h-4 w-4" />
                  生成路径
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={tracks[currentDayIndex].tracks.map((_, index) => index)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {tracks[currentDayIndex].tracks.map((track, index) => (
                      <SortableTrack
                        key={index}
                        id={index}
                        track={track}
                        onDelete={() => onDeleteTrack?.(currentDayIndex, index)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelTracks;
