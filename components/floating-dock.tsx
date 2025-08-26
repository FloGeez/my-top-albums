import React from "react";
import { Link, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SpotifySaveButton } from "@/components/spotify-save-button";
import { ShareDialog } from "@/components/share-dialog";
import { LoadSpotifyDialog } from "@/components/load-spotify-dialog";
import { type Album } from "@/lib/spotify";

interface FloatingDockProps {
  mounted: boolean;
  top50: Album[];
  isAuthenticated: boolean;
  onLoadOwnPlaylist: () => void;
  onLogin: () => void;
}

export function FloatingDock({
  mounted,
  top50,
  isAuthenticated,
  onLoadOwnPlaylist,
  onLogin,
}: FloatingDockProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = React.useState(false);
  if (!mounted) return null;

  return (
    <div className="fixed bottom-1 left-1/2 transform -translate-x-1/2 z-40 p-2 pb-6 pt-0">
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

            {/* Charger */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setIsLoadDialogOpen(true)}
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Charger depuis Spotify</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        albums={top50}
      />

      <LoadSpotifyDialog
        isOpen={isLoadDialogOpen}
        onOpenChange={setIsLoadDialogOpen}
        isAuthenticated={isAuthenticated}
        onLoad={onLoadOwnPlaylist}
        onLogin={onLogin}
      />
    </div>
  );
}
