import { useState } from "react";
import { cn } from "../lib/utils";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = "/default-fallback-image.png";

export function Image({
  src,
  alt,
  className,
  fallbackSrc = DEFAULT_FALLBACK,
  onError,
  ...props
}: ImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError && fallbackSrc) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
    onError?.(e);
  };

  return (
    <img
      src={imgSrc || fallbackSrc}
      alt={alt}
      className={cn(className)}
      onError={handleError}
      {...props}
    />
  );
}
