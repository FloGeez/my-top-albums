import React from "react";
import Image from "next/image";
import {
  Star,
  Plus,
  Minus,
  ExternalLink,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { type Album } from "@/lib/spotify";

// Composant principal pour l'affichage des albums dans la recherche
export function AlbumCard({
  album,
  onAdd,
  onRemove,
  isInTop50,
}: {
  album: Album;
  onAdd: () => void;
  onRemove: () => void;
  isInTop50: boolean;
}) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border">
      <CardContent className="p-0">
        <div className="relative overflow-hidden">
          <Image
            src={album.cover || "/placeholder.svg"}
            alt={`${album.title} by ${album.artist}`}
            width={200}
            height={200}
            className="w-full aspect-square object-cover"
          />
          {isInTop50 && (
            <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm rounded-full p-1 z-10">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            {isInTop50 ? (
              <Button onClick={onRemove} variant="destructive" size="sm">
                <Minus className="w-3 h-3 mr-1" />
                Retirer
              </Button>
            ) : (
              <Button onClick={onAdd} size="sm">
                <Plus className="w-3 h-3 mr-1" />
                Ajouter
              </Button>
            )}
          </div>
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-foreground mb-1 truncate text-sm">
            <a
              href={album.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              {album.title}
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </a>
          </h3>
          <p className="text-muted-foreground text-xs mb-2 truncate">
            {album.artist}
          </p>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {album.year}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Version compacte pour le Top 50 avec infos au survol
export function CompactRankedAlbumCard({
  album,
  rank,
  onRemove,
  isDraggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging = false,
}: {
  album: Album;
  rank: number;
  onRemove: () => void;
  isDraggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, dropIndex: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`group relative transition-all duration-300 ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${isDraggable ? "cursor-move" : ""}`}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, 0)}
      onDragEnd={onDragEnd}
    >
      <div className="relative overflow-hidden rounded-lg group-hover:rounded-b-none transition-all duration-300 h-full">
        <Image
          src={album.cover || "/placeholder.svg"}
          alt={`${album.title} by ${album.artist}`}
          width={150}
          height={150}
          className="w-full aspect-square object-cover"
        />

        {/* Bouton supprimer en haut à droite - apparaît au survol */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="w-6 h-6 rounded-full"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir retirer "{album.title}" de votre Top
                  50 ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Drag handle - apparaît au survol */}
        {isDraggable && (
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-15">
            <GripVertical className="w-4 h-4 text-white drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Infos en dessous - position absolue, apparaissent au survol avec animation */}
      <div className="absolute bottom-0 left-0 right-0 translate-y-full opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 bg-card border border-border rounded-lg rounded-t-none p-2 shadow-lg z-30">
        <h3 className="font-semibold text-xs mb-1 line-clamp-1">
          <a
            href={album.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            {album.title}
            <ExternalLink className="w-2 h-2 text-muted-foreground" />
          </a>
        </h3>
        <p className="text-muted-foreground text-xs truncate mb-1">
          {album.artist}
        </p>
        <Badge variant="secondary" className="text-xs h-4 px-1">
          {album.year}
        </Badge>
      </div>
    </div>
  );
}

// Skeleton pour les albums
export function AlbumSkeleton() {
  return (
    <Card className="border-border animate-pulse">
      <CardContent className="p-0">
        <div className="w-full aspect-square bg-muted rounded-t-lg"></div>
        <div className="p-3">
          <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
          <div className="flex items-center justify-between">
            <div className="h-3 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
