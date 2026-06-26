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
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";

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
  packetName = "My Travel Plan",
  packetDescription = "Carefully planned travel route",
  onPacketNameChange,
  onPacketDescriptionChange,
  ...props
}) => {
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  const [transportMode, setTransportMode] = useState<string>("driving");
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [dayTitle, setDayTitle] = useState("");
  const [dayDescription, setDayDescription] = useState("");
  const [isEditingPacket, setIsEditingPacket] = useState(false);
  const [tempPacketName, setTempPacketName] = useState(packetName);
  const [tempPacketDescription, setTempPacketDescription] =
    useState(packetDescription);
  const { getAccessTokenSilently } = useAuth0();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync temporary edit state
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
    if (
      !newTracks[currentDayIndex] ||
      !Array.isArray(newTracks[currentDayIndex].markers)
    ) {
      return;
    }

    const currentDayTracks = newTracks[currentDayIndex].markers;

    // Use array methods to move element directly
    const [movedItem] = currentDayTracks.splice(oldIndex, 1);
    currentDayTracks.splice(newIndex, 0, movedItem);

    // Ensure parent component update triggers
    onTracksChange?.(newTracks);

    // Log for debugging
    console.log("Track moved:", { oldIndex, newIndex, currentDayIndex });
    console.log(
      "New tracks order:",
      newTracks[currentDayIndex].markers.map((t) => t.title)
    );
  };

  const addNewDay = () => {
    const newDay: DayTrack = {
      day: `Day ${tracks.length + 1}`,
      dayText: `Day ${tracks.length + 1}`,
      description: "",
      markers: [],
    };
    onTracksChange?.([...tracks, newDay]);
  };

  // Data mapping function: Convert frontend data structure to backend required structure
  const mapToBackendFormat = (
    tracks: DayTrack[],
    isUpdate: boolean = false
  ) => {
    if (isUpdate && currentPacket) {
      // Update mode: Preserve original structure and update data
      return {
        ...currentPacket,
        name: packetName || currentPacket.name || "My Travel Plan",
        description:
          packetDescription ||
          currentPacket.description ||
          "Carefully planned travel route",
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
            markers:
              track.markers?.map((marker, markerIndex) => {
                const existingMarker = existingDay?.markers?.[markerIndex];
                return {
                  ...existingMarker,
                  type: marker.type,
                  location: {
                    lng: String(marker.location.lng),
                    lat: String(marker.location.lat),
                  },
                  title: marker.title,
                  description: marker.description || "",
                  sortOrder: markerIndex,
                };
              }) || [],
          };
        }),
      };
    } else {
      // Create mode: Clean data structure
      return {
        name: packetName || "My Travel Plan",
        description: packetDescription || "Carefully planned travel route",
        cost: "0.00",
        currencyCode: "CNY",
        itineraryDays: tracks.map((track, index) => ({
          day: track.day,
          dayText: track.dayText || track.day,
          description: track.description || "",
          markers:
            track.markers?.map((marker, markerIndex) => ({
              type: marker.type,
              location: {
                lng: String(marker.location.lng),
                lat: String(marker.location.lat),
              },
              title: marker.title,
              description: marker.description || "",
            })) || [],
        })),
      };
    }
  };

  const saveAllItinerary = async () => {
    try {
      // Validate data
      if (!Array.isArray(tracks) || tracks.length === 0) {
        alert(t.errorSaving);
        return;
      }

      // Check if there are valid markers
      const hasValidMarkers = tracks.some(
        (track) =>
          track && Array.isArray(track.markers) && track.markers.length > 0
      );

      if (!hasValidMarkers) {
        alert(t.errorSaving);
        return;
      }

      // Ensure token exists
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
        // Update existing packet
        response = await http.put(`/api/packets/${currentPacket.id}`, payload);
        console.log("Update response:", response);
        alert(t.updateSuccess);
      } else {
        // Create new packet
        response = await http.post("/api/packets", payload);
        console.log("Create response:", response);

        if (response && (response as any).data?.id) {
          const newPacketId = (response as any).data.id;

          try {
            // After successful creation, refetch complete packet data to ensure all IDs are correct
            const fullPacketResponse = await http.get(
              `/api/packets/${newPacketId}`
            );
            console.log("Full packet data:", fullPacketResponse);

            if (fullPacketResponse && (fullPacketResponse as any).data) {
              // Update current packet state to complete data
              onPacketUpdate?.((fullPacketResponse as any).data);

              // Update URL, add packetId parameter
              const newUrl = `${window.location.pathname}?packetId=${newPacketId}`;
              router.push(newUrl);

              alert(t.createSuccess);
            } else {
              // If fetching complete data fails, at least update basic info
              onPacketUpdate?.((response as any).data);
              const newUrl = `${window.location.pathname}?packetId=${newPacketId}`;
              router.push(newUrl);
              alert(t.createSuccess);
            }
          } catch (getError) {
            console.error("Error fetching full packet data:", getError);
            // If fetching complete data fails, at least update basic info
            onPacketUpdate?.((response as any).data);
            const newUrl = `${window.location.pathname}?packetId=${newPacketId}`;
            router.push(newUrl);
            alert(t.createSuccess);
          }
        } else {
          alert(t.createSuccess);
        }
      }
    } catch (error) {
      console.error("Error saving itinerary:", error);

      if (error instanceof Error) {
        if (error.message.includes("non-JSON response")) {
          alert(t.errorSaving);
        } else if (error.message.includes("Network error")) {
          alert(t.networkError);
        } else if (error.message.includes("401")) {
          alert(t.authenticationFailed);
        } else {
          alert(t.errorSaving);
        }
      } else {
        alert(t.errorSaving);
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
          {/* Title Section */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold truncate">{packetName}</h2>
            <p className="text-sm text-gray-600 truncate">
              {packetDescription}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setTempPacketName(packetName);
                setTempPacketDescription(packetDescription);
                setIsEditingPacket(true);
              }}
              className="flex items-center gap-1.5 flex-1 min-w-0 min-h-[44px] rounded-xl transition-all duration-200 active:scale-95"
            >
              <Pencil className="h-4 w-4 flex-shrink-0" />
              <span className="hidden lg:inline truncate">{t.editPlanName}</span>
              <span className="lg:hidden truncate">{t.edit}</span>
            </Button>
            <Button
              variant="default"
              size="default"
              onClick={saveAllItinerary}
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-1 min-w-0 min-h-[44px] rounded-xl transition-all duration-200 active:scale-95 shadow-md shadow-purple-500/20"
            >
              <Save className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t.save}</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 w-full">
            <Select value={transportMode} onValueChange={setTransportMode}>
              <SelectTrigger className="flex-1 min-w-[100px] min-h-[44px] rounded-xl">
                <SelectValue placeholder={t.transportMode} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="driving">{t.driving}</SelectItem>
                <SelectItem value="walking">{t.walking}</SelectItem>
                <SelectItem value="cycling">{t.cycling}</SelectItem>
                <SelectItem value="transit">{t.transit}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="default"
              onClick={() => createAllTracksPath?.(transportMode)}
              className="flex items-center gap-1.5 flex-shrink-0 min-h-[44px] rounded-xl transition-all duration-200 active:scale-95"
            >
              <Map className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{t.generateRoute}</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-3">
          <Button
            variant="outline"
            size="default"
            onClick={addNewDay}
            className="flex items-center justify-center gap-1.5 w-full min-h-[44px] rounded-xl border-dashed border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-400 transition-all duration-200 active:scale-95"
          >
            <Plus className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{t.addNewDay}</span>
          </Button>
        </div>

        <div className="relative mt-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {Array.isArray(tracks) &&
              tracks.map((dayTrack, index) => (
                <button
                  key={index}
                  onClick={() => onDaySelect(index)}
                  className={cn(
                    "whitespace-nowrap flex-shrink-0 min-h-[40px] px-4 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95",
                    currentDayIndex === index
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/25"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {dayTrack.dayText}
                </button>
              ))}
          </div>
          {/* Fade hint for horizontal scroll */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-white to-transparent" />
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
                      placeholder={t.planName}
                    />
                    <Textarea
                      value={dayDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setDayDescription(e.target.value)
                      }
                      placeholder={t.planDescription}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="default"
                        onClick={() => saveDayEdit()}
                        className="flex-1 min-h-[44px] rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 active:scale-95 transition-all duration-200"
                      >
                        {t.save}
                      </Button>
                      <Button
                        size="default"
                        variant="outline"
                        onClick={() => setEditingDay(null)}
                        className="flex-1 min-h-[44px] rounded-xl active:scale-95 transition-all duration-200"
                      >
                        {t.cancel}
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
                          size="icon"
                          variant="ghost"
                          onClick={() => startEditingDay(currentDayIndex)}
                          className="min-w-[40px] min-h-[40px] rounded-xl text-gray-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 active:scale-95"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {tracks.length > 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteDay(currentDayIndex)}
                            className="min-w-[40px] min-h-[40px] rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 active:scale-95"
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
              <div className="flex flex-col gap-3 mb-4">
                <h4 className="font-medium">{t.itineraryPoints}</h4>
                <div className="flex items-center gap-2 w-full">
                  <Select
                    value={transportMode}
                    onValueChange={setTransportMode}
                  >
                    <SelectTrigger className="flex-1 min-w-[100px] min-h-[44px] rounded-xl">
                      <SelectValue placeholder={t.selectTransportation} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driving">{t.driving}</SelectItem>
                      <SelectItem value="walking">{t.walking}</SelectItem>
                      <SelectItem value="cycling">{t.cycling}</SelectItem>
                      <SelectItem value="transit">{t.transit}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => props.createTracksPath?.(transportMode)}
                    className="flex items-center gap-1.5 flex-shrink-0 min-h-[44px] rounded-xl transition-all duration-200 active:scale-95"
                  >
                    <Map className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{t.generateRoute}</span>
                  </Button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={
                    tracks[currentDayIndex] &&
                    Array.isArray(tracks[currentDayIndex].markers)
                      ? tracks[currentDayIndex].markers.map((_, index) => index)
                      : []
                  }
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {tracks[currentDayIndex] &&
                    Array.isArray(tracks[currentDayIndex].markers) ? (
                      tracks[currentDayIndex].markers.map((track, index) => (
                        <SortableTrack
                          key={index}
                          id={index}
                          track={track}
                          onDelete={() =>
                            onDeleteTrack?.(currentDayIndex, index)
                          }
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-3 shadow-sm">
                          <Map className="h-7 w-7 text-purple-400" />
                        </div>
                        <p className="font-medium text-gray-700 text-sm">{t.noTracksAvailable}</p>
                        <p className="text-xs text-gray-400 mt-1">{t.tapToAddMarker}</p>
                      </div>
                    )}
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
            <DialogTitle>{t.editTravelPlan}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="packet-name" className="text-sm font-medium">
                {t.planName}
              </label>
              <Input
                id="packet-name"
                value={tempPacketName}
                onChange={(e) => setTempPacketName(e.target.value)}
                placeholder={t.enterTravelPlanName}
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="packet-description"
                className="text-sm font-medium"
              >
                {t.planDescription}
              </label>
              <Textarea
                id="packet-description"
                value={tempPacketDescription}
                onChange={(e) => setTempPacketDescription(e.target.value)}
                placeholder={t.enterTravelPlanDescription}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelPacketEdit}>
              {t.cancel}
            </Button>
            <Button onClick={handleSavePacketEdit}>{t.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const TravelTracksLoading: React.FC = () => {
  const { language } = useLanguageStore();
  const t = useTranslation(language);
  
  return (
    <div className="w-full md:w-[400px] h-full flex items-center justify-center bg-white border-r border-gray-200">
      <div className="text-center">
        <div className="relative inline-flex mx-auto mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
          <div className="relative animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600"></div>
        </div>
        <p className="text-sm text-gray-600">{t.loading}</p>
      </div>
    </div>
  );
};

const TravelTracks: React.FC<Props> = (props) => {
  return (
    <Suspense fallback={<TravelTracksLoading />}>
      <TravelTracksWithSearchParams {...props} />
    </Suspense>
  );
};

export default TravelTracks;
