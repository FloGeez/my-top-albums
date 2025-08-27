import { useState } from "react";
import { type Album } from "@/lib/spotify";

export function useDragDrop() {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return {
    draggedItem,
    setDraggedItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
