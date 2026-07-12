export default function MessageDetailLoading() {
  return (
    <div className="mx-auto max-w-lg px-6 pb-16 pt-32">
      <div className="glass h-56 animate-pulse rounded-3xl" />
      <div className="mt-8 space-y-3">
        <div className="glass h-9 w-32 animate-pulse rounded-xl" />
        <div className="glass h-20 animate-pulse rounded-2xl" />
        <div className="glass h-20 animate-pulse rounded-2xl" />
      </div>
    </div>
  );
}
