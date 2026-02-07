const sampleThreads = [
  { id: "t1", title: "Welcome thread", preview: "Intro and next steps." },
  { id: "t2", title: "Match follow-up", preview: "Confirm availability." },
  { id: "t3", title: "Organizer note", preview: "Event logistics info." },
];

export default function InboxPage() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Inbox
        </p>
        <h1 className="text-2xl font-semibold">Messages</h1>
        <p className="max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          Placeholder inbox threads until messaging is connected.
        </p>
      </div>
      <div className="grid gap-3">
        {sampleThreads.map((thread) => (
          <div
            key={thread.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
          >
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {thread.title}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {thread.preview}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
