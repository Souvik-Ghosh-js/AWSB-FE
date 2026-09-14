import { LineSkeleton } from '@/components/ui';

export default function Loading() {
  return (
    <div className="aw-container py-10 sm:py-14">
      <LineSkeleton className="h-3 w-48" />

      <div className="mt-7 grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <LineSkeleton className="aspect-[4/5] w-full sm:aspect-square" />
          <div className="mt-4 grid grid-cols-4 gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <LineSkeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <LineSkeleton className="h-3 w-20" />
          <LineSkeleton className="mt-4 h-10 w-3/4" />
          <LineSkeleton className="mt-3 h-4 w-full" />
          <LineSkeleton className="mt-8 h-9 w-40" />

          <div className="mt-8 grid grid-cols-3 gap-2.5">
            {Array.from({ length: 3 }, (_, i) => (
              <LineSkeleton key={i} className="h-24" />
            ))}
          </div>

          <LineSkeleton className="mt-6 h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
