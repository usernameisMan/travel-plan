import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Track from "./Track";
import { GripVertical } from "lucide-react";

interface SortableTrackProps {
  id: number;
  track: any;
  onDelete: () => void;
}

export function SortableTrack({ id, track, onDelete }: SortableTrackProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    transition: {
      duration: 150,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as const;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group ${isDragging ? 'shadow-lg opacity-50' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-8 h-full cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded transition-colors opacity-0 group-hover:opacity-100"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1">
          <Track track={track} step={id} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
} 