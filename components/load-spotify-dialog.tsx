import React from "react";
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

interface LoadSpotifyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isAuthenticated: boolean;
  onLoad: () => void;
  onLogin: () => void;
}

export function LoadSpotifyDialog({
  isOpen,
  onOpenChange,
  isAuthenticated,
  onLoad,
  onLogin,
}: LoadSpotifyDialogProps) {
  const handleAction = () => {
    if (isAuthenticated) {
      onLoad();
    } else {
      onLogin();
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Charger depuis Spotify</AlertDialogTitle>
          <AlertDialogDescription>
            {isAuthenticated ? (
              <div className="space-y-4">
                <p>
                  Voulez-vous charger votre Top 50 depuis votre playlist Spotify
                  ?
                </p>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Cette action remplacera votre Top 50 actuel par celui de
                    votre playlist Spotify.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p>
                  Pour charger votre Top 50 depuis Spotify, vous devez d'abord
                  vous connecter.
                </p>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Vous serez redirigé vers Spotify pour autoriser l'accès à
                    vos playlists.
                  </p>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleAction}>
            {isAuthenticated ? "Charger" : "Se connecter"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
