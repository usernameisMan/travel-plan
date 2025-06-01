'use client';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { markers } from "../../../constant";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/app/store/mapStore";

// this track just show one day
interface Props {
  track: Track;
  step: number;
  onDelete?: () => void;
}

export interface Location {
  lng: string;
  lat: string;
}

export interface Track {
  id: string;
  title: string;
  description: string;
  imgs: string[];
  refUrls: string[];
  type: string;
  location: Location;
}

export interface DayTrack {
  day: string;
  dayText: string;
  description: string;
  tracks: Track[];
}

const Track: React.FC<Props> = ({ step, onDelete, ...props }) => {
  const { type,location, title, description } = props.track;

  const { lng, lat } = location;
  const name = markers.find(({ fileName }) => fileName === type)?.name;
  const mapInstance = useMapStore((state) => state.mapboxInstance);

  const onClick = () => {
    if (mapInstance) {
      mapInstance.flyTo({
        center: [parseFloat(lng), parseFloat(lat)],
        zoom: 15
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Card
      className={cn("w-full h-[150px] my-3 first:mt-0 last:mb-0 cursor-pointer hover:border-2 hover:border-blue-500")}
      onClick={onClick}
    >
      <CardHeader className="p-[15px]">
        <div className="flex justify-between items-start">
          <CardTitle>
            <Button variant="link" className="px-0">
              Marker #{step + 1}
            </Button>
            【{title}】
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-100"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
        <CardDescription>Type: {name}</CardDescription>
        <CardDescription>Description: {description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default Track;
