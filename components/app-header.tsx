import React from "react";
import { Music, Clock, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SpotifyAuth } from "@/components/spotify-auth";
import { BackupManagerDialog } from "@/components/backup-manager-dialog";
import { type Album } from "@/lib/spotify";

interface AppHeaderProps {
  top50: Album[];
  mounted: boolean;
  theme: string | undefined;
  setTheme: (theme: string) => void;
  sharedPlaylistId: string | null;
  isFromSharedLink: boolean | null;
  loadSharedPlaylist: (playlistId: string) => void;
  sharedData: Album[] | null;
  importSharedData: () => void;
  setSharedData: (data: Album[] | null) => void;
}

export function AppHeader({
  top50,
  mounted,
  theme,
  setTheme,
  sharedPlaylistId,
  isFromSharedLink,
  loadSharedPlaylist,
  sharedData,
  importSharedData,
  setSharedData,
}: AppHeaderProps) {
  const [isBackupDialogOpen, setIsBackupDialogOpen] = React.useState(false);
  return (
    <div className="flex-shrink-0 p-4">
      <div className="max-w-7xl mx-auto">
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
        <div className="mb-2 mt-12 md:mt-0">
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
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
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
      </div>

      <BackupManagerDialog
        isOpen={isBackupDialogOpen}
        onClose={() => setIsBackupDialogOpen(false)}
        onRestore={(albums) => {
          // Cette fonction sera passée depuis le composant parent
          console.log("Restore albums:", albums);
        }}
        currentAlbums={top50}
      />
    </div>
  );
}
