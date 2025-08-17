import type { Album } from "./spotify";

export interface BackupEntry {
  id: string;
  timestamp: number;
  albums: Album[];
  source: "local" | "spotify" | "shared";
  description: string;
  playlistId?: string;
}

export class BackupManager {
  private static readonly STORAGE_KEY = "music-top50-backups";
  private static readonly MAX_BACKUPS = 10;
  private static readonly AUTO_BACKUP_INTERVAL = 30000; // 30 secondes

  // Sauvegarder automatiquement (pour les modifications locales)
  static autoBackup(
    albums: Album[],
    description: string = "Sauvegarde automatique"
  ): void {
    if (typeof window === "undefined") return;

    const backup: BackupEntry = {
      id: `auto_${Date.now()}`,
      timestamp: Date.now(),
      albums: [...albums],
      source: "local",
      description,
    };

    this.addBackup(backup);
  }

  // Sauvegarder manuellement (avant chargement Spotify, etc.)
  static manualBackup(
    albums: Album[],
    description: string,
    source: "local" | "spotify" | "shared" = "local",
    playlistId?: string
  ): string {
    if (typeof window === "undefined") return "";

    const backup: BackupEntry = {
      id: `manual_${Date.now()}`,
      timestamp: Date.now(),
      albums: [...albums],
      source,
      description,
      playlistId,
    };

    this.addBackup(backup);
    return backup.id;
  }

  // Ajouter une sauvegarde
  private static addBackup(backup: BackupEntry): void {
    const backups = this.getBackups();

    // Ajouter en début de liste
    backups.unshift(backup);

    // Limiter le nombre de sauvegardes
    if (backups.length > this.MAX_BACKUPS) {
      backups.splice(this.MAX_BACKUPS);
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
  }

  // Récupérer toutes les sauvegardes
  static getBackups(): BackupEntry[] {
    if (typeof window === "undefined") return [];

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading backups:", error);
      return [];
    }
  }

  // Restaurer une sauvegarde
  static restoreBackup(backupId: string): Album[] | null {
    const backups = this.getBackups();
    const backup = backups.find((b) => b.id === backupId);

    if (backup) {
      return [...backup.albums];
    }

    return null;
  }

  // Supprimer une sauvegarde
  static deleteBackup(backupId: string): void {
    if (typeof window === "undefined") return;

    const backups = this.getBackups().filter((b) => b.id !== backupId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
  }

  // Nettoyer les anciennes sauvegardes automatiques (plus de 24h)
  static cleanupOldBackups(): void {
    if (typeof window === "undefined") return;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const backups = this.getBackups().filter((backup) => {
      // Garder les sauvegardes manuelles et les automatiques récentes
      return (
        backup.source !== "local" ||
        backup.timestamp > oneDayAgo ||
        backup.id.startsWith("manual_")
      );
    });

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backups));
  }

  // Formater la date pour l'affichage
  static formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins}min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Obtenir une description courte du contenu
  static getContentSummary(albums: Album[]): string {
    if (albums.length === 0) return "Vide";
    if (albums.length === 1)
      return `1 album : ${albums[0].artist} - ${albums[0].title}`;
    if (albums.length <= 3) {
      return `${albums.length} albums : ${albums
        .map((a) => a.artist)
        .join(", ")}`;
    }
    return `${albums.length} albums : ${albums
      .slice(0, 2)
      .map((a) => a.artist)
      .join(", ")} et ${albums.length - 2} autres`;
  }
}
