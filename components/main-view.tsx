import React from "react";
import { Star, Plus, AlertTriangle, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MemoizedSearchContent } from "@/components/search-content";
import { MemoizedTop50Content } from "@/components/top50-content";
import { Top50PanelHeader } from "@/components/top50-panel-header";
import { FullscreenView } from "@/components/fullscreen-view";
import {
  TabsSkeleton,
  Top50ContentSkeleton,
  SearchContentSkeleton,
} from "@/components/skeletons";
import { type Album } from "@/lib/spotify";

interface MainViewProps {
  mounted: boolean;
  top50: Album[];
  handleSearch: (query: string) => Promise<Album[]>;
  addToTop50: (album: Album) => void;
  removeFromTop50: (albumId: string) => void;
  clearTop50: () => void;
  onTop50Change: (newTop50: Album[]) => void;
}

export function MainView({
  mounted,
  top50,
  handleSearch,
  addToTop50,
  removeFromTop50,
  clearTop50,
  onTop50Change,
}: MainViewProps) {
  const [activeTab, setActiveTab] = React.useState("top50");
  const [isFullscreenOpen, setIsFullscreenOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Album[]>([]);
  const [sortMode, setSortMode] = React.useState<"date" | "manual">("date");

  // Fonction de recherche locale
  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const results = await handleSearch(searchQuery);
      setSearchResults(results);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Props communes pour les composants de contenu
  const searchContentProps = {
    mounted,
    searchQuery,
    setSearchQuery,
    isLoading,
    hasSearched,
    searchResults,
    handleSearch: performSearch,
    top50,
    addToTop50,
    removeFromTop50,
  };

  const top50ContentProps = {
    top50,
    setActiveTab,
    sortMode,
    sortDirection: "desc" as const,
    handleSortToggle: () => {},
    handleManualSortToggle: () => {},
    setIsFullscreen: () => setIsFullscreenOpen(true),
    clearTop50,
    removeFromTop50,
    onTop50Change,
    getSortIcon: () => null,
    getSortTooltipText: () => "",
  };

  return (
    <>
      {/* Vue mobile - Onglets */}
      <div className="block md:hidden h-full">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          {!mounted ? (
            <TabsSkeleton />
          ) : (
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6 flex-shrink-0">
              <TabsTrigger
                value="top50"
                className="flex items-center gap-2 text-sm"
              >
                <Star className="w-3 h-3" />
                {top50.length > 0 ? `Top 50 (${top50.length})` : "Mon Top 50"}
                {top50.length > 50 && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Plus de 50 albums dans votre Top.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="flex items-center gap-2 text-sm"
              >
                <Plus className="w-3 h-3" />
                Ajouter
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="search" className="h-full flex-1">
            <div className="h-full pb-20 p-1 flex flex-col">
              {!mounted ? (
                <SearchContentSkeleton />
              ) : (
                <MemoizedSearchContent {...searchContentProps} />
              )}
            </div>
          </TabsContent>

          <TabsContent value="top50" className="h-full flex-1">
            <div className="h-full overflow-hidden">
              <div className="h-full">
                <div className="space-y-8 p-1">
                  {!mounted ? (
                    <Top50ContentSkeleton />
                  ) : (
                    <MemoizedTop50Content {...top50ContentProps} />
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Vue desktop - Panneaux */}
      <div className="hidden md:block h-full">
        <div className="grid grid-cols-3 h-full border rounded-lg overflow-hidden">
          {/* Panneau Recherche - Gauche */}
          <div className="col-span-1 flex flex-col min-h-0">
            <div className="py-6 flex-1 border-r">
              <div className="px-6 flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-medium">Recherche d'albums</h2>
              </div>
              <div className="h-full p-1 flex flex-col">
                {!mounted ? (
                  <SearchContentSkeleton />
                ) : (
                  <MemoizedSearchContent {...searchContentProps} />
                )}
              </div>
            </div>
          </div>

          {/* Panneau Top 50 - Droite */}
          <div className="col-span-2 flex flex-col min-h-0">
            <div className="p-6 flex-1">
              <Top50PanelHeader
                top50={top50}
                clearTop50={clearTop50}
                setIsFullscreen={() => setIsFullscreenOpen(true)}
                onTop50Change={onTop50Change}
                onSortModeChange={setSortMode}
              />
              <div className="h-full p-1 flex flex-col">
                {!mounted ? (
                  <Top50ContentSkeleton />
                ) : (
                  <MemoizedTop50Content {...top50ContentProps} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFullscreenOpen && (
        <FullscreenView
          top50={top50}
          onClose={() => setIsFullscreenOpen(false)}
        />
      )}
    </>
  );
}
