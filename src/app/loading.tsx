import { ProductGridSkeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="aw-container py-14">
      <div className="aw-skeleton h-3 w-32 rounded-sm" />
      <div className="aw-skeleton mt-6 h-10 w-72 max-w-full rounded-sm" />
      <div className="aw-skeleton mt-4 h-px w-64 rounded-sm" />
      <div className="mt-14">
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}
