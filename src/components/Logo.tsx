import Image from 'next/image';

/**
 * The company mark, from the owner's own logo file.
 *
 * Shows the FULL artwork — ring, monogram, bottle and paisley flourish — not
 * a cropped circle. The source PNG is 1080x1329 (0.81:1, tall portrait), so
 * `LogoMark` is sized by height and lets width follow the aspect ratio,
 * rather than being forced into a square box that would either crop it or
 * leave empty padding.
 *
 * A raster, not an SVG: the source is the owner's artwork, and redrawing it
 * would put my hand on their brand. Served from /public so it is one cached
 * request, and `priority` in the header so it is never the last thing to
 * paint.
 */
const LOGO_W = 1080;
const LOGO_H = 1329;

export function LogoMark({
  className = '',
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/img/logo-full.png"
      alt=""
      aria-hidden="true"
      width={LOGO_W}
      height={LOGO_H}
      priority={priority}
      className={className}
      style={{ width: 'auto' }}
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
        className={stacked ? 'h-20 w-auto shrink-0' : 'h-12 w-auto shrink-0 sm:h-14'}
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
