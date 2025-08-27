import React, { useState } from "react";
import { Hand, Calendar } from "lucide-react";
import { type Album } from "@/lib/spotify";

export function useSort() {
  const [sortMode, setSortMode] = useState<"date" | "manual">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSortToggle = () => {
    if (sortMode === "manual") {
      setSortMode("date");
      setSortDirection("desc");
    } else {
      const newDirection = sortDirection === "desc" ? "asc" : "desc";
      setSortDirection(newDirection);
    }
  };

  const handleManualSortToggle = () => {
    if (sortMode === "date") {
      setSortMode("manual");
    }
  };

  const getSortIcon = () => {
    if (sortMode === "manual") {
      return <Hand className="w-3 h-3" />;
    } else {
      return <Calendar className="w-3 h-3" />;
    }
  };

  const getSortTooltipText = () => {
    if (sortMode === "manual") {
      return "Activer le tri par date (décroissant)";
    } else {
      return sortDirection === "desc"
        ? "Trier par date (croissant)"
        : "Trier par date (décroissant)";
    }
  };

  return {
    sortMode,
    sortDirection,
    setSortMode,
    setSortDirection,
    handleSortToggle,
    handleManualSortToggle,
    getSortIcon,
    getSortTooltipText,
  };
}
