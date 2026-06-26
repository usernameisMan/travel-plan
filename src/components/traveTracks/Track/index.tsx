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
import { Trash2 } from "lucide-react";
import { useMapStore } from "@/app/store/mapStore";
import { useLanguageStore } from "@/store/languageStore";
import { useTranslation } from "@/lib/i18n";

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
  markers: Track[];
}

const Track: React.FC<Props> = ({ step, onDelete, ...props }) => {
  const { type,location, title, description } = props.track;
  const { language } = useLanguageStore();
  const t = useTranslation(language);

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
      className={cn(
        "w-full cursor-pointer border-2 border-transparent transition-all duration-200",
        "hover:border-purple-300 hover:shadow-md hover:shadow-purple-500/10",
        "active:scale-[0.98] active:shadow-none"
      )}
      onClick={onClick}
    >
      <CardHeader className="p-3">
        <div className="flex justify-between items-center gap-2">
          <CardTitle className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-purple-500 uppercase tracking-wide">
              {t.markerStop} {step + 1}
            </span>
            <span className="block font-semibold text-gray-900 truncate mt-0.5">{title}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 min-w-[40px] min-h-[40px] rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 active:scale-95"
            onClick={handleDelete}
            aria-label={t.delete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
            {name}
          </span>
        </div>
        {description && (
          <CardDescription className="line-clamp-2 mt-1 text-xs">{description}</CardDescription>
        )}
      </CardHeader>
    </Card>
  );
};

export default Track;
