"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: keyof typeof sizeClasses;
}

function Avatar({
  className,
  src,
  alt = "",
  fallback,
  size = "md",
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);

  const showImage = src && !imageError;

  const initials = React.useMemo(() => {
    if (fallback) return fallback;
    if (alt) {
      return alt
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "?";
  }, [fallback, alt]);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
        sizeClasses[size],
        className
      )}
      role="img"
      aria-label={alt || fallback || "Avatar"}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="font-medium text-muted-foreground">{initials}</span>
      )}
    </div>
  );
}

export { Avatar };
