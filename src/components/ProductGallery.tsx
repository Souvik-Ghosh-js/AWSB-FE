'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { ProductImage } from '@/lib/types';

/**
 * Product gallery — 2 to 3 images per product.
 *
 * Large photography on an ivory plate, with thumbnails beneath. The first
 * image is `priority` because on this page it is the LCP element.
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const ordered = [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const active = ordered[activeIndex] ?? ordered[0];

  if (ordered.length === 0) {
    return (
      <div className="aw-plate flex aspect-[4/5] w-full items-center justify-center rounded-sm border border-line">
        <p className="aw-eyebrow">Photography coming soon</p>
      </div>
    );
  }

  return (
    <div>
      <div className="aw-plate relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-line sm:aspect-[5/5]">
        {active ? (
          <Image
            key={active.id}
            src={active.url}
            alt={active.altText ?? `${productName} — attar bottle`}
            fill
            sizes="(max-width: 1024px) 100vw, 640px"
            priority
            className="aw-fade-up object-cover"
            unoptimized={active.url.startsWith('data:')}
          />
        ) : null}
      </div>

      {ordered.length > 1 ? (
        <div
          className="mt-3 grid grid-cols-4 gap-3 sm:mt-4"
          role="group"
          aria-label={`${productName} images`}
        >
          {ordered.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`Show image ${i + 1} of ${ordered.length}`}
              aria-current={i === activeIndex}
              className={`aw-plate relative aspect-square overflow-hidden rounded-sm border transition-colors ${
                i === activeIndex
                  ? 'border-accent'
                  : 'border-line hover:border-line-strong'
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="140px"
                className="object-cover"
                unoptimized={image.url.startsWith('data:')}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
