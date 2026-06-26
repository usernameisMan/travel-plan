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
      className={`relative group ${isDragging ? 'shadow-xl shadow-purple-500/20 opacity-60 scale-[1.02]' : ''} transition-shadow duration-200`}
    >
      <div className="flex items-stretch gap-1.5">
        {/* Drag handle — visible on mobile, fade-in on hover for desktop */}
        <div
          {...attributes}
          {...listeners}
          className="flex items-center justify-center min-w-[36px] cursor-grab active:cursor-grabbing rounded-xl hover:bg-gray-100 transition-colors duration-150 opacity-30 group-hover:opacity-80 touch:opacity-60"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <Track track={track} step={id} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
} 