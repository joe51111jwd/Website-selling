// <Picture id="plan-b44-260" /> (brief 7e: AVIF with a JPEG <picture> fallback). Owner: A1.
// Reads the manifest entry's image sources; the last non-AVIF/WebP source (normally the JPEG) is
// the <img> fallback. Must sit inside a <ViewTitle> whose kind is not 'drawing' unless decorative.

import type { CSSProperties } from 'react';
import { media, type Src } from '../media/manifest';
import { useViewContext, assertLabelled } from './viewContext';

export interface PictureProps {
  id: string;
  className?: string;
  imgClassName?: string;
  /** Override the manifest alt */
  alt?: string;
  /** Decorative (alt=""), e.g. hero-ground-169 and the near-matte. Skips the view-title check. */
  decorative?: boolean;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
  style?: CSSProperties;
  /** object-fit (default 'cover') */
  fit?: 'cover' | 'contain' | 'none';
  /**
   * Load group (FIXLIST F-002), rendered as data-vm-group: a lazy Picture in a held group (or inside a
   * [data-vm-group] ancestor) stays out of layout, so unfetched, until videoManager.release(group).
   */
  group?: string;
}

const MODERN = /avif|webp/i;

export function pickFallback(sources: Src[]): Src | undefined {
  const legacy = sources.filter((s) => !MODERN.test(s.type));
  return legacy[legacy.length - 1] ?? sources[sources.length - 1];
}

export function Picture({
  id,
  className,
  imgClassName,
  alt,
  decorative = false,
  loading = 'lazy',
  fetchPriority,
  sizes,
  style,
  fit = 'cover',
  group,
}: PictureProps) {
  const ctx = useViewContext();
  if (!decorative) assertLabelled(id, ctx);
  const entry = media[id];
  const altText = decorative ? '' : (alt ?? entry?.alt ?? '');

  if (!entry || !entry.sources?.length) {
    return (
      <span
        className={`picture picture--missing ${className ?? ''}`}
        data-media-id={id}
        data-missing=""
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : altText || undefined}
        aria-hidden={decorative ? true : undefined}
        style={{ ...style, aspectRatio: entry ? `${entry.w} / ${entry.h}` : undefined }}
      />
    );
  }

  const fallback = pickFallback(entry.sources)!;
  const modern = entry.sources.filter((s) => s !== fallback && MODERN.test(s.type));
  return (
    <picture
      className={`picture picture--${fit} ${className ?? ''}`}
      data-media-id={id}
      data-vm-group={group}
      style={style}
    >
      {modern.map((s) => (
        <source key={s.src} srcSet={s.src} type={s.type} sizes={sizes} />
      ))}
      <img
        className={imgClassName}
        src={fallback.src}
        alt={altText}
        width={entry.w}
        height={entry.h}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        sizes={sizes}
      />
    </picture>
  );
}

export default Picture;
