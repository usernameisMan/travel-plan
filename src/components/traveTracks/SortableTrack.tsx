import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Track from "./Track";

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
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Track track={track} step={id} onDelete={onDelete} />
    </div>
  );
} 