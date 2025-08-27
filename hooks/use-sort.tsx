import React, { useState } from "react";
import { Hand, Calendar } from "lucide-react";
import { type Album } from "@/lib/spotify";

export function useSort(
  sortMode: "date" | "manual" = "date",
  sortDirection: "asc" | "desc" = "desc"
) {
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
    getSortIcon,
    getSortTooltipText,
  };
}
