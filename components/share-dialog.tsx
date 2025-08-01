"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Music, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSpotifyAuth } from "@/hooks/use-spotify-auth";
import { spotifyService } from "@/lib/spotify";
import type { Album } from "@/lib/spotify";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  albums: Album[];
}

export function ShareDialog({ isOpen, onClose, albums }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("spotify");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [createdPlaylist, setCreatedPlaylist] = useState<any>(null);
  const [isCheckingExisting, setIsCheckingExisting] = useState(false);
  const { toast } = useToast();
  const {
    isAuthenticated: isSpotifyAuthenticated,
    mounted,
    existingPlaylist,
    login,
    checkExistingPlaylist,
    updateExistingPlaylist,
  } = useSpotifyAuth();

  // Vérifier s'il existe déjà une playlist pour ce top au moment de l'ouverture
  useEffect(() => {
    if (
      isOpen &&
      mounted &&
      isSpotifyAuthenticated &&
      albums.length > 0 &&
      !existingPlaylist
    ) {
      console.log("📋 [SHARE-MODAL] Checking for existing playlist on open");
      setIsCheckingExisting(true);
      checkExistingPlaylist(albums).finally(() => {
        setIsCheckingExisting(false);
      });
    }
  }, [
    isOpen,
    mounted,
    isSpotifyAuthenticated,
    albums.length,
    existingPlaylist,
    checkExistingPlaylist,
  ]);

  // Générer le texte de partage
  const generateShareText = () => {
    const header = `🎵 Mon Top ${albums.length} Albums\n\n`;
    const albumList = albums
      .map(
        (album, index) =>
          `${index + 1}. ${album.artist} - ${album.title} (${album.year})`
      )
      .join("\n");
    return header + albumList;
  };

  // Générer le lien de partage basé sur une playlist Spotify
  const generateSpotifyShareLink = (playlistId: string) => {
    if (typeof window === "undefined") return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}?spotify=${playlistId}`;
  };

  const updateUrlWithPlaylist = (playlistId: string) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("spotify", playlistId);
    window.history.replaceState({}, document.title, url.toString());
  };

  // Créer ou mettre à jour la playlist "Top 50 Albums"
  const createOrUpdateSpotifyPlaylist = async () => {
    if (!spotifyService.isUserAuthenticated()) {
      toast({
        title: "Connexion requise",
        description:
          "Vous devez être connecté à Spotify pour créer une playlist",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingPlaylist(true);
    try {
      const result = await spotifyService.createOrUpdateTop50Playlist(albums);

      setCreatedPlaylist(result.playlist);
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
      console.error("Error creating/updating playlist:", error);
      toast({
        title: "Erreur",
        description:
          "Impossible de créer/mettre à jour votre playlist. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  // Copier dans le presse-papiers
  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copié !",
        description: `${type} copié dans le presse-papiers`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de copier dans le presse-papiers",
        variant: "destructive",
      });
    }
  };

  const shareText = generateShareText();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Partager votre Top 50 Albums</DialogTitle>
          <DialogDescription>
            Choisissez comment vous souhaitez partager votre sélection d'albums
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="spotify">Spotify</TabsTrigger>
            <TabsTrigger value="text">Texte</TabsTrigger>
          </TabsList>

          {/* Partage en texte */}
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label>Texte à partager</Label>
              <Textarea
                value={shareText}
                readOnly
                className="min-h-[300px] font-mono text-sm"
              />
            </div>
            <Button
              onClick={() => handleCopy(shareText, "Texte")}
              className="w-full"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Copier le texte
            </Button>
            <p className="text-sm text-gray-500">
              Parfait pour partager sur les réseaux sociaux, forums ou par
              message
            </p>
          </TabsContent>

          {/* Spotify */}
          <TabsContent value="spotify" className="space-y-4">
            <div className="space-y-4">
              {!mounted ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Chargement...</p>
                </div>
              ) : isCheckingExisting ? (
                <div className="text-center py-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">
                      Vérification de votre playlist existante...
                    </span>
                  </div>
                </div>
              ) : !isSpotifyAuthenticated ? (
                <div className="text-center py-8">
                  <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-3">
                    Partageons votre Top 50 Albums !
                  </p>
                  <div className="text-sm text-muted-foreground mb-6 max-w-md mx-auto space-y-2">
                    <p>
                      🎵 <strong>Nous transformons votre Top 50</strong> en
                      playlist Spotify
                    </p>
                    <p>
                      🔗 <strong>Nous créons un lien unique</strong> pour
                      partager votre sélection
                    </p>
                    <p>
                      👥 <strong>Vos amis pourront découvrir</strong> vos albums
                      favoris facilement
                    </p>
                  </div>
                  <Button onClick={login} variant="default" className="gap-2">
                    <Music className="w-4 h-4" />
                    Se connecter à Spotify
                  </Button>
                </div>
              ) : createdPlaylist ? (
                <div className="text-center py-6">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <Music className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-medium mb-3">
                      Nous avons créé votre lien de partage !
                    </h3>
                    <div className="text-sm text-muted-foreground mb-6 max-w-md mx-auto space-y-2">
                      <p>
                        🎵 <strong>Votre playlist Top 50 est créée</strong> sur
                        Spotify
                      </p>
                      <p>
                        🔗 <strong>Lien de partage</strong> prêt à utiliser
                      </p>
                      <p>
                        🔄 <strong>Nous le maintenons à jour</strong>{" "}
                        automatiquement
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            generateSpotifyShareLink(createdPlaylist.id)
                          );
                          toast({
                            title: "Lien copié !",
                            description:
                              "Le lien de partage a été copié dans le presse-papiers",
                          });
                        }}
                        variant="default"
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copier le lien
                      </Button>
                      <Button
                        onClick={() => {
                          setCreatedPlaylist(null);
                          setTimeout(() => {
                            // Vérifier à nouveau s'il y a une playlist existante
                            checkExistingPlaylist(albums);
                          }, 100);
                        }}
                        variant="default"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Music className="w-4 h-4" />
                        Mettre à jour
                      </Button>
                    </div>
                  </div>
                </div>
              ) : existingPlaylist ? (
                <div className="text-center py-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <Music className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg font-medium mb-3">
                      Playlist "Top 50 Albums" trouvée !
                    </h3>
                    <div className="text-sm text-muted-foreground mb-6 max-w-md mx-auto space-y-2">
                      <p>
                        🎵 <strong>Votre Top 50 a été trouvé</strong> sur
                        Spotify
                      </p>
                      <p>
                        🔗 <strong>Partagez votre sélection</strong> avec vos
                        amis
                      </p>
                      <p>
                        🔄 <strong>Mettez à jour</strong> avec vos nouveaux
                        albums
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            generateSpotifyShareLink(existingPlaylist.id)
                          );
                          toast({
                            title: "Lien copié !",
                            description:
                              "Le lien de partage a été copié dans le presse-papiers",
                          });
                        }}
                        variant="default"
                        className="gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        Copier le lien
                      </Button>
                      <Button
                        onClick={createOrUpdateSpotifyPlaylist}
                        disabled={isCreatingPlaylist}
                        variant="default"
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        {isCreatingPlaylist ? (
                          <>
                            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Mise à jour...
                          </>
                        ) : (
                          <>
                            <Music className="w-4 h-4" />
                            Mettre à jour
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Music className="w-12 h-12 mx-auto mb-4 text-primary" />
                  <p className="text-lg font-medium mb-3">
                    Créons le lien de partage de votre Top 50
                  </p>
                  <div className="text-sm text-muted-foreground mb-6 max-w-md mx-auto space-y-2">
                    <p>
                      🎵 <strong>Nous créons votre playlist Top 50</strong> sur
                      Spotify
                    </p>
                    <p>
                      🔗 <strong>Nous générons un lien unique</strong>{" "}
                      automatiquement
                    </p>
                    <p>
                      🔄 <strong>Nous le gardons à jour</strong> avec vos
                      modifications
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={createOrUpdateSpotifyPlaylist}
                      disabled={isCreatingPlaylist}
                      className="gap-2"
                    >
                      {isCreatingPlaylist ? (
                        <>
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Création...
                        </>
                      ) : (
                        <>
                          <Music className="w-4 h-4" />
                          Créer la playlist
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
