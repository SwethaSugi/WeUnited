export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30 animate-pulse">
            <span className="text-white font-bold text-sm">WU</span>
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 blur-lg opacity-40 animate-pulse" />
        </div>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-bounce" />
        </div>
        <p className="text-sm text-muted-foreground font-medium">We United</p>
      </div>
    </div>
  );
}
