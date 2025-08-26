import React from "react";
import { Search, Loader2, Music, HeartHandshake } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlbumCard, AlbumSkeleton } from "@/components/album-card";
import { type Album } from "@/lib/spotify";

// Composant pour le contenu de la recherche
export const MemoizedSearchContent = React.memo(function SearchContent({
  searchQuery,
  setSearchQuery,
  isLoading,
  hasSearched,
  searchResults,
  handleSearch,
  top50,
  addToTop50,
  removeFromTop50,
  mounted,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  hasSearched: boolean;
  searchResults: Album[];
  handleSearch: () => void;
  top50: Album[];
  addToTop50: (album: Album) => void;
  removeFromTop50: (albumId: string) => void;
  mounted: boolean;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="mx-4">
        <div className="relative flex items-center w-full mb-8 flex-shrink-0">
          <Input
            type="text"
            placeholder="Rechercher un album ou un artiste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-10 pr-10 rounded-full focus-visible:ring-transparent"
            disabled={!mounted}
          />
          <Button
            onClick={handleSearch}
            disabled={isLoading || !mounted}
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
            aria-label="Rechercher"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="h-[calc(100vh-320px)] overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-8 px-6">
            {isLoading ? (
              <div className="grid gap-4 grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <AlbumSkeleton key={i} />
                ))}
              </div>
            ) : hasSearched && searchResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="w-12 h-12 mx-auto mb-4 opacity-60" />
                <p className="text-base">Aucun résultat trouvé</p>
                <p className="text-sm mt-1">
                  Essayez un autre terme de recherche
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid gap-4 grid-cols-2 xl:grid-cols-3">
                {searchResults.map((album) => (
                  <AlbumCard
                    key={album.id}
                    album={album}
                    onAdd={() => addToTop50(album)}
                    onRemove={() => removeFromTop50(album.id)}
                    isInTop50={top50.some((a) => a.id === album.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <HeartHandshake className="w-12 h-12 mx-auto mb-4 opacity-60" />
                <p className="text-base">Découvrez vos albums préférés</p>
                <p className="text-sm mt-1">
                  Commencez par taper le nom d'un artiste ou d'un album
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
});
