import type { NextConfig } from 'next';

/**
 * Product images live in S3-compatible object storage (Lightsail/S3), so the
 * hostname is not known at build time. It is derived from the public base URL
 * env var, with a permissive https fallback for local development against
 * placeholder imagery.
 */
function remotePatterns(): NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> {
  const patterns: NonNullable<NonNullable<NextConfig['images']>['remotePatterns']> = [];

  const candidates = [
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL,
    process.env.NEXT_PUBLIC_API_URL,
  ].filter((v): v is string => typeof v === 'string' && v.length > 0);

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate);
      patterns.push({
        protocol: url.protocol === 'http:' ? 'http' : 'https',
        hostname: url.hostname,
      });
    } catch {
      // A malformed env var must not break the build; the image simply
      // falls back to the unoptimised path.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  // `next build` wipes its output folder. Running it while `next dev` is up
  // deletes the dev server's compiled pages and every route starts returning
  // 500 until it is restarted. To check a production build alongside a running
  // dev server, point it somewhere else:
  //   NEXT_DIST_DIR=.next-verify npx next build
  // Unset (CI, Netlify, normal use) it stays `.next`.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: remotePatterns(),
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
      {
        // The admin panel must never be indexed, and never cached by a proxy.
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;
