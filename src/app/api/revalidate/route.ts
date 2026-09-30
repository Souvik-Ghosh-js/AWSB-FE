import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * Called by the backend the moment stock actually changes (a sale, a
 * cancellation, a manual stock edit, the abandoned-checkout sweeper), so the
 * shop grid and a product's own page stop disagreeing about "in stock" for
 * the rest of the 5-minute ISR window. Never load-bearing for correctness —
 * checkout always re-checks live stock server-side regardless of what a
 * cached page shows — this only controls how fresh the display is.
 *
 * REVALIDATE_SECRET is deliberately NOT a NEXT_PUBLIC_ variable: it must
 * never reach the browser bundle, only the Node server that runs this route.
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Revalidation is not configured.' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const slug = typeof (body as { slug?: unknown })?.slug === 'string' ? (body as { slug: string }).slug : null;
  if (!slug) {
    return NextResponse.json({ error: 'Missing "slug".' }, { status: 400 });
  }

  // Both tags: the product's own page, and the shop grid / featured list,
  // which are tagged with the shared 'products' tag rather than per-slug.
  revalidateTag('products');
  revalidateTag(`product:${slug}`);

  return NextResponse.json({ revalidated: true, slug });
}
