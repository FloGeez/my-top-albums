interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  release_date: string;
  images: { url: string; height: number; width: number }[];
  genres?: string[];
  external_urls: {
    spotify: string;
  };
}

interface SpotifySearchResponse {
  albums: {
    items: SpotifyAlbum[];
  };
}

interface SpotifyTrack {
  id: string;
  name: string;
  uri: string;
}

interface SpotifyAlbumTracks {
  tracks: {
    items: SpotifyTrack[];
  };
}

interface SpotifyUser {
  id: string;
  display_name: string;
  images?: { url: string }[];
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
  public: boolean;
  description: string;
}

class SpotifyService {
  private accessToken: string | null = null;
  private tokenExpiry = 0;
  private userAccessToken: string | null = null;
  private userProfile: SpotifyUser | null = null;
  private playlistsCache: any[] | null = null;
  private playlistsCacheTime: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 secondes

  // Initialiser le service côté client
  initializeClient(): void {
    if (typeof window === "undefined") return;

    // Charger le token utilisateur depuis localStorage
    const savedToken = localStorage.getItem("spotify_user_token");
    if (savedToken) {
      this.userAccessToken = savedToken;
    }

    // Charger le profil utilisateur depuis localStorage
    const savedProfile = localStorage.getItem("spotify_user_profile");
    if (savedProfile) {
      try {
        this.userProfile = JSON.parse(savedProfile);
      } catch (error) {
        console.error("Error parsing saved user profile:", error);
      }
    }
  }

  // Vérifier si l'utilisateur est connecté
  isUserAuthenticated(): boolean {
    return !!this.userAccessToken;
  }

  // Obtenir le profil utilisateur
  getUserProfile(): SpotifyUser | null {
    return this.userProfile;
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Utiliser seulement le client ID côté client, le secret sera géré côté serveur
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      throw new Error("Spotify client ID not found");
    }

    // Utiliser une API route pour obtenir le token côté serveur
    const response = await fetch("/api/spotify/client-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get Spotify access token");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // 1 minute buffer

    return this.accessToken ?? "";
  }

  // Authentification utilisateur pour créer des playlists
  async authenticateUser(): Promise<void> {
    const clientId =
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ||
      "25203576ae224c58bab6bc11a2a61874";
    const redirectUri =
      process.env.NEXT_PUBLIC_REDIRECT_URI ??
      window.location.origin ??
      "http://localhost:3000";
    const scopes =
      "playlist-modify-public playlist-modify-private user-read-private";

    const authUrl =
      `https://accounts.spotify.com/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `show_dialog=true`;

    window.location.href = authUrl;
  }

  // Extraire le code d'autorisation depuis l'URL après redirection
  async extractTokenFromUrl(): Promise<boolean> {
    // Vérifier que nous sommes côté client
    if (typeof window === "undefined") {
      return false;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // Nettoyer l'URL immédiatement pour éviter la réutilisation du code
      window.history.replaceState({}, document.title, window.location.pathname);

      try {
        // Échanger le code contre un token d'accès
        const token = await this.exchangeCodeForToken(code);
        this.userAccessToken = token;

        // Sauvegarder le token dans localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("spotify_user_token", token);
        }

        // Récupérer le profil utilisateur
        await this.loadUserProfile();
        return true;
      } catch (error) {
        console.error("Failed to exchange code for token:", error);
        return false;
      }
    }

    return false;
  }

  // Échanger le code d'autorisation contre un token d'accès
  private async exchangeCodeForToken(code: string): Promise<string> {
    const response = await fetch("/api/spotify/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token exchange failed: ${errorData.error}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  // Charger le profil utilisateur
  private async loadUserProfile(): Promise<void> {
    if (!this.userAccessToken) {
      throw new Error("User not authenticated");
    }

    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${this.userAccessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user profile");
    }

    this.userProfile = await response.json();

    // Sauvegarder le profil dans localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "spotify_user_profile",
        JSON.stringify(this.userProfile)
      );
    }
  }

  // Déconnecter l'utilisateur
  logout(): void {
    this.userAccessToken = null;
    this.userProfile = null;
    this.playlistsCache = null;
    this.playlistsCacheTime = 0;

    // Nettoyer localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("spotify_user_token");
      localStorage.removeItem("spotify_user_profile");
    }
  }

  setUserToken(token: string) {
    this.userAccessToken = token;
  }

  getUserToken(): string | null {
    return this.userAccessToken;
  }

  async searchAlbums(query: string, limit = 20): Promise<Album[]> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=album&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to search Spotify");
      }

      const data: SpotifySearchResponse = await response.json();

      return data.albums.items.map((album) => ({
        id: album.id,
        title: album.name,
        artist: album.artists.map((artist) => artist.name).join(", "),
        year: new Date(album.release_date).getFullYear(),
        genre: album.genres?.[0] || "Unknown",
        cover:
          album.images[0]?.url ||
          "/placeholder.svg?height=300&width=300&text=No+Image",
        externalUrl: album.external_urls.spotify,
      }));
    } catch (error) {
      console.error("Spotify API error:", error);
      return [];
    }
  }

  async getAlbumTracks(albumId: string): Promise<string[]> {
    try {
      // Utiliser le token client pour récupérer les tracks
      const token = await this.getAccessToken();

      const response = await fetch(
        `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50&market=US`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to get album tracks:", errorData);
        throw new Error(
          `Failed to get album tracks: ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      console.log(`Album tracks response for ${albumId}:`, data);

      // La réponse contient directement les items, pas data.tracks.items
      if (data.items && Array.isArray(data.items)) {
        return data.items.map((track: any) => track.uri);
      } else {
        console.warn(`No tracks found in response for album ${albumId}:`, data);
        return [];
      }
    } catch (error) {
      console.error(`Error getting tracks for album ${albumId}:`, error);
      return [];
    }
  }

  async getCurrentUser(): Promise<SpotifyUser> {
    if (!this.userAccessToken) {
      throw new Error("User not authenticated");
    }

    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${this.userAccessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get user profile");
    }

    return await response.json();
  }

  async createPlaylist(
    userId: string,
    name: string,
    description: string
  ): Promise<SpotifyPlaylist> {
    if (!this.userAccessToken) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(
      `https://api.spotify.com/v1/users/${userId}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          public: true,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Spotify playlist creation error:", errorData);
      throw new Error(
        `Failed to create playlist: ${
          errorData.error?.message || errorData.error || "Unknown error"
        }`
      );
    }

    return await response.json();
  }

  async addTracksToPlaylist(
    playlistId: string,
    trackUris: string[]
  ): Promise<void> {
    if (!this.userAccessToken) {
      throw new Error("User not authenticated");
    }

    // Spotify limite à 100 tracks par requête
    const chunks = [];
    for (let i = 0; i < trackUris.length; i += 100) {
      chunks.push(trackUris.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      console.log(
        `Adding chunk of ${chunk.length} tracks to playlist ${playlistId}`
      );
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.userAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: chunk,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to add tracks to playlist:", errorData);
        throw new Error(
          `Failed to add tracks to playlist: ${
            errorData.error?.message || errorData.error || "Unknown error"
          }`
        );
      } else {
        console.log(`Successfully added ${chunk.length} tracks to playlist`);
      }
    }
  }

  // Créer ou mettre à jour la playlist "Top 50 Albums"
  async createOrUpdateTop50Playlist(albums: Album[]): Promise<{
    playlist: SpotifyPlaylist;
    tracksAdded: number;
    isUpdate: boolean;
  }> {
    // Utiliser la version simplifiée
    return this.createOrUpdateTop50PlaylistSimple(albums);
  }

  async createTop50Playlist(
    albums: Album[]
  ): Promise<{ playlist: SpotifyPlaylist; tracksAdded: number }> {
    // Utiliser la version simplifiée
    return this.createTop50PlaylistSimple(albums);
  }

  // Récupérer une playlist publique par son ID
  async getPublicPlaylist(playlistId: string): Promise<SpotifyPlaylist | null> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "Failed to get public playlist:",
          response.status,
          response.statusText
        );
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting public playlist:", error);
      return null;
    }
  }

  // Parser les métadonnées d'une playlist
  parsePlaylistMetadata(playlist: SpotifyPlaylist): any | null {
    if (!playlist.description) return null;

    // Essayer le nouveau format compact
    let match = playlist.description.match(
      /\[MT50\](.*?)\[(?:&#x2F;|&#x2f;|\/)MT50\]/
    );

    if (match) {
      try {
        // Décoder les entités HTML
        const decodedJsonString = match[1]
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, "/")
          .replace(/&#x2f;/g, "/");

        const metadata = JSON.parse(decodedJsonString);
        return {
          version: metadata.v,
          createdAt: metadata.t,
          albumCount: metadata.c,
          albums: metadata.a.map((album: any) => ({
            rank: album.r,
            id: album.i,
            title: album.n,
            artist: album.ar,
            year: album.y,
            genre: "Unknown",
          })),
        };
      } catch (error) {
        console.error("Error parsing compact metadata:", error);
      }
    }

    // Essayer l'ancien format
    match = playlist.description.match(
      /\[MUSIC_TOP_50\](.*?)\[\/MUSIC_TOP_50\]/
    );
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (error) {
        console.error("Error parsing legacy metadata:", error);
      }
    }

    return null;
  }

  // Charger les albums depuis les métadonnées (version simplifiée)
  async loadAlbumsFromMetadata(albumsMetadata: any[]): Promise<Album[]> {
    // Si on a des métadonnées, on peut les utiliser comme fallback
    // Mais la méthode principale sera loadAlbumsFromPlaylistTracks
    const albums: Album[] = [];

    for (const albumMeta of albumsMetadata) {
      try {
        const album = await this.getAlbumById(albumMeta.id);
        if (album) {
          albums.push(album);
        }
      } catch (error) {
        console.error(`Error loading album ${albumMeta.id}:`, error);
        // Créer un album de fallback avec les métadonnées disponibles
        albums.push({
          id: albumMeta.id,
          title: albumMeta.title,
          artist: albumMeta.artist,
          year: albumMeta.year,
          genre: albumMeta.genre || "Unknown",
          cover: "/placeholder.svg", // Image par défaut
          externalUrl: `https://open.spotify.com/album/${albumMeta.id}`,
        });
      }
    }

    return albums;
  }

  // Trouver la playlist "Top 50 Albums" de l'utilisateur (version simplifiée)
  async findExistingTopPlaylist(
    albums: Album[]
  ): Promise<SpotifyPlaylist | null> {
    try {
      console.log(
        "🔍 [SPOTIFY-SERVICE] findExistingTopPlaylist called with",
        albums.length,
        "albums"
      );

      // Obtenir toutes les playlists de l'utilisateur
      const user = await this.getCurrentUser();
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://api.spotify.com/v1/users/${user.id}/playlists?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get user playlists: ${response.status}`);
      }

      const data = await response.json();
      const playlists = data.items || [];

      console.log(
        "🔍 [SPOTIFY-SERVICE] Got",
        playlists.length,
        "playlists from user"
      );

      // Chercher spécifiquement la playlist "Top 50 Albums"
      for (const playlist of playlists) {
        console.log("🔍 [SPOTIFY-SERVICE] Checking playlist:", playlist.name);
        if (playlist.name === "🎵 Top 50 Albums") {
          console.log(
            "✅ [SPOTIFY-SERVICE] Found matching playlist:",
            playlist.id
          );
          return playlist;
        }
      }

      console.log("❌ [SPOTIFY-SERVICE] No matching playlist found");
      return null;
    } catch (error) {
      console.error(
        "❌ [SPOTIFY-SERVICE] Error finding existing playlist:",
        error
      );
      return null;
    }
  }

  // Mettre à jour une playlist existante (version simplifiée)
  async updateExistingPlaylist(
    playlistId: string,
    albums: Album[]
  ): Promise<{ playlist: any; tracksAdded: number }> {
    // Utiliser la version simplifiée
    return this.updateExistingPlaylistSimple(playlistId, albums);
  }

  // Vider une playlist
  async clearPlaylist(playlistId: string): Promise<void> {
    if (!this.userAccessToken) {
      throw new Error("User not authenticated");
    }

    // Récupérer les morceaux actuels
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get playlist tracks");
    }

    const data = await response.json();
    const trackUris = data.items.map((item: any) => ({ uri: item.track.uri }));

    if (trackUris.length > 0) {
      // Supprimer tous les morceaux
      const deleteResponse = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.userAccessToken}`,
          },
          body: JSON.stringify({
            tracks: trackUris,
          }),
        }
      );

      if (!deleteResponse.ok) {
        throw new Error("Failed to clear playlist");
      }
    }
  }

  // Mettre à jour la description d'une playlist
  async updatePlaylistDescription(
    playlistId: string,
    description: string
  ): Promise<void> {
    if (!this.userAccessToken) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.userAccessToken}`,
        },
        body: JSON.stringify({
          description: description,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update playlist description");
    }
  }

  // Récupérer les playlists de l'utilisateur créées par l'app
  async getUserTopAlbumPlaylists(): Promise<
    Array<{
      playlist: SpotifyPlaylist;
      topData: {
        version: string;
        createdAt: string;
        albumCount: number;
        albums: Array<{
          rank: number;
          id: string;
          title: string;
          artist: string;
          year: number;
          genre: string;
        }>;
      };
    }>
  > {
    if (!this.userAccessToken) {
      throw new Error("User not authenticated");
    }

    // Vérifier le cache
    const now = Date.now();
    if (
      this.playlistsCache &&
      now - this.playlistsCacheTime < this.CACHE_DURATION
    ) {
      console.log("Using cached playlists");
      return this.playlistsCache;
    }

    console.log("🔍 [SPOTIFY-SERVICE] Loading user playlists...");

    const response = await fetch(
      "https://api.spotify.com/v1/me/playlists?limit=50",
      {
        headers: {
          Authorization: `Bearer ${this.userAccessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get user playlists");
    }

    const data = await response.json();
    const topAlbumPlaylists = [];

    for (const playlist of data.items) {
      if (
        playlist.description &&
        (playlist.description.includes("[MT50]") ||
          playlist.description.includes("[MUSIC_TOP_50]"))
      ) {
        console.log(`Found top album playlist: ${playlist.name}`);
        console.log(`Full description:`, playlist.description);

        try {
          // Extraire les métadonnées de la description (nouveau et ancien format)
          // La balise de fermeture peut être encodée comme &#x2F; au lieu de /
          let match = playlist.description.match(
            /\[MT50\](.*?)\[(?:&#x2F;|&#x2f;|\/)MT50\]/
          );
          console.log(`Regex match result:`, match);
          let topData;

          if (match) {
            // Nouveau format compact - décoder les entités HTML
            const decodedJsonString = match[1]
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&#x27;/g, "'")
              .replace(/&#x2F;/g, "/")
              .replace(/&#x2f;/g, "/");

            const metadata = JSON.parse(decodedJsonString);
            topData = {
              version: metadata.v,
              createdAt: metadata.t,
              albumCount: metadata.c,
              albums: metadata.a.map((album: any) => ({
                rank: album.r,
                id: album.i,
                title: album.n,
                artist: album.ar,
                year: album.y,
                genre: "Unknown",
              })),
            };
            console.log(`Successfully parsed top data:`, topData);
          } else {
            // Ancien format (pour compatibilité)
            match = playlist.description.match(
              /\[MUSIC_TOP_50\](.*?)\[\/MUSIC_TOP_50\]/
            );
            if (match) {
              topData = JSON.parse(match[1]);
            }
          }

          if (topData) {
            topAlbumPlaylists.push({
              playlist,
              topData,
            });
          }
        } catch (error) {
          console.error(
            `Failed to parse playlist metadata for "${playlist.name}":`,
            error
          );
          console.error(`Raw description:`, playlist.description);
        }
      }
    }

    // Trier par date de création (plus récent en premier)
    const sortedPlaylists = topAlbumPlaylists.sort(
      (a, b) =>
        new Date(b.topData.createdAt).getTime() -
        new Date(a.topData.createdAt).getTime()
    );

    // Mettre en cache le résultat
    this.playlistsCache = sortedPlaylists;
    this.playlistsCacheTime = now;

    return sortedPlaylists;
  }

  // Reconstruire un top à partir d'une playlist
  async loadTopFromPlaylist(playlistData: {
    playlist: SpotifyPlaylist;
    topData: any;
  }): Promise<Album[]> {
    // Utiliser la nouvelle approche simplifiée basée sur les tracks
    return this.loadAlbumsFromPlaylistTracks(playlistData.playlist.id);
  }

  // Nouvelle méthode pour obtenir les tracks d'une playlist
  async getPlaylistTracks(playlistId: string): Promise<any[]> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get playlist tracks: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error("Error getting playlist tracks:", error);
      throw error;
    }
  }

  // Nouvelle méthode pour charger les albums depuis les tracks d'une playlist
  async loadAlbumsFromPlaylistTracks(playlistId: string): Promise<Album[]> {
    try {
      console.log(
        `🎵 [SPOTIFY-SERVICE] Loading albums from playlist tracks: ${playlistId}`
      );

      const tracks = await this.getPlaylistTracks(playlistId);
      console.log(
        `🎵 [SPOTIFY-SERVICE] Found ${tracks.length} tracks in playlist`
      );

      const albums: Album[] = [];
      const processedAlbums = new Set<string>(); // Pour éviter les doublons

      for (const trackItem of tracks) {
        const track = trackItem.track;
        if (!track || !track.album) continue;

        const albumId = track.album.id;
        if (processedAlbums.has(albumId)) continue; // Éviter les doublons

        try {
          // Récupérer les détails complets de l'album
          const album = await this.getAlbumById(albumId);
          if (album) {
            albums.push(album);
            processedAlbums.add(albumId);
            console.log(
              `✅ [SPOTIFY-SERVICE] Loaded album: ${album.title} - ${album.artist}`
            );
          }
        } catch (error) {
          console.warn(
            `⚠️ [SPOTIFY-SERVICE] Failed to load album ${albumId}:`,
            error
          );
          // Créer un album de fallback avec les infos disponibles
          const fallbackAlbum: Album = {
            id: albumId,
            title: track.album.name,
            artist: track.album.artists[0]?.name || "Unknown Artist",
            year: parseInt(track.album.release_date.split("-")[0]) || 0,
            genre: "Unknown",
            cover: track.album.images[0]?.url || "/placeholder.svg",
            externalUrl: track.album.external_urls.spotify,
          };
          albums.push(fallbackAlbum);
          processedAlbums.add(albumId);
        }
      }

      console.log(
        `🎵 [SPOTIFY-SERVICE] Successfully loaded ${albums.length} albums from playlist`
      );
      return albums;
    } catch (error) {
      console.error("Error loading albums from playlist tracks:", error);
      throw error;
    }
  }

  // Version simplifiée de createTop50Playlist (sans métadonnées complexes)
  async createTop50PlaylistSimple(
    albums: Album[]
  ): Promise<{ playlist: SpotifyPlaylist; tracksAdded: number }> {
    try {
      // Obtenir l'utilisateur actuel
      const user = await this.getCurrentUser();

      // Créer la playlist avec une description simple
      const playlistName = `🎵 Top 50 Albums`;
      const playlistDescription = `Top 50 albums créé avec My Top Albums`;

      const playlist = await this.createPlaylist(
        user.id,
        playlistName,
        playlistDescription
      );

      // Récupérer les tracks de chaque album (première track de chaque album)
      const trackUris: string[] = [];
      let tracksAdded = 0;

      console.log(
        `🎵 [SPOTIFY-SERVICE] Processing ${albums.length} albums for playlist...`
      );

      for (const album of albums) {
        try {
          console.log(
            `🎵 [SPOTIFY-SERVICE] Getting tracks for album: ${album.title} (${album.id})`
          );
          const tracks = await this.getAlbumTracks(album.id);
          if (tracks.length > 0) {
            // Ajouter la première track de l'album
            trackUris.push(tracks[0]);
            tracksAdded++;
            console.log(
              `✅ [SPOTIFY-SERVICE] Added track from ${album.title}: ${tracks[0]}`
            );
          } else {
            console.warn(
              `⚠️ [SPOTIFY-SERVICE] No tracks found for album: ${album.title}`
            );
          }
        } catch (error) {
          console.warn(
            `⚠️ [SPOTIFY-SERVICE] Failed to get tracks for album ${album.title}:`,
            error
          );
        }
      }

      console.log(
        `🎵 [SPOTIFY-SERVICE] Total track URIs collected: ${trackUris.length}`
      );

      // Ajouter les tracks à la playlist
      if (trackUris.length > 0) {
        console.log(
          `🎵 [SPOTIFY-SERVICE] Adding ${trackUris.length} tracks to playlist ${playlist.id}...`
        );
        await this.addTracksToPlaylist(playlist.id, trackUris);
        console.log(
          `✅ [SPOTIFY-SERVICE] Successfully added tracks to playlist`
        );
      } else {
        console.warn(`⚠️ [SPOTIFY-SERVICE] No tracks to add to playlist`);
      }

      return { playlist, tracksAdded };
    } catch (error) {
      console.error("Error creating playlist:", error);
      throw error;
    }
  }

  // Version simplifiée de updateExistingPlaylist (sans métadonnées complexes)
  async updateExistingPlaylistSimple(
    playlistId: string,
    albums: Album[]
  ): Promise<{ playlist: any; tracksAdded: number }> {
    try {
      console.log(
        `🔄 [SPOTIFY-SERVICE] Updating existing playlist: ${playlistId}`
      );

      // Vider la playlist existante
      await this.clearPlaylist(playlistId);

      // Récupérer les tracks de chaque album
      const trackUris: string[] = [];
      let tracksAdded = 0;

      for (const album of albums) {
        try {
          const tracks = await this.getAlbumTracks(album.id);
          if (tracks.length > 0) {
            trackUris.push(tracks[0]);
            tracksAdded++;
          }
        } catch (error) {
          console.warn(`Failed to get tracks for album ${album.title}:`, error);
        }
      }

      // Ajouter les nouvelles tracks
      if (trackUris.length > 0) {
        await this.addTracksToPlaylist(playlistId, trackUris);
      }

      // Récupérer la playlist mise à jour
      const playlist = await this.getPublicPlaylist(playlistId);

      return { playlist, tracksAdded };
    } catch (error) {
      console.error("Error updating existing playlist:", error);
      throw error;
    }
  }

  // Version simplifiée de createOrUpdateTop50Playlist
  async createOrUpdateTop50PlaylistSimple(albums: Album[]): Promise<{
    playlist: SpotifyPlaylist;
    tracksAdded: number;
    isUpdate: boolean;
  }> {
    try {
      // Vérifier s'il existe déjà une playlist "Top 50 Albums"
      const existingPlaylist = await this.findExistingTopPlaylist(albums);

      if (existingPlaylist) {
        // Mettre à jour la playlist existante
        const result = await this.updateExistingPlaylistSimple(
          existingPlaylist.id,
          albums
        );
        return { ...result, isUpdate: true };
      } else {
        // Créer une nouvelle playlist
        const result = await this.createTop50PlaylistSimple(albums);
        return { ...result, isUpdate: false };
      }
    } catch (error) {
      console.error("Error creating/updating playlist:", error);
      throw error;
    }
  }

  // Récupérer un album par son ID
  private async getAlbumById(albumId: string): Promise<Album | null> {
    try {
      const token = await this.getAccessToken();
      const response = await fetch(
        `https://api.spotify.com/v1/albums/${albumId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const album = await response.json();
      return {
        id: album.id,
        title: album.name,
        artist: album.artists[0]?.name || "Unknown Artist",
        year: album.release_date
          ? new Date(album.release_date).getFullYear()
          : 0,
        genre: album.genres?.[0] || "Unknown",
        cover: album.images?.[0]?.url || "",
        externalUrl: album.external_urls?.spotify || "",
      };
    } catch (error) {
      console.error("Error fetching album:", error);
      return null;
    }
  }

  async getPopularAlbums(): Promise<Album[]> {
    // Pour les albums populaires, on peut utiliser des playlists ou des albums spécifiques
    return [];
  }
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  cover: string;
  externalUrl: string;
}

export const spotifyService = new SpotifyService();
