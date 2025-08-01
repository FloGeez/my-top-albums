import { NextResponse } from "next/server";

export async function POST() {
  try {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    // Debug: afficher les variables d'environnement
    console.log("Client token env vars:", {
      clientId: clientId ? "SET" : "NOT SET",
      clientSecret: clientSecret ? "SET" : "NOT SET",
    });

    if (!clientId || !clientSecret) {
      console.error("Missing env vars for client token:", {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
      });
      return NextResponse.json(
        { error: "Missing Spotify credentials" },
        { status: 500 }
      );
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error_description || errorData.error },
        { status: 400 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error("Client token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
