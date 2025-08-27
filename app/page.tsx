"use client";

import { useState, useEffect } from "react";
import { Hand, Calendar } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { spotifyService, type Album } from "@/lib/spotify";
import { BackupManager } from "@/lib/backup-manager";
import { useTheme } from "next-themes";
import { useSpotifyAuth } from "@/hooks/use-spotify-auth";

// Import des composants refactorisés
import { AppHeader } from "@/components/app-header";
import { FloatingDock } from "@/components/floating-dock";
import { MainView } from "@/components/main-view";

export default function MusicApp() {
  const [top50, setTop50] = useState<Album[]>([]);

  const [sharedData, setSharedData] = useState<Album[] | null>(null);
  const { toast } = useToast();

  const [manualOrder, setManualOrder] = useState<Album[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [sharedPlaylistId, setSharedPlaylistId] = useState<string | null>(null);
  const [isFromSharedLink, setIsFromSharedLink] = useState<boolean | null>(
    null
  );

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

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      return [];
    }

    try {
      const results = await spotifyService.searchAlbums(query);
      return results;
    } catch (error) {
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher les albums. Veuillez réessayer.",
        variant: "destructive",
      });
      return [];
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

    setTop50(newTop50);
    setManualOrder(newTop50);
  };

  const importSharedData = () => {
    if (sharedData) {
      setTop50(sharedData);
      setManualOrder(sharedData);
      setSharedData(null);
      toast({
        title: "Albums importés !",
        description: `${sharedData.length} albums ont été ajoutés à votre top 50`,
      });
    }
  };

  const removeFromTop50 = (albumId: string) => {
    const newTop50 = top50.filter((album) => album.id !== albumId);
    setTop50(newTop50);
    setManualOrder(newTop50);
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
            mounted={mounted}
            top50={top50}
            handleSearch={handleSearch}
            addToTop50={addToTop50}
            removeFromTop50={removeFromTop50}
            clearTop50={clearTop50}
            onTop50Change={(newTop50) => {
              setTop50(newTop50);
              setManualOrder(newTop50);
            }}
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
