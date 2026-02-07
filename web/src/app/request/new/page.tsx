export default function NewRequestPage() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Request
        </p>
        <h1 className="text-2xl font-semibold">New Request</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Draft your request details here. The form will be wired up later.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-dashed border-zinc-300/80 bg-white/60 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
          Request details placeholder
        </div>
        <div className="rounded-xl border border-dashed border-zinc-300/80 bg-white/60 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
          Scheduling placeholder
        </div>
      </div>
    </section>
  );
}
