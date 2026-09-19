'use client';

import { MotionConfig, motion } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Shared motion primitives (Motion, formerly Framer Motion).
 *
 * House rules, so animation stays a finish and never a feature:
 *   - One easing curve and short distances. Things settle; they do not bounce
 *     around. Springs are reserved for direct manipulation (hover, tap, badge).
 *   - Everything animates ONCE. A shopper scrolling back up a grid should not
 *     watch it re-perform.
 *   - `reducedMotion="user"` on the provider: visitors who ask their OS for
 *     less motion get opacity only, no movement.
 *   - Server-rendered HTML carries the hidden start state, so layout.tsx ships
 *     a <noscript> rule that forces `[data-motion]` visible. Content must never
 *     depend on JavaScript to be readable.
 *   - Anything that can be the Largest Contentful Paint (first-row product
 *     images, the first gallery photo) opts out of the hidden start state.
 */

/** Matches the curve of the old `aw-fade-up` CSS keyframe. */
export const EASE = [0.22, 0.61, 0.36, 1] as const;

/** Snappy, slightly damped — for hover lifts, taps and the cart badge. */
export const SPRING = { type: 'spring', stiffness: 420, damping: 30, mass: 0.8 } as const;

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.6, ease: EASE }}>
      {children}
    </MotionConfig>
  );
}

const REVEAL_TAGS = {
  div: motion.div,
  section: motion.section,
  ul: motion.ul,
  li: motion.li,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
} as const;

type RevealTag = keyof typeof REVEAL_TAGS;

/**
 * Fade-and-rise wrapper.
 *
 * By default it plays when scrolled into view. `mount` plays it on load
 * instead — for the hero, which is already in view and whose entrance is timed
 * with `delay` rather than by scroll position.
 */
export function Reveal({
  children,
  as = 'div',
  delay = 0,
  y = 18,
  mount = false,
  className,
}: {
  children: ReactNode;
  as?: RevealTag;
  /** Seconds. Use small steps (0.06–0.12) to stagger siblings. */
  delay?: number;
  /** Rise distance in px. */
  y?: number;
  mount?: boolean;
  className?: string;
}) {
  // All entries share div's prop surface for what we pass; the cast keeps one
  // call site instead of seven near-identical branches.
  const Tag = REVEAL_TAGS[as] as typeof motion.div;

  const trigger = mount
    ? { animate: 'show' as const }
    : {
        whileInView: 'show' as const,
        // Fire a little before the element is fully on screen, so it has
        // arrived by the time the eye gets there.
        viewport: { once: true, margin: '0px 0px -8% 0px' },
      };

  return (
    <Tag
      data-motion=""
      className={className}
      initial="hidden"
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay } },
      }}
      {...trigger}
    >
      {children}
    </Tag>
  );
}
