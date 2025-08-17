"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  ExternalLink,
  Music,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { BackupManager } from "@/lib/backup-manager";
import type { Album } from "@/lib/spotify";
import { useToast } from "@/hooks/use-toast";
import { useSpotifyAuth } from "@/hooks/use-spotify-auth";

interface PlaylistLoaderProps {
  currentAlbums: Album[];
  spotifyPlaylistId?: string;
  isFromSharedLink?: boolean;
  isAuthenticated: boolean;
  onLoadOwnPlaylist: () => Promise<void>;
  onLoadSharedPlaylist: (playlistId: string) => Promise<void>;
  hasLoadedContent?: boolean; // Nouveau prop pour savoir si du contenu a été chargé
  onResetLoadState?: () => void; // Fonction pour réinitialiser l'état de chargement
}

export function PlaylistLoader({
  currentAlbums,
  spotifyPlaylistId,
  isFromSharedLink,
  isAuthenticated,
  onLoadOwnPlaylist,
  onLoadSharedPlaylist,
  hasLoadedContent = false,
  onResetLoadState,
}: PlaylistLoaderProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<() => void>(() => {});
  const [isLoading, setIsLoading] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { toast } = useToast();
  const { login } = useSpotifyAuth();

  const handleLoadWithBackup = async (
    action: () => Promise<void>,
    description: string
  ) => {
    if (currentAlbums.length > 0) {
      // Créer une sauvegarde avant de charger
      BackupManager.manualBackup(
        currentAlbums,
        `Avant ${description}`,
        "local"
      );
    }

    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      console.error("Error loading playlist:", error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger la playlist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmAndExecute = (
    action: () => Promise<void>,
    description: string
  ) => {
    if (currentAlbums.length > 0) {
      setPendingAction(() => () => handleLoadWithBackup(action, description));
      setShowConfirmDialog(true);
    } else {
      handleLoadWithBackup(action, description);
    }
  };

  const handleOwnPlaylistLoad = () => {
    if (!isAuthenticated) {
      setShowConnectionModal(true);
      return;
    }
    confirmAndExecute(onLoadOwnPlaylist, "chargement de votre Top");
  };

  const handleSharedPlaylistLoad = () => {
    if (!spotifyPlaylistId) return;
    confirmAndExecute(
      () => onLoadSharedPlaylist(spotifyPlaylistId),
      "chargement du Top partagé"
    );
  };

  const executeAction = async () => {
    setShowConfirmDialog(false);
    await pendingAction();
  };

  // Toujours afficher le composant pour permettre la connexion

  // Si du contenu a été chargé depuis Spotify, on affiche un bouton discret pour recharger
  if (hasLoadedContent && (spotifyPlaylistId || isAuthenticated)) {
    return (
      <div className="mb-4 text-center">
        <Button
          onClick={onResetLoadState}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1"
        >
          <Download className="w-3 h-3" />
          Charger mon Top
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Playlist partagée disponible */}
        {spotifyPlaylistId && isFromSharedLink && (
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                Top partagé détecté
              </CardTitle>
              <CardDescription className="text-xs">
                Un Top 50 a été partagé avec vous
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music className="w-3 h-3" />
                  <span>Top 50 Albums</span>
                </div>
                <Button
                  onClick={handleSharedPlaylistLoad}
                  size="sm"
                  disabled={isLoading}
                  className="gap-1"
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  Charger
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bouton pour charger son Top - toujours disponible */}
        <div className="text-center">
          <Button
            onClick={handleOwnPlaylistLoad}
            variant="outline"
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isAuthenticated
              ? "Charger mon Top"
              : "Se connecter pour charger mon Top"}
          </Button>
        </div>
      </div>

      {/* Dialog de confirmation */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Remplacer votre Top 50 actuel ?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Vous avez actuellement{" "}
                <strong>{currentAlbums.length} albums</strong> dans votre Top
                50.
              </p>
              <p>
                Le chargement de la playlist va remplacer votre sélection
                actuelle. Une sauvegarde sera automatiquement créée pour que
                vous puissiez revenir en arrière si nécessaire.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>
              Continuer et charger
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de connexion Spotify */}
      <Dialog open={showConnectionModal} onOpenChange={setShowConnectionModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center">
              Connectez-vous pour charger votre Top 50 !
            </DialogTitle>
            <DialogDescription className="text-center">
              Accédez à votre Top 50 sauvegardé sur Spotify
            </DialogDescription>
          </DialogHeader>

          <div className="text-center">
            <Music className="w-16 h-16 mx-auto text-primary" />
          </div>

          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-lg">🔍</span>
              <div>
                <p className="font-medium">Nous cherchons votre Top 50</p>
                <p className="text-muted-foreground">
                  Nous allons rechercher votre playlist "🎵 Top 50 Albums" sur
                  Spotify
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg">📥</span>
              <div>
                <p className="font-medium">Nous chargeons vos albums</p>
                <p className="text-muted-foreground">
                  Votre sélection d'albums sera automatiquement restaurée ici
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg">🎯</span>
              <div>
                <p className="font-medium">Vous retrouvez votre travail</p>
                <p className="text-muted-foreground">
                  Continuez à modifier votre Top 50 là où vous l'aviez laissé
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-2 justify-center">
            <Button
              onClick={() => {
                setShowConnectionModal(false);
                login();
              }}
              className="gap-2"
            >
              <Music className="w-4 h-4" />
              Se connecter et charger
            </Button>
            <Button
              onClick={() => setShowConnectionModal(false)}
              variant="outline"
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
