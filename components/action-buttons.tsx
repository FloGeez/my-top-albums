import React, { type ReactNode } from "react";
import { Trash2, Calendar, Hand, Maximize } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Bouton pour vider le Top 50
export const ViderButton = React.memo(function ViderButton({
  onClear,
  size = "sm",
  showText = false,
}: {
  onClear: () => void;
  size?: "sm" | "icon";
  showText?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={`gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${
            size === "icon" ? "h-8 w-8 p-0" : ""
          }`}
          aria-label="Vider le Top 50"
        >
          <Trash2 className="w-3 h-3" />
          {showText && <span className="text-xs">Vider</span>}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action supprimera définitivement tous les albums de votre Top
            50. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onClear}>
            Vider le Top 50
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
});

// Bouton de tri
export const TriButton = React.memo(function TriButton({
  onClick,
  sortMode,
  sortDirection,
  getSortIcon,
  getSortTooltipText,
}: {
  onClick: () => void;
  sortMode: "date" | "manual";
  sortDirection: "asc" | "desc";
  getSortIcon: () => ReactNode;
  getSortTooltipText: () => string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
          aria-label={getSortTooltipText()}
        >
          {getSortIcon()}
          <span className="text-xs">
            {sortMode === "manual"
              ? "Manuel"
              : sortDirection === "desc"
              ? "↓ Date"
              : "↑ Date"}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{getSortTooltipText()}</TooltipContent>
    </Tooltip>
  );
});

// Bouton de tri manuel
export const TriManuelButton = React.memo(function TriManuelButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
          aria-label="Activer le tri manuel"
        >
          <Hand className="w-3 h-3" />
          <span className="text-xs">Manuel</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Réorganiser manuellement</TooltipContent>
    </Tooltip>
  );
});

// Bouton plein écran
export const PleinEcranButton = React.memo(function PleinEcranButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onClick}
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-foreground"
          aria-label="Mode plein écran"
        >
          <Maximize className="w-3 h-3" />
          <span className="text-xs">Plein écran</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Mode plein écran</TooltipContent>
    </Tooltip>
  );
});
