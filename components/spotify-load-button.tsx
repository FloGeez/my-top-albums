"use client";

import { useState } from "react";
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
import { RefreshCw } from "lucide-react";

interface SpotifyLoadButtonProps {
  onLoad: (albums: Album[]) => void;
  variant?: "default" | "dock";
  borderless?: boolean;
}

export function SpotifyLoadButton({
  onLoad,
  variant = "default",
  borderless = false,
}: SpotifyLoadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, mounted, login } = useSpotifyAuth();

  const handleLoad = async () => {
    if (!isAuthenticated) {
      setShowLoadModal(true);
      return;
    }

    setIsLoading(true);
    try {
      // Chercher la playlist existante de l'utilisateur
      const existingPlaylist = await spotifyService.findExistingTopPlaylist([]);

      if (existingPlaylist) {
        const loadedAlbums = await spotifyService.loadAlbumsFromPlaylistTracks(
          existingPlaylist.id
        );

        if (loadedAlbums.length > 0) {
          onLoad(loadedAlbums);
          toast({
            title: "Top 50 chargé !",
            description: `${loadedAlbums.length} albums ont été récupérés depuis Spotify`,
          });
        } else {
          throw new Error("Playlist vide");
        }
      } else {
        toast({
          title: "Aucune playlist trouvée",
          description: "Vous n'avez pas encore de playlist Top 50",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading from Spotify:", error);
      toast({
        title: "Erreur de chargement",
        description:
          "Impossible de charger depuis Spotify. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <Button
        disabled
        variant="ghost"
        size="icon"
        className="text-muted-foreground"
      >
        <RefreshCw className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <>
      {variant === "dock" ? (
        // Version dock - bouton icon simple
        <Button
          onClick={handleLoad}
          disabled={isLoading}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      ) : (
        // Version par défaut - bouton avec texte
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Button
                  onClick={handleLoad}
                  disabled={isLoading}
                  variant={borderless ? "ghost" : "outline"}
                  size="sm"
                  className={`gap-2 ${
                    borderless
                      ? "text-muted-foreground hover:text-foreground hover:bg-transparent underline decoration-dotted underline-offset-4"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isLoading ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  {isLoading
                    ? "Chargement..."
                    : borderless
                    ? "Tu as déjà un Top 50 ?"
                    : "Charger depuis Spotify"}
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {isLoading
                ? "Chargement en cours..."
                : !isAuthenticated
                ? "Connecte-toi pour charger ton Top 50"
                : "Charger ton Top 50 depuis Spotify"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Modale d'explication pour le chargement */}
      <Dialog open={showLoadModal} onOpenChange={setShowLoadModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Tu as déjà un Top 50 ?
            </DialogTitle>
            <DialogDescription className="text-center">
              Connecte-toi pour charger ton Top 50 existant
            </DialogDescription>
          </DialogHeader>

          <div className="text-center">
            <RefreshCw className="w-16 h-16 mx-auto text-primary" />
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-lg">🎵</span>
              <div>
                <p className="font-medium">Tu as déjà créé ton Top 50 ?</p>
                <p className="text-muted-foreground">
                  Connecte-toi à Spotify pour récupérer ta playlist sauvegardée
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg">🔐</span>
              <div>
                <p className="font-medium">Connexion rapide et sécurisée</p>
                <p className="text-muted-foreground">
                  On accède uniquement à tes playlists pour la synchronisation
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg">✨</span>
              <div>
                <p className="font-medium">Tu n'as pas encore de Top 50 ?</p>
                <p className="text-muted-foreground">
                  Pas de problème ! On va créer ta première playlist Spotify
                  ensemble
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-2 justify-center">
            <Button
              onClick={() => {
                setShowLoadModal(false);
                login();
              }}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Se connecter à Spotify
            </Button>
            <Button onClick={() => setShowLoadModal(false)} variant="outline">
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
