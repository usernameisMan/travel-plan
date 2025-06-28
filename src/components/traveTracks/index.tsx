"use client";

import { useState } from "react";
import Track, { DayTrack } from "./Track";
import { cn } from "@/lib/utils";
import { ScrollArea, Viewport } from "@radix-ui/react-scroll-area";
import { Button } from "../ui/button";
import _ from "lodash";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Pencil, Trash2, Map, Save } from "lucide-react";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableTrack } from "./SortableTrack";
import { httpRequest } from "@/lib/http";

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = active.id as number;
    const newIndex = over.id as number;

    const newTracks = _.cloneDeep(tracks);
    if (!newTracks[currentDayIndex] || !Array.isArray(newTracks[currentDayIndex].markers)) {
      return;
    }
    
    const currentDayTracks = newTracks[currentDayIndex].markers;

    // 使用数组方法直接移动元素
    const [movedItem] = currentDayTracks.splice(oldIndex, 1);
    currentDayTracks.splice(newIndex, 0, movedItem);

    // 确保触发父组件的更新
    onTracksChange?.(newTracks);

    // 打印日志以便调试
    console.log("Track moved:", { oldIndex, newIndex, currentDayIndex });
    console.log(
      "New tracks order:",
      newTracks[currentDayIndex].markers.map((t) => t.title)
    );
  };

  const addNewDay = () => {
    const newDay: DayTrack = {
      day: `Day ${tracks.length + 1}`,
      dayText: `第${tracks.length + 1}天`,
      description: "",
      markers: [],
    };
    onTracksChange?.([...tracks, newDay]);
  };

  const saveAllItinerary = async () => {
    // call api
    const newTracks = _.cloneDeep(tracks);
    const response = await httpRequest("/api/itinerary", {
      method: "POST",
      body: JSON.stringify(newTracks),
    });
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
    <div className="w-full md:w-[400px] h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-3 md:p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
          <h2 className="text-lg font-semibold">行程安排</h2>
          <Button
            variant="default"
            size="sm"
            onClick={saveAllItinerary}
            className="flex items-center gap-1 bg-[#35b368] hover:bg-[#2d9a5a] w-full sm:w-auto"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Save All Itinerary</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={addNewDay}
              className="flex items-center justify-center gap-1 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">添加行程日</span>
              <span className="sm:hidden">添加日程</span>
            </Button>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={transportMode} onValueChange={setTransportMode}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="选择交通方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="driving">驾车</SelectItem>
                  <SelectItem value="walking">步行</SelectItem>
                  <SelectItem value="cycling">骑行</SelectItem>
                  <SelectItem value="transit">公交</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => createAllTracksPath?.(transportMode)}
                className="flex items-center gap-1 whitespace-nowrap"
              >
                <Map className="h-4 w-4" />
                <span className="hidden lg:inline">生成总路线</span>
                <span className="lg:hidden">路线</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 mt-3 scrollbar-hide">
          {Array.isArray(tracks) && tracks.map((dayTrack, index) => (
            <Button
              key={index}
              variant={currentDayIndex === index ? "default" : "outline"}
              size="sm"
              onClick={() => onDaySelect(index)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {dayTrack.dayText}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {tracks.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 md:p-4 border-b border-gray-200">
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
                      <Button size="sm" onClick={() => saveDayEdit()}>
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
                      <h3 className="text-lg font-medium truncate">
                        {tracks[currentDayIndex].dayText}
                      </h3>
                      <div className="flex gap-1 flex-shrink-0">
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

            <div className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                <h4 className="font-medium">行程点</h4>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select
                    value={transportMode}
                    onValueChange={setTransportMode}
                  >
                    <SelectTrigger className="w-full sm:w-[120px]">
                      <SelectValue placeholder="选择交通方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driving">驾车</SelectItem>
                      <SelectItem value="walking">步行</SelectItem>
                      <SelectItem value="cycling">骑行</SelectItem>
                      <SelectItem value="transit">公交</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => props.createTracksPath?.(transportMode)}
                    className="flex items-center gap-1 whitespace-nowrap"
                  >
                    <Map className="h-4 w-4" />
                    <span className="hidden lg:inline">生成路径</span>
                    <span className="lg:hidden">路径</span>
                  </Button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={tracks[currentDayIndex] && Array.isArray(tracks[currentDayIndex].markers) 
                    ? tracks[currentDayIndex].markers.map((_, index) => index)
                    : []
                  }
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {tracks[currentDayIndex] && Array.isArray(tracks[currentDayIndex].markers) 
                      ? tracks[currentDayIndex].markers.map((track, index) => (
                          <SortableTrack
                            key={index}
                            id={index}
                            track={track}
                            onDelete={() => onDeleteTrack?.(currentDayIndex, index)}
                          />
                        ))
                      : <div className="text-gray-500 text-sm">No tracks available</div>
                    }
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
