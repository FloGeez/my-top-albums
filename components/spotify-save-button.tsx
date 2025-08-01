"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useSpotifyAuth } from "@/hooks/use-spotify-auth";
import { spotifyService, Album } from "@/lib/spotify";
import { Music, RefreshCw } from "lucide-react";

interface SpotifySaveButtonProps {
  albums: Album[];
}

export function SpotifySaveButton({ albums }: SpotifySaveButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingPlaylist, setIsCheckingPlaylist] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const { toast } = useToast();
  const {
    isAuthenticated,
    mounted,
    existingPlaylist,
    login,
    checkExistingPlaylist,
    updateExistingPlaylist,
  } = useSpotifyAuth();

  // Plus besoin de ce useEffect car le hook gère l'authentification

  // Vérifier s'il existe une playlist - uniquement si pas déjà vérifiée
  useEffect(() => {
    console.log("💾 [SAVE-BTN] useEffect triggered:", {
      mounted,
      isAuthenticated,
      albumsLength: albums.length,
      existingPlaylistId: existingPlaylist?.id || null,
    });

    // Ne vérifier que si toutes les conditions sont remplies ET qu'on n'a pas déjà une playlist
    if (mounted && isAuthenticated && albums.length > 0 && !existingPlaylist) {
      console.log("💾 [SAVE-BTN] Calling checkExistingPlaylist from hook");
      setIsCheckingPlaylist(true);
      checkExistingPlaylist(albums).finally(() => {
        setIsCheckingPlaylist(false);
      });
    } else {
      console.log(
        "💾 [SAVE-BTN] Conditions not met or playlist already exists"
      );
    }
  }, [
    mounted,
    isAuthenticated,
    albums.length, // Utiliser length au lieu de l'array complet
    checkExistingPlaylist,
    existingPlaylist,
  ]);

  const updateUrlWithPlaylist = (playlistId: string) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("spotify", playlistId);
    window.history.replaceState({}, document.title, url.toString());
  };

  const handleSave = async () => {
    console.log("💾 [SAVE-BTN] handleSave called:", {
      isAuthenticated,
      albumsLength: albums.length,
      existingPlaylist: existingPlaylist?.id,
    });

    if (!isAuthenticated) {
      console.log(
        "💾 [SAVE-BTN] User not authenticated, showing explanation modal"
      );
      setShowExplanationModal(true);
      return;
    }

    if (albums.length === 0) {
      toast({
        title: "Aucun album",
        description: "Ajoutez des albums à votre top avant de sauvegarder",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log("💾 [SAVE-BTN] Creating/updating playlist...");
      const result = await spotifyService.createOrUpdateTop50Playlist(albums);

      // Mettre à jour l'état de la playlist existante dans le hook
      updateExistingPlaylist(result.playlist);

      // Mettre à jour l'URL avec l'ID de la playlist
      updateUrlWithPlaylist(result.playlist.id);

      toast({
        title: result.isUpdate ? "Playlist mise à jour !" : "Playlist créée !",
        description: `${result.tracksAdded} morceaux ${
          result.isUpdate ? "mis à jour dans" : "ajoutés à"
        } votre playlist "Top 50 Albums". L'URL a été mise à jour avec le lien de partage !`,
      });
    } catch (error) {
      console.error("Error saving to Spotify:", error);
      toast({
        title: "Erreur de sauvegarde",
        description:
          "Impossible de sauvegarder sur Spotify. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!mounted) {
    return (
      <Button disabled variant="outline" size="icon">
        <Music className="w-4 h-4" />
      </Button>
    );
  }

  // Le bouton est maintenant toujours cliquable

  // Afficher un skeleton si pas encore monté
  if (!mounted) {
    return <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>;
  }

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleSave}
              disabled={isSaving || isCheckingPlaylist || albums.length === 0}
              variant={
                isAuthenticated && existingPlaylist ? "default" : "outline"
              }
              size="default"
              className={`gap-2 ${
                isAuthenticated && existingPlaylist
                  ? "bg-green-600 hover:bg-green-700"
                  : ""
              }`}
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isCheckingPlaylist ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Music className="w-4 h-4" />
              )}
              {isSaving
                ? "Sauvegarde..."
                : isCheckingPlaylist
                ? "Vérification..."
                : isAuthenticated && existingPlaylist
                ? "Mettre à jour"
                : "Sauvegarder"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {albums.length === 0
              ? "Ajoutez des albums pour sauvegarder"
              : isCheckingPlaylist
              ? "Vérification de votre playlist existante..."
              : !isAuthenticated
              ? "Sauvegardons votre sélection d'albums"
              : isAuthenticated && existingPlaylist
              ? "Mettre à jour votre playlist Spotify"
              : "Sauvegarder sur Spotify"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Modale d'explication pour la sauvegarde */}
      <Dialog
        open={showExplanationModal}
        onOpenChange={setShowExplanationModal}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Sauvegardons votre sélection d'albums !
            </DialogTitle>
            <DialogDescription className="text-center">
              Découvrez tous les avantages de persister votre Top 50
            </DialogDescription>
          </DialogHeader>

          <div className="text-center">
            <Music className="w-16 h-16 mx-auto text-primary" />
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-lg">🔒</span>
              <div>
                <p className="font-medium">Nous sauvegardons votre travail</p>
                <p className="text-muted-foreground">
                  Votre Top 50 ne sera jamais perdu, même si vous changez
                  d'appareil
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg">🔗</span>
              <div>
                <p className="font-medium">Nous créons un lien de partage</p>
                <p className="text-muted-foreground">
                  Partagez facilement votre sélection avec vos amis sur tous les
                  réseaux
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg">🎵</span>
              <div>
                <p className="font-medium">Nous créons une playlist Spotify</p>
                <p className="text-muted-foreground">
                  Votre Top 50 devient une playlist sur Spotify pour découvrir
                  vos albums
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg">🔄</span>
              <div>
                <p className="font-medium">Nous le gardons à jour</p>
                <p className="text-muted-foreground">
                  Chaque modification de votre top est automatiquement
                  synchronisée
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-2 justify-center">
            <Button
              onClick={() => {
                setShowExplanationModal(false);
                login();
              }}
              className="gap-2"
            >
              <Music className="w-4 h-4" />
              Se connecter à Spotify
            </Button>
            <Button
              onClick={() => setShowExplanationModal(false)}
              variant="outline"
            >
              Plus tard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
