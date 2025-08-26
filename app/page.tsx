"use client";

import React from "react";
import type { ReactNode } from "react";

import { useState, useEffect } from "react";
import {
  Search,
  Music,
  Star,
  Plus,
  X,
  Loader2,
  GripVertical,
  Maximize,
  Minus,
  Share,
  Trash2,
  Sun,
  Moon,
  ArrowDown,
  ArrowUp,
  ExternalLink,
  AlertTriangle,
  Clock,
  Download,
  Save,
  Upload,
  Link,
  Calendar,
  Hand,
  Sparkles,
  HeartHandshake,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useToast } from "@/hooks/use-toast";
import { spotifyService, type Album } from "@/lib/spotify";
import { BackupManager } from "@/lib/backup-manager";
import { useTheme } from "next-themes";
import { useSpotifyAuth } from "@/hooks/use-spotify-auth";
import Image from "next/image";

// Import des composants refactorisés
import { ShareDialog } from "@/components/share-dialog";
import { SpotifyAuth } from "@/components/spotify-auth";
import { SpotifySaveButton } from "@/components/spotify-save-button";
import { BackupManagerDialog } from "@/components/backup-manager-dialog";
import { MemoizedSearchContent } from "@/components/search-content";
import { MemoizedTop50Content } from "@/components/top50-content";
import {
  TabsSkeleton,
  Top50ContentSkeleton,
  SearchContentSkeleton,
} from "@/components/skeletons";
import { FullscreenView } from "@/components/fullscreen-view";
import { AppHeader } from "@/components/app-header";
import { FloatingDock } from "@/components/floating-dock";
import { LoadSpotifyDialog } from "@/components/load-spotify-dialog";
import {
  ViderButton,
  TriButton,
  TriManuelButton,
  PleinEcranButton,
} from "@/components/action-buttons";

export default function MusicApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [top50, setTop50] = useState<Album[]>([]);
  const [activeTab, setActiveTab] = useState("top50");
  // Suppression du state viewMode - on utilise uniquement les classes responsive Tailwind
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharedData, setSharedData] = useState<Album[] | null>(null);
  const { toast } = useToast();
  const [sortMode, setSortMode] = useState<"date" | "manual">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [manualOrder, setManualOrder] = useState<Album[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [sharedPlaylistId, setSharedPlaylistId] = useState<string | null>(null);
  const [isFromSharedLink, setIsFromSharedLink] = useState<boolean | null>(
    null
  );
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [hasLoadedFromSpotify, setHasLoadedFromSpotify] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, login } = useSpotifyAuth();

  // Charger le top 50 et l'ordre manuel depuis localStorage au démarrage
  useEffect(() => {
    if (hasInitialized) {
      console.log("⏭️ [INIT] Already initialized, skipping");
      return;
    }

    console.log("🚀 [INIT] Starting app initialization");
    if (typeof window === "undefined") return;

    setHasInitialized(true);
    console.log("🏠 [INIT] Setting mounted to true");
    // Chargement synchrone immédiat pour l'affichage
    setMounted(true);

    try {
      console.log("💾 [INIT] Reading from localStorage...");
      const savedTop50 = localStorage.getItem("music-top50-albums");
      const savedManualOrder = localStorage.getItem("music-top50-manual-order");

      if (savedTop50) {
        const parsed = JSON.parse(savedTop50);
        console.log(
          "✅ [INIT] Loading top50 from localStorage:",
          parsed.length,
          "albums"
        );
        console.log(
          "📋 [INIT] Albums:",
          parsed.map((a: Album) => `${a.artist} - ${a.title}`).slice(0, 3)
        );
        setTop50(parsed);
      } else {
        console.log("❌ [INIT] No saved top50 found in localStorage");
      }

      if (savedManualOrder) {
        const parsedOrder = JSON.parse(savedManualOrder);
        console.log(
          "✅ [INIT] Loading manual order from localStorage:",
          parsedOrder.length,
          "albums"
        );
        setManualOrder(parsedOrder);
      } else {
        console.log("❌ [INIT] No saved manual order found in localStorage");
      }
    } catch (error) {
      console.error("❌ [INIT] Error loading data from localStorage:", error);
    }

    console.log(
      "🏁 [INIT] Basic initialization completed - setting isInitializing to false"
    );
    // L'initialisation de base est terminée immédiatement
    setIsInitializing(false);
  }, [hasInitialized]);

  // Sauvegarder le top 50 dans localStorage à chaque modification
  useEffect(() => {
    if (!mounted) return; // Attendre que le composant soit monté
    console.log(
      "💾 [SAVE] Saving top50 to localStorage:",
      top50.length,
      "albums"
    );
    localStorage.setItem("music-top50-albums", JSON.stringify(top50));

    // Créer une sauvegarde automatique si il y a des albums
    if (top50.length > 0) {
      BackupManager.autoBackup(top50, `Top 50 - ${top50.length} albums`);
    }
  }, [top50, mounted]);

  // Sauvegarder l'ordre manuel dans localStorage à chaque modification
  useEffect(() => {
    if (!mounted) return; // Attendre que le composant soit monté
    localStorage.setItem(
      "music-top50-manual-order",
      JSON.stringify(manualOrder)
    );
  }, [manualOrder, mounted]);

  // Vérifier s'il y a des données partagées dans l'URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const sharedParam = urlParams.get("shared");
    const spotifyParam = urlParams.get("spotify");

    if (sharedParam) {
      try {
        const decodedData = JSON.parse(atob(sharedParam));
        if (decodedData.albums && Array.isArray(decodedData.albums)) {
          setSharedData(decodedData.albums);
          toast({
            title: "Top 50 partagé chargé !",
            description: `${decodedData.albums.length} albums ont été importés`,
          });
        }
      } catch (error) {
        console.error("Error parsing shared data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données partagées",
          variant: "destructive",
        });
      }

      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (spotifyParam) {
      // Détecter la playlist dans l'URL mais ne pas la charger automatiquement
      console.log("🔗 [URL] Spotify playlist detected in URL:", spotifyParam);
      setSharedPlaylistId(spotifyParam);
      setIsFromSharedLink(true); // Considérer comme lien externe par défaut
    }
  }, [toast]);

  // Plus de chargement automatique - tout se fait sur demande maintenant

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(true);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const results = await spotifyService.searchAlbums(searchQuery);
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher les albums. Veuillez réessayer.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToTop50 = (album: Album) => {
    if (top50.find((a) => a.id === album.id)) {
      toast({
        title: "Album déjà ajouté",
        description: "Cet album est déjà dans votre top 50",
      });
      return;
    }

    const newTop50 = [...top50, album];

    if (newTop50.length > 50) {
      // Check AFTER checking for duplicates
      toast({
        title: "Attention : Top 50 dépassé !",
        description: `Votre Top 50 contient maintenant ${newTop50.length} albums. L'album a été ajouté.`,
        variant: "default", // Using default as 'warning' variant might not be directly supported by shadcn/ui toast without custom setup.
      });
    } else {
      toast({
        title: "Album ajouté",
        description: `${album.title} ajouté à votre top 50`,
      });
    }

    if (sortMode === "date") {
      newTop50.sort((a, b) =>
        sortDirection === "desc" ? b.year - a.year : a.year - b.year
      );
      setTop50(newTop50);
    } else {
      setTop50(newTop50);
      setManualOrder(newTop50);
    }
  };

  const importSharedData = () => {
    if (sharedData) {
      setTop50(sharedData);
      setManualOrder(sharedData);
      setSortMode("manual");
      setSharedData(null);
      toast({
        title: "Albums importés !",
        description: `${sharedData.length} albums ont été ajoutés à votre top 50`,
      });
    }
  };

  const handleSortToggle = () => {
    if (sortMode === "manual") {
      setSortMode("date");
      setSortDirection("desc");
      const sortedTop50 = [...top50].sort((a, b) => b.year - a.year);
      setTop50(sortedTop50);
      toast({
        title: "Mode tri automatique activé",
        description: "Albums triés par date de sortie (décroissant)",
      });
    } else {
      const newDirection = sortDirection === "desc" ? "asc" : "desc";
      setSortDirection(newDirection);
      const sortedTop50 = [...top50].sort((a, b) =>
        newDirection === "desc" ? b.year - a.year : a.year - b.year
      );
      setTop50(sortedTop50);
      toast({
        title: `Tri par date ${
          newDirection === "desc" ? "décroissant" : "croissant"
        }`,
        description: `Albums triés par date de sortie (${
          newDirection === "desc"
            ? "du plus récent au plus ancien"
            : "du plus ancien au plus récent"
        })`,
      });
    }
  };

  const handleManualSortToggle = () => {
    if (sortMode === "date") {
      setSortMode("manual");
      if (manualOrder.length > 0 && manualOrder.length === top50.length) {
        setTop50(manualOrder);
      }
      toast({
        title: "Mode tri manuel activé",
        description: "Vous pouvez maintenant réorganiser manuellement",
      });
    }
  };

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

    if (draggedItem === null || sortMode !== "manual") return;

    const newTop50 = [...top50];
    const draggedAlbum = newTop50[draggedItem];

    newTop50.splice(draggedItem, 1);
    newTop50.splice(dropIndex, 0, draggedAlbum);

    setTop50(newTop50);
    setManualOrder(newTop50);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const removeFromTop50 = (albumId: string) => {
    const newTop50 = top50.filter((album) => album.id !== albumId);
    setTop50(newTop50);
    if (sortMode === "manual") {
      setManualOrder(newTop50);
    }
    toast({
      title: "Album retiré",
      description: "L'album a été retiré de votre top 50",
    });
  };

  const clearTop50 = () => {
    // Clear local storage first (only on client)
    if (typeof window !== "undefined") {
      localStorage.removeItem("music-top50-albums");
      localStorage.removeItem("music-top50-manual-order");
    }

    // Then, update the state to reflect the empty list
    setTop50([]);
    setManualOrder([]);

    // Finally, show the toast
    toast({
      title: "Top 50 vidé !",
      description: "Tous les albums ont été supprimés de votre top.",
    });
  };

  const getSortIcon = () => {
    if (sortMode === "manual") {
      return <Hand className="w-3 h-3" />;
    } else {
      return sortDirection === "desc" ? (
        <Calendar className="w-3 h-3" />
      ) : (
        <Calendar className="w-3 h-3" />
      );
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

  // Fonction utilitaire pour charger une playlist et mettre à jour l'état
  const loadPlaylistAndUpdateState = async (
    playlistId: string,
    isOwnPlaylist: boolean = false
  ) => {
    try {
      const albums = await spotifyService.loadAlbumsFromPlaylistTracks(
        playlistId
      );

      if (albums.length > 0) {
        setTop50(albums);
        setManualOrder(albums);
        setSharedPlaylistId(playlistId);
        setIsFromSharedLink(!isOwnPlaylist);
        return albums.length;
      } else {
        throw new Error("Playlist vide");
      }
    } catch (error) {
      console.error("Error loading playlist:", error);
      throw error;
    }
  };

  // Fonction pour charger sa propre playlist
  const loadOwnPlaylist = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Non connecté",
        description: "Connectez-vous à Spotify pour charger votre playlist",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("🎵 [LOAD-OWN] Loading own playlist...");

      // Chercher la playlist existante de l'utilisateur
      const existingPlaylist = await spotifyService.findExistingTopPlaylist([]);

      if (existingPlaylist) {
        console.log("🎵 [LOAD-OWN] Found own playlist:", existingPlaylist.id);

        const albumsCount = await loadPlaylistAndUpdateState(
          existingPlaylist.id,
          true
        );

        // Pas de mise à jour d'URL pour notre propre playlist
        setIsFromSharedLink(false);
        setHasLoadedFromSpotify(true);
      } else {
        toast({
          title: "Aucune playlist trouvée",
          description: "Vous n'avez pas encore de playlist Top 50",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading own playlist:", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger votre playlist",
        variant: "destructive",
      });
    }
  };

  // Fonction pour gérer le bouton de chargement (ouvrir la modale)
  const handleLoadButton = () => {
    setIsLoadDialogOpen(true);
  };

  // Fonction pour charger une playlist partagée
  const loadSharedPlaylist = async (playlistId: string) => {
    try {
      console.log("🎵 [LOAD-SHARED] Loading shared playlist:", playlistId);

      const albumsCount = await loadPlaylistAndUpdateState(playlistId, false);
      setHasLoadedFromSpotify(true);
    } catch (error) {
      console.error("Error loading shared playlist:", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger la playlist partagée",
        variant: "destructive",
      });
    }
  };

  // Fonction pour restaurer une sauvegarde
  const handleRestoreBackup = (albums: Album[]) => {
    setTop50(albums);
    setManualOrder(albums);
    setSortMode("manual");
  };

  // Fonction pour réinitialiser l'état de chargement
  const resetLoadState = () => {
    setHasLoadedFromSpotify(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header fixe */}
      <AppHeader
        top50={top50}
        mounted={mounted}
        theme={theme}
        setTheme={setTheme}
        sharedPlaylistId={sharedPlaylistId}
        isFromSharedLink={isFromSharedLink}
        loadSharedPlaylist={loadSharedPlaylist}
        setIsBackupDialogOpen={setIsBackupDialogOpen}
        sharedData={sharedData}
        importSharedData={importSharedData}
        setSharedData={setSharedData}
      />

      {/* Vue en panneaux (desktop uniquement) */}

      {/* Contenu principal - Prend toute la hauteur restante */}
      <div className="flex-1 min-h-0 px-4 pb-14">
        <div className="max-w-7xl mx-auto h-full">
          {/* Vue par onglets (mobile uniquement) */}
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
                    {top50.length > 0
                      ? `Top 50 (${top50.length})`
                      : "Mon Top 50"}
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
                    <MemoizedSearchContent
                      mounted={mounted}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      isLoading={isLoading}
                      hasSearched={hasSearched}
                      searchResults={searchResults}
                      handleSearch={handleSearch}
                      top50={top50}
                      addToTop50={addToTop50}
                      removeFromTop50={removeFromTop50}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="top50" className="h-full flex-1">
                <div className="h-full overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-8 p-1">
                      {!mounted ? (
                        <Top50ContentSkeleton />
                      ) : (
                        <MemoizedTop50Content
                          top50={top50}
                          setActiveTab={setActiveTab}
                          sortMode={sortMode}
                          sortDirection={sortDirection}
                          handleSortToggle={handleSortToggle}
                          handleManualSortToggle={handleManualSortToggle}
                          setIsFullscreen={setIsFullscreen}
                          setIsShareDialogOpen={setIsShareDialogOpen}
                          clearTop50={clearTop50}
                          removeFromTop50={removeFromTop50}
                          handleDragStart={handleDragStart}
                          handleDragOver={handleDragOver}
                          handleDrop={handleDrop}
                          handleDragEnd={handleDragEnd}
                          draggedItem={draggedItem}
                          getSortIcon={getSortIcon}
                          getSortTooltipText={getSortTooltipText}
                        />
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Vue en panneaux (desktop uniquement) */}
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
                      <MemoizedSearchContent
                        mounted={mounted}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        isLoading={isLoading}
                        hasSearched={hasSearched}
                        searchResults={searchResults}
                        handleSearch={handleSearch}
                        top50={top50}
                        addToTop50={addToTop50}
                        removeFromTop50={removeFromTop50}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Panneau Top 50 - Droite */}
              <div className="col-span-2 flex flex-col min-h-0">
                <div className="p-6 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-primary" />
                      <h2 className="text-lg font-medium flex items-center gap-2 group">
                        {top50.length > 0
                          ? `Top 50 (${top50.length})`
                          : "Mon Top 50"}
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
                                  Cette action supprimera définitivement tous
                                  les albums de votre Top 50. Cette action est
                                  irréversible.
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

                          <PleinEcranButton
                            onClick={() => setIsFullscreen(true)}
                          />
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                  <div className="h-full p-1 flex flex-col">
                    {!mounted ? (
                      <Top50ContentSkeleton />
                    ) : (
                      <MemoizedTop50Content
                        top50={top50}
                        setActiveTab={setActiveTab}
                        sortMode={sortMode}
                        sortDirection={sortDirection}
                        handleSortToggle={handleSortToggle}
                        handleManualSortToggle={handleManualSortToggle}
                        setIsFullscreen={setIsFullscreen}
                        setIsShareDialogOpen={setIsShareDialogOpen}
                        clearTop50={clearTop50}
                        removeFromTop50={removeFromTop50}
                        handleDragStart={handleDragStart}
                        handleDragOver={handleDragOver}
                        handleDrop={handleDrop}
                        handleDragEnd={handleDragEnd}
                        draggedItem={draggedItem}
                        getSortIcon={getSortIcon}
                        getSortTooltipText={getSortTooltipText}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dock flottant en bas - Actions principales */}
      <FloatingDock
        mounted={mounted}
        top50={top50}
        setIsShareDialogOpen={setIsShareDialogOpen}
        handleLoadButton={handleLoadButton}
      />

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        albums={top50}
      />

      <BackupManagerDialog
        isOpen={isBackupDialogOpen}
        onClose={() => setIsBackupDialogOpen(false)}
        onRestore={handleRestoreBackup}
        currentAlbums={top50}
      />

      {/* Modale de chargement depuis Spotify */}
      <LoadSpotifyDialog
        isOpen={isLoadDialogOpen}
        onOpenChange={setIsLoadDialogOpen}
        isAuthenticated={isAuthenticated}
        onLoad={() => {
          toast({
            title: "Chargement en cours...",
            description: "Récupération de votre Top 50 depuis Spotify",
          });
          loadOwnPlaylist();
        }}
        onLogin={() => {
          toast({
            title: "Connexion requise",
            description:
              "Vous allez être redirigé vers Spotify pour vous connecter",
          });
          setTimeout(() => login(), 1000);
        }}
      />

      {isFullscreen && (
        <FullscreenView top50={top50} onClose={() => setIsFullscreen(false)} />
      )}
    </div>
  );
}

// Composant pour le contenu du Top 50
