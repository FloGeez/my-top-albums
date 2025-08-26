import React from "react";

// Skeleton pour les onglets
export function TabsSkeleton() {
  return (
    <div className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
      <div className="h-10 bg-muted rounded animate-pulse"></div>
      <div className="h-10 bg-muted rounded animate-pulse"></div>
    </div>
  );
}

// Skeleton pour le contenu du Top 50
export function Top50ContentSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-12 h-12 bg-muted rounded-full mb-6 animate-pulse"></div>
        <div className="h-8 bg-muted rounded w-64 mb-4 animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-96 mb-8 animate-pulse"></div>
        <div className="h-12 bg-muted rounded w-48 animate-pulse"></div>
      </div>
    </div>
  );
}

// Skeleton pour le contenu de recherche
export function SearchContentSkeleton() {
  return (
    <div className="space-y-8">
      <div className="relative flex items-center max-w-xl mx-auto">
        <div className="h-10 bg-muted rounded-full w-full animate-pulse"></div>
      </div>
      <div className="text-center py-12">
        <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-4 animate-pulse"></div>
        <div className="h-6 bg-muted rounded w-64 mx-auto animate-pulse"></div>
      </div>
    </div>
  );
}
