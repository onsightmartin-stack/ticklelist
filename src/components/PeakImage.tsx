import { useState } from "react";
import peakFallback from "@/assets/peak-fallback.jpg";

interface PeakImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | undefined;
  fallbackSrc?: string | undefined;
}

export default function PeakImage({
  src,
  fallbackSrc = peakFallback,
  alt,
  onError,
  loading = "lazy",
  decoding = "async",
  ...props
}: PeakImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = !src || hasError ? fallbackSrc : src;

  return (
    <img
      {...props}
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={(event) => {
        if (resolvedSrc !== fallbackSrc) {
          setHasError(true);
        }
        onError?.(event);
      }}
    />
  );
}
