import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;

    // Debug: afficher les variables d'environnement (sans le secret)
    console.log("Debug env vars:", {
      clientId: clientId ? "SET" : "NOT SET",
      clientSecret: clientSecret ? "SET" : "NOT SET",
      redirectUri: redirectUri ? "SET" : "NOT SET",
    });

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Missing env vars:", {
        clientId: !!clientId,
        clientSecret: !!clientSecret,
        redirectUri: !!redirectUri,
      });
      return NextResponse.json(
        { error: "Missing Spotify credentials" },
        { status: 500 }
      );
    }

    console.log("Sending token request with:", {
      grant_type: "authorization_code",
      code: code.substring(0, 10) + "...", // Log partiel du code
      redirect_uri: redirectUri,
    });

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Spotify API error:", errorData);
      return NextResponse.json(
        { error: errorData.error_description || errorData.error },
        { status: 400 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ access_token: data.access_token });
  } catch (error) {
    console.error("Token exchange error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
