import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { type Album } from "@/lib/spotify";

// Composant de vue plein écran
export function FullscreenView({
  top50,
  onClose,
}: {
  top50: Album[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-background text-foreground z-50 overflow-hidden max-w-[112rem] mx-auto">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-accent-foreground transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex h-full">
        <div className="flex-1 p-12">
          <div className="grid grid-cols-8 gap-3 max-w-7xl">
            {top50.map((album, index) => (
              <div key={album.id} className="relative">
                <Image
                  src={album.cover || "/placeholder.svg"}
                  alt={`${album.title} by ${album.artist}`}
                  width={120}
                  height={120}
                  className="w-full aspect-square object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="w-1/4 p-12 overflow-y-auto lg:block hidden">
          <div className="space-y-1 text-[10px] font-mono text-foreground">
            {top50.map((album, index) => (
              <div key={album.id} className="leading-tight">
                <span>
                  {album.artist} - {album.title} ({album.year})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
