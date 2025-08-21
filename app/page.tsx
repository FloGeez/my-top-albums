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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import Image from "next/image";
import { spotifyService, type Album } from "@/lib/spotify";
import { ShareDialog } from "@/components/share-dialog";
import { SpotifyAuth } from "@/components/spotify-auth";
import { SpotifySaveButton } from "@/components/spotify-save-button";
import { BackupManagerDialog } from "@/components/backup-manager-dialog";
import { BackupManager } from "@/lib/backup-manager";
import { useTheme } from "next-themes";
import { useSpotifyAuth } from "@/hooks/use-spotify-auth";

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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 pb-4 pt-16 md:pt-4">
        {/* Notification discrète pour playlist partagée */}
        {sharedPlaylistId && isFromSharedLink && top50.length === 0 && (
          <div className="max-w-md mx-auto mb-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Music className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm">Playlist partagée détectée</span>
                <Button
                  onClick={() => loadSharedPlaylist(sharedPlaylistId)}
                  size="sm"
                  variant="outline"
                  className="ml-2"
                >
                  Charger
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Header simplifié - Titre à gauche */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Mon Top 50 Albums
          </h1>
          {top50.length > 0 && (
            <p className="text-muted-foreground text-sm mt-1">
              {top50.length} album{top50.length > 1 ? "s" : ""} dans votre
              sélection
            </p>
          )}

          {/* Indicateur de chargement subtil */}
          {!mounted && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8 mb-3">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              <span>Chargement...</span>
            </div>
          )}
        </div>

        {/* Actions et paramètres - Barre d'outils discrète */}
        <div
          className="absolute top-4 right-4 flex items-center gap-1"
          suppressHydrationWarning
        >
          {/* Outils secondaires */}
          {mounted && (
            <div className="flex items-center gap-1">
              <TooltipProvider delayDuration={100}>
                {/* Sauvegardes */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setIsBackupDialogOpen(true)}
                      variant="ghost"
                      size="icon"
                      aria-label="Historique et sauvegardes"
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Historique et sauvegardes</TooltipContent>
                </Tooltip>

                {/* Thème */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  aria-label="Changer le thème"
                  suppressHydrationWarning
                >
                  {theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </Button>
              </TooltipProvider>
            </div>
          )}

          {/* Compte Spotify */}
          <SpotifyAuth />
        </div>

        {/* Alert pour les données partagées */}
        {sharedData && (
          <Alert className="mb-8 max-w-2xl mx-auto border-blue-200 bg-blue-50">
            <Music className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Un top {sharedData.length} a été partagé avec vous ! Voulez-vous
                l'importer ?
              </span>
              <div className="flex gap-2 ml-4">
                <Button onClick={importSharedData} size="sm">
                  Importer
                </Button>
                <Button
                  onClick={() => setSharedData(null)}
                  variant="outline"
                  size="sm"
                  className="bg-transparent"
                >
                  Ignorer
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Vue par onglets (mobile uniquement) */}
        <div className="block md:hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {!mounted ? (
              <TabsSkeleton />
            ) : (
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
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
                          <AlertTriangle className="w-3 h-3 text-yellow-500 ml-1" />
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

            <TabsContent value="search" className="space-y-8">
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
                  addToTop50={addToTop50} // Pass the function
                  removeFromTop50={removeFromTop50} // Pass the function
                />
              )}
            </TabsContent>

            <TabsContent value="top50" className="space-y-8">
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Vue en panneaux (desktop uniquement) */}
        <div className="hidden md:block">
          <div className="grid grid-cols-3 min-h-[80vh] border rounded-lg overflow-hidden">
            {/* Panneau Recherche - Gauche */}
            <div className="col-span-1">
              <div className="p-6 h-full overflow-y-auto border-r">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-primary" />
                  <h2 className="text-lg font-medium">Recherche d'albums</h2>
                </div>
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

            {/* Panneau Top 50 - Droite */}
            <div className="col-span-2">
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    <h2 className="text-lg font-medium flex items-center">
                      {top50.length > 0
                        ? `Top 50 (${top50.length})`
                        : "Mon Top 50"}
                      {top50.length > 50 && (
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="w-4 h-4 text-yellow-500 ml-2" />
                            </TooltipTrigger>
                            <TooltipContent>
                              Plus de 50 albums dans votre Top.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </h2>
                  </div>

                  {/* Contrôles desktop - seulement si contenu */}
                  {top50.length > 0 && (
                    <div className="flex items-center gap-1">
                      <TooltipProvider delayDuration={100}>
                        {/* Tri */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={handleSortToggle}
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-muted-foreground hover:text-foreground"
                              aria-label={getSortTooltipText()}
                            >
                              {getSortIcon()}
                              <span className="text-xs">
                                {sortMode === "manual"
                                  ? "Manuel"
                                  : sortDirection === "desc"
                                  ? "↓ Date"
                                  : "↑ Date"}
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {getSortTooltipText()}
                          </TooltipContent>
                        </Tooltip>

                        {/* Tri manuel si en mode date */}
                        {sortMode === "date" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={handleManualSortToggle}
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-muted-foreground hover:text-foreground"
                                aria-label="Activer le tri manuel"
                              >
                                <Hand className="w-3 h-3" />
                                <span className="text-xs">Manuel</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Réorganiser manuellement
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Séparateur */}
                        <div className="w-px h-4 bg-border mx-2"></div>

                        {/* Vider le Top 50 */}
                        <Tooltip>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                aria-label="Vider le Top 50"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span className="text-xs">Vider</span>
                              </Button>
                            </AlertDialogTrigger>
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
                          <TooltipContent>Vider le Top 50</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
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

      {/* Dock flottant en bas - Actions principales */}
      {mounted && top50.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-background/95 backdrop-blur-sm border shadow-lg rounded-full px-4 py-2">
            <TooltipProvider delayDuration={100}>
              <div className="flex items-center gap-2">
                {/* Sauvegarder */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-block">
                      <SpotifySaveButton albums={top50} variant="dock" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Sauvegarder sur Spotify</TooltipContent>
                </Tooltip>

                {/* Partager */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setIsShareDialogOpen(true)}
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Partager votre Top 50</TooltipContent>
                </Tooltip>

                {/* Plein écran */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setIsFullscreen(true)}
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mode plein écran</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      )}

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

      {isFullscreen && (
        <FullscreenView top50={top50} onClose={() => setIsFullscreen(false)} />
      )}
    </div>
  );
}

// Composant pour le contenu de la recherche
const MemoizedSearchContent = React.memo(function SearchContent({
  searchQuery,
  setSearchQuery,
  isLoading,
  hasSearched,
  searchResults,
  handleSearch,
  top50,
  addToTop50, // Receive the function
  removeFromTop50, // Receive the function
  mounted,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  hasSearched: boolean;
  searchResults: Album[];
  handleSearch: () => void;
  top50: Album[];
  addToTop50: (album: Album) => void; // Type the function
  removeFromTop50: (albumId: string) => void; // Type the function
  mounted: boolean;
}) {
  return (
    <div className="space-y-8">
      <div className="relative flex items-center max-w-xl mx-auto">
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
          <p className="text-sm mt-1">Essayez un autre terme de recherche</p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 xl:grid-cols-3">
          {searchResults.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onAdd={() => addToTop50(album)} // Use the passed function
              onRemove={() => removeFromTop50(album.id)} // Use the passed function
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
  );
});

// Composant pour le contenu du Top 50
const MemoizedTop50Content = React.memo(function Top50Content({
  top50,
  setActiveTab,
  sortMode,
  sortDirection,
  handleSortToggle,
  handleManualSortToggle,
  setIsFullscreen,
  setIsShareDialogOpen,
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
  setIsFullscreen: (value: boolean) => void;
  setIsShareDialogOpen: (value: boolean) => void;
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
    <div className="space-y-8">
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
              {/* Tri */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSortToggle}
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground hover:text-foreground"
                    aria-label={getSortTooltipText()}
                  >
                    {getSortIcon()}
                    <span className="text-xs">
                      {sortMode === "manual"
                        ? "Manuel"
                        : sortDirection === "desc"
                        ? "↓ Date"
                        : "↑ Date"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{getSortTooltipText()}</TooltipContent>
              </Tooltip>

              {/* Tri manuel si en mode date */}
              {sortMode === "date" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleManualSortToggle}
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-muted-foreground hover:text-foreground"
                      aria-label="Activer le tri manuel"
                    >
                      <Hand className="w-3 h-3" />
                      <span className="text-xs">Manuel</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Réorganiser manuellement</TooltipContent>
                </Tooltip>
              )}

              {/* Séparateur */}
              <div className="w-px h-4 bg-border mx-2"></div>

              {/* Vider le Top 50 - mobile */}
              <Tooltip>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="Vider le Top 50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="text-xs">Vider</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Êtes-vous absolument sûr ?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action supprimera définitivement tous les albums
                        de votre Top 50. Cette action est irréversible.
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
                <TooltipContent>Vider le Top 50</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Instructions pour le tri manuel */}
          <div className="mb-4">
            {sortMode === "manual" && (
              <p className="text-sm text-muted-foreground text-center">
                Glissez-déposez les albums pour les réorganiser
              </p>
            )}
          </div>

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
  );
});

function AlbumCard({
  album,
  onAdd,
  onRemove,
  isInTop50,
}: {
  album: Album;
  onAdd: () => void;
  onRemove: () => void;
  isInTop50: boolean;
}) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border">
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          <Image
            src={album.cover || "/placeholder.svg"}
            alt={`${album.title} by ${album.artist}`}
            width={200}
            height={200}
            className="w-full aspect-square object-cover"
          />
          {isInTop50 && (
            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm rounded-full p-1 z-10">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            {isInTop50 ? (
              <Button onClick={onRemove} variant="destructive" size="sm">
                <Minus className="w-3 h-3 mr-1" />
                Retirer
              </Button>
            ) : (
              <Button onClick={onAdd} size="sm">
                <Plus className="w-3 h-3 mr-1" />
                Ajouter
              </Button>
            )}
          </div>
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-foreground mb-1 truncate text-sm">
            <a
              href={album.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              {album.title}
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          </h3>
          <p className="text-muted-foreground text-xs mb-2 truncate">
            {album.artist}
          </p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {album.year}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Version compacte pour le Top 50 avec infos au survol
function CompactRankedAlbumCard({
  album,
  rank,
  onRemove,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
}: {
  album: Album;
  rank: number;
  onRemove: () => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, dropIndex: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`group relative transition-all duration-300 ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${isDraggable ? "cursor-move" : ""}`}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, 0)}
      onDragEnd={onDragEnd}
    >
      <div className="relative overflow-hidden rounded-lg group-hover:rounded-b-none transition-all duration-300">
        <Image
          src={album.cover || "/placeholder.svg"}
          alt={`${album.title} by ${album.artist}`}
          width={150}
          height={150}
          className="w-full aspect-square object-cover"
        />

        {/* Bouton supprimer en haut à droite - apparaît au survol */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="w-6 h-6 rounded-full"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir retirer "{album.title}" de votre Top
                  50 ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Drag handle - apparaît au survol */}
        {isDraggable && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-15">
            <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Infos en dessous - position absolue, apparaissent au survol avec animation */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 bg-card border border-border rounded-lg rounded-t-none p-2 shadow-lg z-30">
        <h3 className="font-semibold text-xs mb-1 line-clamp-1">
          <a
            href={album.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            {album.title}
            <ExternalLink className="w-2 h-2 text-muted-foreground" />
          </a>
        </h3>
        <p className="text-muted-foreground text-xs truncate mb-1">
          {album.artist}
        </p>
        <Badge variant="secondary" className="text-xs h-4 px-1">
          {album.year}
        </Badge>
      </div>
    </div>
  );
}

function AlbumSkeleton() {
  return (
    <Card className="border-border animate-pulse">
      <CardContent className="p-0">
        <div className="w-full aspect-square bg-muted rounded-t-lg"></div>
        <div className="p-3">
          <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
          <div className="flex items-center justify-between">
            <div className="h-3 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Nouveaux skeletons pour améliorer le feedback
function TabsSkeleton() {
  return (
    <div className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
      <div className="h-10 bg-muted rounded animate-pulse"></div>
      <div className="h-10 bg-muted rounded animate-pulse"></div>
    </div>
  );
}

function Top50ContentSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 bg-muted rounded-full mb-6 animate-pulse"></div>
        <div className="h-8 bg-muted rounded w-64 mb-4 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-96 mb-8 animate-pulse"></div>
        <div className="h-12 bg-muted rounded w-48 animate-pulse"></div>
      </div>
    </div>
  );
}

function SearchContentSkeleton() {
  return (
    <div className="space-y-8">
      <div className="relative flex items-center max-w-xl mx-auto">
        <div className="h-10 bg-muted rounded-full w-full animate-pulse"></div>
      </div>
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
        <div className="h-6 bg-muted rounded w-64 mx-auto animate-pulse"></div>
      </div>
    </div>
  );
}

// Suppression du ViewModeSkeleton - plus nécessaire

function FullscreenView({
  top50,
  onClose,
}: {
  top50: Album[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-background text-foreground z-50 overflow-hidden max-w-[112rem] mx-auto">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-accent-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex h-full">
        <div className="flex-1 p-12">
          <div className="grid grid-cols-8 gap-3 max-w-7xl">
            {top50.map((album, index) => (
              <div key={album.id} className="relative">
                <Image
                  src={album.cover || "/placeholder.svg"}
                  alt={`${album.title} by ${album.artist}`}
                  width={120}
                  height={120}
                  className="w-full aspect-square object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/4 p-12 overflow-y-auto">
          <div className="space-y-1 text-xs font-mono text-foreground">
            {top50.map((album, index) => (
              <div key={album.id} className="leading-tight">
                <span>
                  {album.artist} - {album.title} ({album.year})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
