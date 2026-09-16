import Image from 'next/image';

/**
 * The company mark, from the owner's own logo file.
 *
 * `LogoMark` is the circle monogram — the navy ring with the W and the pink
 * flame — cropped from the full logo. It is what sits in the header, the
 * favicon and anywhere the mark must read at 32-48px. The full logo, with the
 * bottle and the paisley flourish beneath, is `/img/logo-full.png`, used
 * where there is room to show it large.
 *
 * A raster, not an SVG: the source is the owner's artwork, and redrawing it
 * would put my hand on their brand. Served from /public so it is one cached
 * request, and `priority` in the header so it is never the last thing to
 * paint.
 */
export function LogoMark({
  className = '',
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/img/logo-mark.png"
      alt=""
      aria-hidden="true"
      width={512}
      height={512}
      priority={priority}
      className={className}
    />
  );
}

/**
 * Full lockup: mark + wordmark. `stacked` is used in the footer where there is
 * vertical room; the header uses the inline form.
 */
export function Logo({
  className = '',
  stacked = false,
  priority = false,
}: {
  className?: string;
  stacked?: boolean;
  priority?: boolean;
}) {
  return (
    <span
      className={[
        'inline-flex items-center text-brand',
        stacked ? 'flex-col gap-3 text-center' : 'gap-2.5 sm:gap-3',
        className,
      ].join(' ')}
    >
      <LogoMark
        priority={priority}
        className={stacked ? 'h-14 w-14 shrink-0' : 'h-10 w-10 shrink-0 sm:h-11 sm:w-11'}
      />
      <span className={stacked ? 'flex flex-col items-center' : 'flex flex-col'}>
        <span
          className="font-[family-name:var(--font-display)] text-[1.125rem] leading-none font-bold tracking-[-0.01em] sm:text-[1.25rem]"
          style={{ fontVariantNumeric: 'lining-nums' }}
        >
          Attar World
        </span>
        <span className="aw-eyebrow aw-eyebrow-accent mt-1 text-[0.5625rem] leading-none sm:text-[0.625rem]">
          Sonar Bangla
        </span>
      </span>
    </span>
  );
}
