import React from "react";
import { Star, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  TriButton,
  TriManuelButton,
  PleinEcranButton,
} from "@/components/action-buttons";
import { type Album } from "@/lib/spotify";

interface Top50PanelHeaderProps {
  top50: Album[];
  sortMode: "date" | "manual";
  sortDirection: "asc" | "desc";
  handleSortToggle: () => void;
  handleManualSortToggle: () => void;

  clearTop50: () => void;
  setIsFullscreen: () => void;
  getSortIcon: () => React.ReactNode;
  getSortTooltipText: () => string;
}

export function Top50PanelHeader({
  top50,
  sortMode,
  sortDirection,
  handleSortToggle,
  handleManualSortToggle,
  setIsFullscreen,
  clearTop50,
  getSortIcon,
  getSortTooltipText,
}: Top50PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-primary" />
        <h2 className="text-lg font-medium flex items-center gap-2 group">
          {top50.length > 0 ? `Top 50 (${top50.length})` : "Mon Top 50"}
          {top50.length > 50 && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                </TooltipTrigger>
                <TooltipContent>
                  Plus de 50 albums dans votre Top.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {top50.length > 0 && (
            <AlertDialog>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        aria-label="Vider le Top 50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Vider le Top 50</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Êtes-vous absolument sûr ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action supprimera définitivement tous les albums de
                    votre Top 50. Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={clearTop50}>
                    Vider le Top 50
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </h2>
      </div>

      {/* Contrôles desktop - seulement si contenu */}
      {top50.length > 0 && (
        <div className="flex items-center gap-1">
          <TooltipProvider delayDuration={100}>
            <TriButton
              onClick={handleSortToggle}
              sortMode={sortMode}
              sortDirection={sortDirection}
              getSortIcon={getSortIcon}
              getSortTooltipText={getSortTooltipText}
            />

            {/* Tri manuel si en mode date */}
            {sortMode === "date" && (
              <TriManuelButton onClick={handleManualSortToggle} />
            )}

            {/* Séparateur */}
            <div className="w-px h-4 bg-border mx-2"></div>

            <PleinEcranButton onClick={setIsFullscreen} />
          </TooltipProvider>
        </div>
      )}
    </div>
  );
}
