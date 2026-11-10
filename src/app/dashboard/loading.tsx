export default function DashboardLoading() {
  return (
    <div className="max-w-[1360px] mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-sand-300 pb-5">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-sand-300/80 rounded-lg" />
          <div className="h-3.5 w-80 bg-sand-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 bg-sand-200 rounded-md" />
          <div className="h-8 w-36 bg-sand-300/70 rounded-md" />
        </div>
      </div>

      {/* Bento Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3 h-56 bg-sand-300/70 rounded-2xl" />
        <div className="md:col-span-3 h-56 bg-sand-200/80 rounded-2xl border border-sand-300" />
        <div className="md:col-span-3 h-56 bg-sand-200/80 rounded-2xl border border-sand-300" />
        <div className="md:col-span-3 h-56 bg-sand-200/80 rounded-2xl border border-sand-300" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3 h-60 bg-sand-200/80 rounded-2xl border border-sand-300" />
        <div className="md:col-span-6 h-60 bg-sand-200/80 rounded-2xl border border-sand-300" />
        <div className="md:col-span-3 h-60 bg-sand-200/80 rounded-2xl border border-sand-300" />
      </div>
    </div>
  );
}
