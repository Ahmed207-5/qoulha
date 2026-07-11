export function FloatingBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl animate-float" />
      <div
        className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl animate-float"
        style={{ animationDelay: '2s' }}
      />
      <div
        className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-brand-300/20 blur-3xl animate-float"
        style={{ animationDelay: '4s' }}
      />
    </div>
  );
}
