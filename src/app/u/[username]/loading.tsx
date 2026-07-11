export default function ProfileLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="glass w-full max-w-md rounded-4xl p-8">
        <div className="mx-auto mb-4 h-24 w-24 animate-pulse rounded-full bg-brand-500/10" />
        <div className="mx-auto h-5 w-32 animate-pulse rounded-lg bg-brand-500/10" />
        <div className="mx-auto mt-2 h-4 w-24 animate-pulse rounded-lg bg-brand-500/10" />
        <div className="mx-auto mt-6 h-12 w-full animate-pulse rounded-2xl bg-brand-500/10" />
      </div>
    </div>
  );
}
