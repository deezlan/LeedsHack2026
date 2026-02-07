export default function ProfilePage() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Profile
        </p>
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          This is a placeholder profile view. Data will appear here once the
          backend is connected.
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-zinc-300/80 bg-white/60 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
        Profile summary placeholder
      </div>
    </section>
  );
}
