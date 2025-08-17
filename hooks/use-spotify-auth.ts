"use client";

import { useState, useEffect, useCallback } from "react";
import { spotifyService } from "@/lib/spotify";

// Event system pour synchroniser l'état d'authentification entre composants
class AuthEventManager {
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener());
  }
}

const authEventManager = new AuthEventManager();

// État global partagé
let globalAuthState = {
  isAuthenticated: false,
  userProfile: null as any,
  mounted: false,
  existingPlaylist: null as any,
  isInitialized: false,
};

export function useSpotifyAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    globalAuthState.isAuthenticated
  );
  const [userProfile, setUserProfile] = useState<any>(
    globalAuthState.userProfile
  );
  const [mounted, setMounted] = useState(globalAuthState.mounted);
  const [existingPlaylist, setExistingPlaylist] = useState<any>(
    globalAuthState.existingPlaylist
  );

  // Fonction utilitaire pour nettoyer complètement l'authentification
  const clearAuthState = useCallback(() => {
    spotifyService.logout();
    globalAuthState.isAuthenticated = false;
    globalAuthState.userProfile = null;
    globalAuthState.existingPlaylist = null;
    setIsAuthenticated(false);
    setUserProfile(null);
    setExistingPlaylist(null);
    authEventManager.notify();
  }, []);

  // Fonction pour vérifier et mettre à jour l'état d'authentification
  const checkAuth = useCallback(async () => {
    if (typeof window === "undefined") return;

    spotifyService.initializeClient();
    const authenticated = spotifyService.isUserAuthenticated();
    console.log("useSpotifyAuth - checkAuth:", { authenticated });

    // Mettre à jour l'état global ET local
    globalAuthState.isAuthenticated = authenticated;
    setIsAuthenticated(authenticated);

    if (authenticated) {
      try {
        const profile = await spotifyService.getCurrentUser();
        console.log(
          "useSpotifyAuth - Got user profile:",
          profile?.display_name
        );
        globalAuthState.userProfile = profile;
        setUserProfile(profile);
      } catch (error) {
        console.error("Error loading user profile:", error);
        // Token invalide - nettoyer complètement l'authentification
        clearAuthState();
      }
    } else {
      globalAuthState.userProfile = null;
      setUserProfile(null);
    }
  }, [clearAuthState]);

  // Fonction pour se connecter
  const login = useCallback(() => {
    spotifyService.authenticateUser();
  }, []);

  // Fonction pour se déconnecter
  const logout = useCallback(() => {
    console.log("useSpotifyAuth - logout called");
    clearAuthState();
    console.log("useSpotifyAuth - logout state reset, notifying components");
  }, [clearAuthState]);

  // Fonction pour vérifier s'il existe une playlist
  const checkExistingPlaylist = useCallback(
    async (albums: any[]) => {
      console.log("🔍 [AUTH-HOOK] checkExistingPlaylist called:", {
        isAuthenticated,
        albumsLength: albums.length,
      });

      // Protection contre les appels multiples ou prématurés
      if (!mounted || !isAuthenticated) {
        console.log("❌ [AUTH-HOOK] Not ready - clearing playlist");
        setExistingPlaylist(null);
        return null;
      }

      try {
        console.log(
          "🔍 [AUTH-HOOK] Searching for existing playlist with",
          albums.length,
          "albums"
        );
        const existing = await spotifyService.findExistingTopPlaylist(albums);
        console.log(
          "🔍 [AUTH-HOOK] Found existing playlist:",
          existing?.id || null
        );
        setExistingPlaylist(existing);
        return existing;
      } catch (error) {
        console.error(
          "❌ [AUTH-HOOK] Error checking existing playlist:",
          error
        );
        setExistingPlaylist(null);
        return null;
      }
    },
    [isAuthenticated, mounted]
  );

  // Fonction pour mettre à jour la playlist existante
  const updateExistingPlaylist = useCallback((playlist: any) => {
    globalAuthState.existingPlaylist = playlist;
    setExistingPlaylist(playlist);
    authEventManager.notify();
  }, []);

  // Fonction pour notifier un changement d'authentification
  const notifyAuthChange = useCallback(() => {
    authEventManager.notify();
  }, []);

  // Initialisation au montage - uniquement pour la première instance
  useEffect(() => {
    if (!globalAuthState.isInitialized) {
      console.log(
        "🔐 [AUTH] useSpotifyAuth initializing (FIRST TIME) - setting mounted to true"
      );
      globalAuthState.isInitialized = true;
      globalAuthState.mounted = true;
      setMounted(true);
      console.log("🔐 [AUTH] Calling checkAuth...");
      checkAuth();
    } else {
      console.log("🔐 [AUTH] useSpotifyAuth using existing state");
      setMounted(globalAuthState.mounted);
      setIsAuthenticated(globalAuthState.isAuthenticated);
      setUserProfile(globalAuthState.userProfile);
      setExistingPlaylist(globalAuthState.existingPlaylist);
    }
  }, [checkAuth]);

  // Réinitialiser existingPlaylist quand l'authentification change
  useEffect(() => {
    // Attendre que le composant soit monté pour éviter les race conditions
    if (!mounted) return;

    if (!isAuthenticated) {
      console.log(
        "🔐 [AUTH] User not authenticated, clearing existingPlaylist"
      );
      setExistingPlaylist(null);
    } else {
      console.log(
        "🔐 [AUTH] User authenticated, checking for existing playlist"
      );
      // Vérifier automatiquement s'il existe une playlist après connexion
      // On va laisser les composants qui ont accès aux albums faire cette vérification
      // car ils ont les données nécessaires
    }
  }, [isAuthenticated, mounted]);

  // S'abonner aux changements d'authentification
  useEffect(() => {
    const unsubscribe = authEventManager.subscribe(() => {
      checkAuth();
    });

    return unsubscribe;
  }, [checkAuth]);

  // Vérifier l'URL pour les tokens après l'authentification
  useEffect(() => {
    if (!mounted) return;

    const checkAuthFromUrl = async () => {
      if (typeof window === "undefined") return;

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("code")) {
        console.log("useSpotifyAuth - Processing auth callback from URL");
        try {
          await spotifyService.extractTokenFromUrl();
          await checkAuth();
          // Notifier tous les autres composants
          authEventManager.notify();
          console.log("useSpotifyAuth - Auth callback processed successfully");
        } catch (error) {
          console.error("Error processing auth callback:", error);
        }
      }
    };

    checkAuthFromUrl();
  }, [mounted, checkAuth]);

  // Écouter les changements de localStorage pour détecter les nouvelles connexions
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "spotify_user_token" || e.key === "spotify_user_profile") {
        console.log(
          "useSpotifyAuth - Storage change detected, rechecking auth"
        );
        checkAuth();
        authEventManager.notify();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [mounted, checkAuth]);

  return {
    isAuthenticated,
    userProfile,
    mounted,
    existingPlaylist,
    login,
    logout,
    checkAuth,
    checkExistingPlaylist,
    updateExistingPlaylist,
    notifyAuthChange,
  };
}
