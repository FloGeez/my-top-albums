"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSpotifyAuth } from "@/hooks/use-spotify-auth";
import { Music, LogOut, User, Play } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

export function SpotifyAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, userProfile, mounted, login, logout } =
    useSpotifyAuth();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      console.log("SpotifyAuth - Starting login process");
      login();
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de se connecter à Spotify",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Déconnexion réussie",
      description: "Vous êtes maintenant déconnecté de Spotify",
    });
  };

  // Ne pas afficher le composant tant qu'il n'est pas monté (éviter l'hydration)
  if (!mounted) {
    return (
      <div className="h-10 px-4 py-2 flex items-center gap-10">
        <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
        <div className="w-4 h-4 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <TooltipProvider delayDuration={100}>
        {/* Bouton Partager */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleLogin}
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Music className="w-4 h-4" />
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Se connecter à Spotify vous permet de
            <br /> sauvegarder et partager votre Top 50 !
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage
              src={userProfile?.images?.[0]?.url}
              alt={userProfile?.display_name || "Utilisateur"}
            />
            <AvatarFallback>
              <User className="w-3 h-3" />
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline text-sm">
            {userProfile?.display_name || "Utilisateur"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={userProfile?.images?.[0]?.url}
                alt={userProfile?.display_name || "Utilisateur"}
              />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <p className="text-sm font-medium">
                {userProfile?.display_name || "Utilisateur"}
              </p>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs h-4 px-1">
                  <Play className="w-2 h-2 mr-1" />
                  Spotify
                </Badge>
                {userProfile?.product === "premium" && (
                  <Badge variant="default" className="text-xs h-4 px-1">
                    Premium
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
