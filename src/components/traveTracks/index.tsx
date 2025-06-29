"use client";

import { useState, Suspense, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
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
import { http } from "@/lib/http";
import { useAuthStore } from "@/store/authStore";
import { useAuth0 } from "@auth0/auth0-react";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  className?: string;
  tracks: DayTrack[];
  createTracksPath?: (mode: string) => void;
  onTracksChange?: (newTracks: DayTrack[]) => void;
  onDeleteTrack?: (dayIndex: number, trackIndex: number) => void;
  currentDayIndex: number;
  onDaySelect: (dayIndex: number) => void;
  createAllTracksPath?: (mode: string) => void;
  currentPacket?: any;
  onPacketUpdate?: (packet: any) => void;
  packetName?: string;
  packetDescription?: string;
  onPacketNameChange?: (name: string) => void;
  onPacketDescriptionChange?: (description: string) => void;
}

const TravelTracksWithSearchParams: React.FC<Props> = ({
  className,
  tracks,
  onTracksChange,
  onDeleteTrack,
  currentDayIndex,
  onDaySelect,
  createAllTracksPath,
  currentPacket,
  onPacketUpdate,
  packetName = "我的旅行计划",
  packetDescription = "精心规划的旅行路线",
  onPacketNameChange,
  onPacketDescriptionChange,
  ...props
}) => {
  const [transportMode, setTransportMode] = useState<string>("driving");
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayTitle, setDayTitle] = useState("");
  const [dayDescription, setDayDescription] = useState("");
  const [isEditingPacket, setIsEditingPacket] = useState(false);
  const [tempPacketName, setTempPacketName] = useState(packetName);
  const [tempPacketDescription, setTempPacketDescription] = useState(packetDescription);
  const { getAccessTokenSilently } = useAuth0();
  const router = useRouter();
  const searchParams = useSearchParams();

  // 同步临时编辑状态
  useEffect(() => {
    setTempPacketName(packetName);
    setTempPacketDescription(packetDescription);
  }, [packetName, packetDescription]);

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

  // 数据映射函数：将前端数据结构转换为后端需要的结构
  const mapToBackendFormat = (tracks: DayTrack[], isUpdate: boolean = false) => {
    if (isUpdate && currentPacket) {
      // 更新模式：保留原有结构并更新数据
      return {
        ...currentPacket,
        name: packetName || currentPacket.name || "我的旅行计划",
        description: packetDescription || currentPacket.description || "精心规划的旅行路线",
        cost: currentPacket.cost || "0.00",
        currencyCode: currentPacket.currencyCode || "CNY",
        updatedAt: new Date().toISOString(),
        itineraryDays: tracks.map((track, index) => {
          const existingDay = currentPacket.itineraryDays?.[index];
          return {
            ...existingDay,
            name: track.dayText || track.day,
            description: track.description || "",
            dayNumber: String(index + 1),
            sortOrder: index,
            markers: track.markers?.map((marker, markerIndex) => {
              const existingMarker = existingDay?.markers?.[markerIndex];
              return {
                ...existingMarker,
                type: marker.type,
                location: {
                  lng: String(marker.location.lng),
                  lat: String(marker.location.lat)
                },
                title: marker.title,
                description: marker.description || "",
                sortOrder: markerIndex
              };
            }) || []
          };
        })
      };
    } else {
      // 创建模式：简洁的数据结构
      return {
        name: packetName || "我的旅行计划",
        description: packetDescription || "精心规划的旅行路线",
        cost: "0.00",
        currencyCode: "CNY",
        itineraryDays: tracks.map((track, index) => ({
          day: track.day,
          dayText: track.dayText || track.day,
          description: track.description || "",
          markers: track.markers?.map((marker, markerIndex) => ({
            type: marker.type,
            location: {
              lng: String(marker.location.lng),
              lat: String(marker.location.lat)
            },
            title: marker.title,
            description: marker.description || ""
          })) || []
        }))
      };
    }
  };

  const saveAllItinerary = async () => {
    try {
      // 验证数据
      if (!Array.isArray(tracks) || tracks.length === 0) {
        alert("没有行程数据可保存");
        return;
      }

      // 检查是否有有效的标记点
      const hasValidMarkers = tracks.some(track => 
        track && Array.isArray(track.markers) && track.markers.length > 0
      );
      
      if (!hasValidMarkers) {
        alert("请至少添加一些行程标记点后再保存");
        return;
      }

      // 确保有token
      let token = useAuthStore.getState().token;
      if (!token) {
        token = await getAccessTokenSilently();
        useAuthStore.getState().setToken(token);
      }

      console.log("Saving itinerary:", tracks);
      
      const isUpdate = !!currentPacket?.id;
      const payload = mapToBackendFormat(tracks, isUpdate);
      
      let response;
      if (isUpdate) {
        // 更新现有packet
        response = await http.put(`/api/packets/${currentPacket.id}`, payload);
        console.log("Update response:", response);
        alert("行程更新成功！");
      } else {
        // 创建新packet
        response = await http.post("/api/packets", payload);
        console.log("Create response:", response);
        
        if (response && (response as any).data?.id) {
          const newPacketId = (response as any).data.id;
          
          try {
            // 创建成功后，重新获取完整的packet数据以确保所有ID正确
            const fullPacketResponse = await http.get(`/api/packets/${newPacketId}`);
            console.log("Full packet data:", fullPacketResponse);
            
            if (fullPacketResponse && (fullPacketResponse as any).data) {
              // 更新当前packet状态为完整数据
              onPacketUpdate?.((fullPacketResponse as any).data);
              
              // 更新URL，添加packetId参数
              const newUrl = `${window.location.pathname}?packetId=${newPacketId}`;
              router.push(newUrl);
              
              alert("行程创建成功！");
            } else {
              // 如果获取完整数据失败，至少更新基本信息
              onPacketUpdate?.((response as any).data);
              const newUrl = `${window.location.pathname}?packetId=${newPacketId}`;
              router.push(newUrl);
              alert("行程创建成功！");
            }
          } catch (getError) {
            console.error("Error fetching full packet data:", getError);
            // 如果获取完整数据失败，至少更新基本信息
            onPacketUpdate?.((response as any).data);
            const newUrl = `${window.location.pathname}?packetId=${newPacketId}`;
            router.push(newUrl);
            alert("行程创建成功！");
          }
        } else {
          alert("行程创建成功，但未获取到ID");
        }
      }
      
    } catch (error) {
      console.error("Error saving itinerary:", error);
      
      if (error instanceof Error) {
        if (error.message.includes('non-JSON response')) {
          alert("服务器暂时不可用，请稍后重试");
        } else if (error.message.includes('Network error')) {
          alert("网络连接错误，请检查网络后重试");
        } else if (error.message.includes('401')) {
          alert("认证失败，请重新登录");
        } else {
          alert(`保存失败: ${error.message}`);
        }
      } else {
        alert("保存行程时出现未知错误，请重试");
      }
    }
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

  const handleSavePacketEdit = () => {
    onPacketNameChange?.(tempPacketName);
    onPacketDescriptionChange?.(tempPacketDescription);
    setIsEditingPacket(false);
  };

  const handleCancelPacketEdit = () => {
    setTempPacketName(packetName);
    setTempPacketDescription(packetDescription);
    setIsEditingPacket(false);
  };

  return (
    <div className="w-full md:w-[400px] h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-3 md:p-4 border-b border-gray-200">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{packetName}</h2>
              <p className="text-sm text-gray-600 truncate">{packetDescription}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempPacketName(packetName);
                  setTempPacketDescription(packetDescription);
                  setIsEditingPacket(true);
                }}
                className="flex items-center gap-1 flex-1 sm:flex-none"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">编辑计划</span>
                <span className="sm:hidden">编辑</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={saveAllItinerary}
                className="flex items-center gap-1 bg-[#35b368] hover:bg-[#2d9a5a] flex-1 sm:flex-none"
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Save</span>
                <span className="sm:hidden">Save</span>
              </Button>
            </div>
          </div>
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

      {/* Packet Edit Dialog */}
      <Dialog open={isEditingPacket} onOpenChange={setIsEditingPacket}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑旅行计划</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="packet-name" className="text-sm font-medium">
                计划名称
              </label>
              <Input
                id="packet-name"
                value={tempPacketName}
                onChange={(e) => setTempPacketName(e.target.value)}
                placeholder="输入旅行计划名称"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="packet-description" className="text-sm font-medium">
                计划描述
              </label>
              <Textarea
                id="packet-description"
                value={tempPacketDescription}
                onChange={(e) => setTempPacketDescription(e.target.value)}
                placeholder="输入旅行计划描述"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelPacketEdit}>
              取消
            </Button>
            <Button onClick={handleSavePacketEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TravelTracks: React.FC<Props> = (props) => {
  return (
    <Suspense fallback={
      <div className="w-full md:w-[400px] h-full flex items-center justify-center bg-white border-r border-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#35b368] mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">正在加载...</p>
        </div>
      </div>
    }>
      <TravelTracksWithSearchParams {...props} />
    </Suspense>
  );
};

export default TravelTracks;
