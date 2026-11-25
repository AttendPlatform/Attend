import Image from "next/image";

const OPTIMIZABLE_HOSTS = [".supabase.co", "lh3.googleusercontent.com"];

function canOptimizeWithNextImage(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const url = new URL(src);
    return OPTIMIZABLE_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(host)
    );
  } catch {
    return false;
  }
}

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw",
  className,
  priority = false,
}: OptimizedImageProps) {
  if (canOptimizeWithNextImage(src)) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={className}
        />
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={width ?? 400}
        height={height ?? 400}
        sizes={sizes}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={className}
    />
  );
}
