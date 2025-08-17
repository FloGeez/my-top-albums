"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Clock,
  Download,
  Trash2,
  Music,
  Smartphone,
  Cloud,
  Share2,
  AlertTriangle,
  Undo2,
} from "lucide-react";
import { BackupManager, type BackupEntry } from "@/lib/backup-manager";
import type { Album } from "@/lib/spotify";
import { useToast } from "@/hooks/use-toast";

interface BackupManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestore: (albums: Album[]) => void;
  currentAlbums: Album[];
}

export function BackupManagerDialog({
  isOpen,
  onClose,
  onRestore,
  currentAlbums,
}: BackupManagerDialogProps) {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      loadBackups();
      // Nettoyer les anciennes sauvegardes
      BackupManager.cleanupOldBackups();
    }
  }, [isOpen, mounted]);

  const loadBackups = () => {
    const allBackups = BackupManager.getBackups();
    setBackups(allBackups);
  };

  const handleRestore = (backup: BackupEntry) => {
    const albums = BackupManager.restoreBackup(backup.id);
    if (albums) {
      onRestore(albums);
      toast({
        title: "Sauvegarde restaurée !",
        description: `${albums.length} albums ont été restaurés`,
      });
      onClose();
    } else {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer cette sauvegarde",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (backupId: string) => {
    BackupManager.deleteBackup(backupId);
    loadBackups();
    toast({
      title: "Sauvegarde supprimée",
      description: "La sauvegarde a été supprimée",
    });
  };

  const createManualBackup = () => {
    const description = `Sauvegarde manuelle - ${currentAlbums.length} albums`;
    BackupManager.manualBackup(currentAlbums, description, "local");
    loadBackups();
    toast({
      title: "Sauvegarde créée !",
      description: "Votre Top 50 actuel a été sauvegardé",
    });
  };

  const getSourceIcon = (source: BackupEntry["source"]) => {
    switch (source) {
      case "local":
        return <Smartphone className="w-4 h-4" />;
      case "spotify":
        return <Cloud className="w-4 h-4" />;
      case "shared":
        return <Share2 className="w-4 h-4" />;
      default:
        return <Music className="w-4 h-4" />;
    }
  };

  const getSourceColor = (source: BackupEntry["source"]) => {
    switch (source) {
      case "local":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "spotify":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "shared":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (!mounted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Gestionnaire de sauvegardes
          </DialogTitle>
          <DialogDescription>
            Gérez vos sauvegardes locales et restaurez d'anciennes versions de
            votre Top 50
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">
                Sauvegardez avant de charger du contenu externe
              </span>
            </div>
            <Button onClick={createManualBackup} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Sauvegarder maintenant
            </Button>
          </div>

          {/* Liste des sauvegardes */}
          <ScrollArea className="h-96">
            {backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Aucune sauvegarde trouvée</p>
                <p className="text-sm">Vos sauvegardes apparaîtront ici</p>
              </div>
            ) : (
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div
                    key={backup.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getSourceColor(backup.source)}`}
                        >
                          {getSourceIcon(backup.source)}
                          <span className="ml-1">
                            {backup.source === "local" && "Local"}
                            {backup.source === "spotify" && "Spotify"}
                            {backup.source === "shared" && "Partagé"}
                          </span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {BackupManager.formatDate(backup.timestamp)}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm truncate">
                        {backup.description}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {BackupManager.getContentSummary(backup.albums)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 ml-3">
                      <Button
                        onClick={() => handleRestore(backup)}
                        variant="outline"
                        size="sm"
                        className="gap-1"
                      >
                        <Undo2 className="w-3 h-3" />
                        Restaurer
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Supprimer la sauvegarde
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer cette
                              sauvegarde ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(backup.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
