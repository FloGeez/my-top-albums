import React, { type ReactNode } from "react";
import { Search, Star, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompactRankedAlbumCard } from "@/components/album-card";
import {
  ViderButton,
  TriButton,
  TriManuelButton,
  PleinEcranButton,
} from "@/components/action-buttons";
import { TooltipProvider } from "@/components/ui/tooltip";
import { type Album } from "@/lib/spotify";

// Composant pour le contenu du Top 50
export const MemoizedTop50Content = React.memo(function Top50Content({
  top50,
  setActiveTab,
  sortMode,
  sortDirection,
  handleSortToggle,
  handleManualSortToggle,
  setIsFullscreen,
  clearTop50,
  removeFromTop50,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  draggedItem,
  getSortIcon,
  getSortTooltipText,
}: {
  top50: Album[];
  setActiveTab: (tab: string) => void;
  sortMode: "date" | "manual";
  sortDirection: "asc" | "desc";
  handleSortToggle: () => void;
  handleManualSortToggle: () => void;

  setIsShareDialogOpen: (value: boolean) => void;
  setIsFullscreen: () => void;
  clearTop50: () => void;
  removeFromTop50: (albumId: string) => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, dropIndex: number) => void;
  handleDragEnd: () => void;
  draggedItem: number | null;
  getSortIcon: () => ReactNode;
  getSortTooltipText: () => string;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-[calc(100vh-260px)] overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-8 px-6">
            {top50.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-primary/60" />
                  </div>
                  <h2 className="text-2xl font-semibold text-foreground mb-3">
                    Votre Top 50 vous attend
                  </h2>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                    Commencez par rechercher et ajouter vos albums préférés
                  </p>
                </div>

                {/* Bouton mobile uniquement */}
                <div className="md:hidden">
                  <Button
                    onClick={() => setActiveTab("search")}
                    size="lg"
                    className="gap-2 px-8"
                  >
                    <Search className="w-4 h-4" />
                    Rechercher des albums
                  </Button>
                </div>

                {/* Instructions desktop */}
                <div className="hidden md:block">
                  <p className="text-sm text-muted-foreground opacity-75">
                    Utilisez le panneau de recherche pour commencer →
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Contrôles mobiles uniquement - masqués sur desktop */}
                <div className="md:hidden flex items-center justify-center gap-1 mb-4">
                  <TooltipProvider delayDuration={100}>
                    <ViderButton onClear={clearTop50} size="icon" />

                    {/* Séparateur */}
                    <div className="w-px h-4 bg-border mx-2"></div>

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

                {/* Instructions pour le tri manuel */}
                {sortMode === "manual" && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Glissez-déposez les albums pour les réorganiser
                    </p>
                  </div>
                )}

                <div
                  className={`grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6`}
                >
                  {top50.map((album, index) => (
                    <CompactRankedAlbumCard
                      key={album.id}
                      album={album}
                      rank={index + 1}
                      onRemove={() => removeFromTop50(album.id)}
                      isDraggable={sortMode === "manual"}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedItem === index}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});
