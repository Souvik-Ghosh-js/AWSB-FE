import Image from 'next/image';

/**
 * Every photographic slot on the site goes through here.
 *
 * The shop has four verified stock photographs and no pictures of its own
 * attars yet. Rather than leave grey boxes or — worse — dress the site in
 * other brands' product shots, a missing photo renders as a composed panel:
 * the scent's initial, its name, and a quiet note that the real photograph is
 * coming. It reads as intentional, and it makes the gap obvious to the owner
 * without looking broken to a customer.
 *
 * When a real photo arrives, pass `src` and this renders it instead. No layout
 * changes, no code changes anywhere else.
 */

export type PhotoProps = {
  /** Path under /public, e.g. '/img/oud.jpg'. Omit for a placeholder. */
  src?: string | null;
  alt: string;
  /** Shown large in the placeholder — usually the product or scent name. */
  label?: string;
  /** Tailwind aspect ratio class, e.g. 'aspect-[4/5]'. */
  ratio?: string;
  className?: string;
  /** Set on the one image above the fold; Next then preloads it. */
  priority?: boolean;
  /** Feeds next/image's responsive sizing. */
  sizes?: string;
  /** Slight zoom on hover — only where the whole card is a link. */
  zoom?: boolean;
};

/** Deterministic tint per label, so a product keeps the same colour everywhere. */
const TINTS = [
  { from: '#2b2d66', to: '#12132f' }, // navy — the brand's own
  { from: '#6b4d1f', to: '#3d2a10' }, // amber
  { from: '#5a3340', to: '#32202a' }, // rose
  { from: '#2c4a52', to: '#16292e' }, // teal
  { from: '#5d4a2a', to: '#332818' }, // sand
] as const;

function tintFor(label: string): { from: string; to: string } {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash * 31 + label.charCodeAt(i)) & 0xffffffff;
  }
  // `?? TINTS[0]` satisfies noUncheckedIndexedAccess. The modulo cannot
  // actually go out of range, but asserting that with `!` would hide a real
  // bug if TINTS were ever emptied.
  return TINTS[Math.abs(hash) % TINTS.length] ?? TINTS[0];
}

export function Photo({
  src,
  alt,
  label,
  ratio = 'aspect-[4/5]',
  className = '',
  priority = false,
  sizes = '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
  zoom = false,
}: PhotoProps) {
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-surface-sunk ${ratio} ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={`object-cover ${zoom ? 'transition-transform duration-700 ease-out group-hover:scale-[1.04]' : ''}`}
        />
      </div>
    );
  }

  const text = label ?? alt;
  const initial = text.trim().charAt(0).toUpperCase() || 'A';
  const { from, to } = tintFor(text);

  return (
    <div
      className={`relative overflow-hidden ${ratio} ${className}`}
      style={{ background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)` }}
      role="img"
      aria-label={`${alt} — photograph coming soon`}
    >
      {/* Faint concentric rings: an attar bottle seen from above. Pure CSS, so
          it costs nothing and never 404s. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 42%, transparent 22%, rgba(255,255,255,0.5) 22.5%, transparent 23%), radial-gradient(circle at 50% 42%, transparent 33%, rgba(255,255,255,0.35) 33.5%, transparent 34%), radial-gradient(circle at 50% 42%, transparent 44%, rgba(255,255,255,0.22) 44.5%, transparent 45%)',
        }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <span
          className="font-[family-name:var(--font-display)] leading-none text-white/90"
          style={{ fontSize: 'clamp(2.75rem, 7vw, 4.5rem)' }}
        >
          {initial}
        </span>
        <span className="mt-3 max-w-[14rem] text-[0.8125rem] leading-snug text-white/75">
          {text}
        </span>
        <span className="mt-4 text-[0.625rem] uppercase tracking-[0.14em] text-white/45">
          Photograph coming
        </span>
      </div>
    </div>
  );
}
