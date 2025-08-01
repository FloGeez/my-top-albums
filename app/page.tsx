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
  Layout,
  Columns,
  AlertTriangle,
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { spotifyService, type Album } from "@/lib/spotify";
import { ShareDialog } from "@/components/share-dialog";
import { SpotifyAuth } from "@/components/spotify-auth";

import { SpotifySaveButton } from "@/components/spotify-save-button";
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
  const [hasCheckedExistingPlaylist, setHasCheckedExistingPlaylist] =
    useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isCheckingPlaylist, setIsCheckingPlaylist] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, checkExistingPlaylist } = useSpotifyAuth();

  // Fonction utilitaire pour mettre à jour l'URL avec une playlist
  const updateUrlWithPlaylist = (playlistId: string) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("spotify", playlistId);
    window.history.replaceState({}, document.title, url.toString());
  };

  // Fonction pour charger un top depuis une playlist Spotify publique
  const loadTopFromSpotifyPlaylist = async (playlistId: string) => {
    try {
      // Initialiser le service Spotify
      spotifyService.initializeClient();

      // Charger les albums directement depuis les tracks de la playlist (version simplifiée)
      const albums = await spotifyService.loadAlbumsFromPlaylistTracks(
        playlistId
      );

      if (albums.length > 0) {
        setTop50(albums);
        setManualOrder(albums);
        toast({
          title: "Top partagé chargé !",
          description: `${albums.length} albums chargés depuis la playlist Spotify`,
        });
      } else {
        toast({
          title: "Playlist trouvée mais...",
          description: "Cette playlist ne contient pas d'albums",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading top from Spotify playlist:", error);
      toast({
        title: "Erreur de chargement",
        description:
          "Impossible de charger le top depuis cette playlist Spotify",
        variant: "destructive",
      });
    }
  };

  // Déterminer le mode de vue par défaut basé sur la taille de l'écran
  useEffect(() => {
    // Suppression du useEffect de resize - on utilise uniquement les classes responsive Tailwind
  }, []);

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
      // Charger le top depuis une playlist Spotify
      loadTopFromSpotifyPlaylist(spotifyParam);

      // Nettoyer l'URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Détecter et mettre à jour l'URL si une playlist "Top 50 Albums" existe
  useEffect(() => {
    console.log("🎵 [SPOTIFY] useEffect triggered - checking conditions:", {
      mounted,
      top50Length: top50.length,
      hasCheckedExistingPlaylist,
      isInitializing,
    });

    const checkAndUpdateUrlForExistingPlaylist = async () => {
      console.log("🔍 [SPOTIFY] checkAndUpdateUrlForExistingPlaylist called");

      if (
        typeof window === "undefined" ||
        !mounted ||
        hasCheckedExistingPlaylist ||
        isInitializing
      ) {
        console.log("❌ [SPOTIFY] Skipping check - conditions not met");
        return;
      }

      // Ne faire cela que si l'URL ne contient pas déjà un paramètre spotify
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("spotify")) {
        console.log("🔗 [SPOTIFY] URL already has spotify param - skipping");
        setHasCheckedExistingPlaylist(true);
        return;
      }

      // Initialiser le service Spotify et vérifier l'authentification
      console.log("🔐 [SPOTIFY] Checking authentication...");
      spotifyService.initializeClient();
      if (!spotifyService.isUserAuthenticated()) {
        console.log("❌ [SPOTIFY] User not authenticated - skipping");
        setHasCheckedExistingPlaylist(true);
        return;
      }

      // Vérifier s'il y a des albums dans le top50
      const albumsToCheck = top50;
      console.log("📋 [SPOTIFY] Albums to check:", albumsToCheck.length);
      if (albumsToCheck.length === 0) {
        console.log("❌ [SPOTIFY] No albums to check - skipping");
        setHasCheckedExistingPlaylist(true);
        return;
      }

      // Afficher un indicateur de chargement
      console.log("⏳ [SPOTIFY] Starting playlist search...");
      setIsCheckingPlaylist(true);

      try {
        const existingPlaylist = await spotifyService.findExistingTopPlaylist(
          albumsToCheck
        );
        if (existingPlaylist) {
          console.log(
            "✅ [SPOTIFY] Found existing playlist:",
            existingPlaylist.id
          );
          // Mettre à jour l'URL avec l'ID de la playlist trouvée
          updateUrlWithPlaylist(existingPlaylist.id);
          console.log(
            "🔗 [SPOTIFY] URL updated with existing playlist:",
            existingPlaylist.id
          );

          // Charger les albums depuis la playlist trouvée (version simplifiée)
          console.log("🔄 [SPOTIFY] Loading albums from found playlist");
          try {
            const albums = await spotifyService.loadAlbumsFromPlaylistTracks(
              existingPlaylist.id
            );
            console.log(
              "✅ [SPOTIFY] Loaded",
              albums.length,
              "albums from playlist"
            );
            setTop50(albums);
            setManualOrder(albums);
            toast({
              title: "🔗 Playlist chargée !",
              description: `${albums.length} albums chargés depuis votre playlist existante`,
              duration: 3000,
            });
          } catch (error) {
            console.error(
              "❌ [SPOTIFY] Error loading albums from playlist:",
              error
            );
            toast({
              title: "⚠️ Erreur de chargement",
              description:
                "Impossible de charger les albums depuis la playlist",
              variant: "destructive",
            });
          }
        } else {
          console.log("❌ [SPOTIFY] No existing playlist found");
        }
      } catch (error) {
        console.error(
          "❌ [SPOTIFY] Error checking for existing playlist:",
          error
        );
        // Error is logged but not used further
      } finally {
        console.log("🏁 [SPOTIFY] Playlist check completed");
        setIsCheckingPlaylist(false);
        setHasCheckedExistingPlaylist(true);
      }
    };

    // Attendre que l'initialisation soit terminée et qu'il y ait des albums
    // IMPORTANT: Ne pas inclure top50 dans les dépendances pour éviter les boucles
    if (
      !isInitializing &&
      mounted &&
      top50.length > 0 &&
      !hasCheckedExistingPlaylist
    ) {
      console.log("⏰ [SPOTIFY] Setting timer for playlist check in 2000ms");
      const timer = setTimeout(checkAndUpdateUrlForExistingPlaylist, 2000);
      return () => {
        console.log("🚫 [SPOTIFY] Clearing playlist check timer");
        clearTimeout(timer);
      };
    } else {
      console.log("⏸️ [SPOTIFY] Not ready for playlist check yet");
    }
  }, [mounted, hasCheckedExistingPlaylist, isInitializing, toast]); // Retiré top50 des dépendances

  // Vérifier automatiquement l'existence d'une playlist quand l'utilisateur se connecte
  useEffect(() => {
    if (mounted && isAuthenticated && !hasCheckedExistingPlaylist) {
      console.log(
        "🔍 [AUTH-CHECK] User connected, checking for existing playlist"
      );
      const checkPlaylistAfterAuth = async () => {
        try {
          // Si pas d'albums dans le top50, on vérifie quand même les playlists existantes
          const albumsToCheck = top50.length > 0 ? top50 : [];
          const existingPlaylist = await checkExistingPlaylist(albumsToCheck);
          if (existingPlaylist) {
            console.log(
              "✅ [AUTH-CHECK] Found existing playlist after auth:",
              existingPlaylist.id
            );
            updateUrlWithPlaylist(existingPlaylist.id);

            // Charger les albums depuis la playlist trouvée (version simplifiée)
            console.log("🔄 [AUTH-CHECK] Loading albums from found playlist");
            try {
              const albums = await spotifyService.loadAlbumsFromPlaylistTracks(
                existingPlaylist.id
              );
              console.log(
                "✅ [AUTH-CHECK] Loaded",
                albums.length,
                "albums from playlist"
              );
              setTop50(albums);
              setManualOrder(albums);
              toast({
                title: "🔗 Playlist chargée !",
                description: `${albums.length} albums chargés depuis votre playlist existante`,
                duration: 3000,
              });
            } catch (error) {
              console.error(
                "❌ [AUTH-CHECK] Error loading albums from playlist:",
                error
              );
              toast({
                title: "⚠️ Erreur de chargement",
                description:
                  "Impossible de charger les albums depuis la playlist",
                variant: "destructive",
              });
            }
          } else {
            console.log(
              "❌ [AUTH-CHECK] No existing playlist found after auth"
            );
          }
        } catch (error) {
          console.error(
            "❌ [AUTH-CHECK] Error checking playlist after auth:",
            error
          );
        } finally {
          // Marquer comme vérifié pour éviter les boucles
          console.log("🏁 [AUTH-CHECK] Marking as checked to prevent loops");
          setHasCheckedExistingPlaylist(true);
        }
      };

      // Délai pour laisser le temps à l'authentification de se stabiliser
      const timer = setTimeout(checkPlaylistAfterAuth, 1000);
      return () => clearTimeout(timer);
    }
  }, [
    mounted,
    isAuthenticated,
    hasCheckedExistingPlaylist,
    checkExistingPlaylist,
    updateUrlWithPlaylist,
    toast,
  ]);

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
      return <GripVertical className="w-4 h-4" />;
    } else {
      return sortDirection === "desc" ? (
        <ArrowDown className="w-4 h-4" />
      ) : (
        <ArrowUp className="w-4 h-4" />
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mt-4 mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            TOP 50 Albums
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            Créez votre sélection personnelle des meilleurs albums
          </p>

          {/* Indicateur de chargement subtil */}
          {!mounted && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8 mb-3">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              <span>Chargement...</span>
            </div>
          )}

          {/* Barre d'actions principales */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <TooltipProvider delayDuration={100}>
              {/* Bouton Sauvegarder Spotify */}
              {mounted && <SpotifySaveButton albums={top50} />}

              {/* Bouton Partager */}
              {mounted && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="inline-block">
                      <Button
                        onClick={() => setIsShareDialogOpen(true)}
                        variant="default"
                        size="default"
                        className="gap-2"
                        disabled={top50.length === 0}
                      >
                        <Share className="w-4 h-4" />
                        Partager
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {top50.length === 0
                      ? "Ajoutez des albums à votre Top pour partager"
                      : "Partager votre Top 50"}
                  </TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>

        {/* Paramètres en haut à droite */}
        <div
          className="absolute top-4 right-4 flex items-center gap-2"
          suppressHydrationWarning
        >
          {/* Spotify Auth */}
          <SpotifyAuth />

          {/* Suppression du toggle des vues - on utilise uniquement les classes responsive Tailwind */}

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          )}
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
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="top50" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Top 50 ({top50.length})
                  {top50.length > 50 && (
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle className="w-4 h-4 text-yellow-500 ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Votre Top 50 contient plus de 50 albums.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </TabsTrigger>
                <TabsTrigger value="search" className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Recherche
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
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[800px] rounded-lg border"
          >
            {/* Panneau Top 50 */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold flex items-center">
                    Top 50 ({top50.length})
                    {top50.length > 50 && (
                      <TooltipProvider delayDuration={100}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <AlertTriangle className="w-5 h-5 text-yellow-500 ml-2" />
                          </TooltipTrigger>
                          <TooltipContent>
                            Votre Top 50 contient plus de 50 albums.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </h2>
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
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Panneau Recherche */}
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="p-6 h-full overflow-y-auto">
                <div className="flex items-center gap-2 mb-6">
                  <Search className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Recherche</h2>
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
                    addToTop50={addToTop50} // Pass the function
                    removeFromTop50={removeFromTop50} // Pass the function
                  />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        albums={top50}
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
          placeholder="Rechercher un album, artiste..."
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
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <AlbumSkeleton key={i} />
          ))}
        </div>
      ) : hasSearched && searchResults.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Music className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg">
            Aucun album trouvé pour votre recherche. Essayez un autre terme !
          </p>
        </div>
      ) : searchResults.length > 0 ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
          <Music className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg">
            Commencez à taper pour rechercher des albums !
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
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <Music className="w-12 h-12 text-primary mb-6 animate-bounce-in" />
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Votre Top 50 attend d'être rempli !
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md">
            Commencez dès maintenant à rechercher et à ajouter vos albums
            préférés pour créer votre sélection ultime.
          </p>
          <div className={`md:hidden`}>
            <Button
              onClick={() => setActiveTab("search")}
              size="lg"
              className="px-4"
            >
              <Search className="w-5 h-5 mr-1" />
              Commencer à explorer
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Votre Top 50
            </h2>
            <p className="text-muted-foreground mb-4">
              {top50.length} album{top50.length > 1 ? "s" : ""} sélectionné
              {top50.length > 1 ? "s" : ""}
            </p>

            <div className="flex items-center justify-center gap-4">
              <TooltipProvider delayDuration={100}>
                {/* Bouton de tri */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSortToggle}
                      variant="outline"
                      size="icon"
                      aria-label={getSortTooltipText()}
                    >
                      {getSortIcon()}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{getSortTooltipText()}</TooltipContent>
                </Tooltip>

                {/* Bouton pour activer le tri manuel (si en mode date) */}
                {sortMode === "date" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleManualSortToggle}
                        variant="outline"
                        size="icon"
                        aria-label="Activer le tri manuel"
                      >
                        <GripVertical className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Activer le tri manuel</TooltipContent>
                  </Tooltip>
                )}

                {/* Bouton Mode plein écran */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setIsFullscreen(true)}
                      variant="outline"
                      size="icon"
                      aria-label="Mode plein écran"
                    >
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Mode plein écran</TooltipContent>
                </Tooltip>

                {/* Bouton Vider le Top 50 */}
                <Tooltip>
                  {" "}
                  {/* Outer Tooltip */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Vider le Top 50"
                      >
                        <Trash2 className="w-4 h-4" />
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
                  <TooltipContent>Vider le Top 50</TooltipContent>{" "}
                  {/* Tooltip for the AlertDialogTrigger */}
                </Tooltip>
              </TooltipProvider>
            </div>

            {sortMode === "manual" && (
              <p className="text-sm text-muted-foreground mt-2">
                Glissez-déposez les albums pour les réorganiser
              </p>
            )}
          </div>

          <div
            className={`grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`}
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
