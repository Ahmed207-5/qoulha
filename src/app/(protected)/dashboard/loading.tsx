export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-brand-500/10" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass h-24 animate-pulse rounded-3xl" />
        ))}
      </div>
      <div className="glass h-64 animate-pulse rounded-3xl" />
    </div>
  );
}
