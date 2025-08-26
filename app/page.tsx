"use client";

import React from "react";
import type { ReactNode } from "react";

import { useState, useEffect } from "react";
import {
  Music,
  Clock,
  Sun,
  Moon,
  RefreshCw,
  Hand,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { FullscreenView } from "@/components/fullscreen-view";
import { AppHeader } from "@/components/app-header";
import { FloatingDock } from "@/components/floating-dock";
import { LoadSpotifyDialog } from "@/components/load-spotify-dialog";
import { MainView } from "@/components/main-view";

export default function MusicApp() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Album[]>([]);
  const [top50, setTop50] = useState<Album[]>([]);
  const [activeTab, setActiveTab] = useState("top50");
  // Suppression du state viewMode - on utilise uniquement les classes responsive Tailwind
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

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
        sharedData={sharedData}
        importSharedData={importSharedData}
        setSharedData={setSharedData}
      />

      {/* Vue en panneaux (desktop uniquement) */}

      {/* Contenu principal - Prend toute la hauteur restante */}
      <div className="flex-1 min-h-0 px-4 pb-14">
        <div className="max-w-7xl mx-auto h-full">
          <MainView
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            mounted={mounted}
            top50={top50}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isLoading={isLoading}
            hasSearched={hasSearched}
            searchResults={searchResults}
            handleSearch={handleSearch}
            addToTop50={addToTop50}
            removeFromTop50={removeFromTop50}
            sortMode={sortMode}
            sortDirection={sortDirection}
            handleSortToggle={handleSortToggle}
            handleManualSortToggle={handleManualSortToggle}
            clearTop50={clearTop50}
            handleDragStart={handleDragStart}
            handleDragOver={handleDragOver}
            handleDrop={handleDrop}
            handleDragEnd={handleDragEnd}
            draggedItem={draggedItem}
            getSortIcon={getSortIcon}
            getSortTooltipText={getSortTooltipText}
          />
        </div>
      </div>

      {/* Dock flottant en bas - Actions principales */}
      <FloatingDock
        mounted={mounted}
        top50={top50}
        isAuthenticated={isAuthenticated}
        onLoadOwnPlaylist={() => {
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
    </div>
  );
}

// Composant pour le contenu du Top 50
