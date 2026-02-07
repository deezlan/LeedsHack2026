import Link from "next/link";

const quickLinks = [
  { href: "/request/new", label: "Start a new request" },
  { href: "/matches/r1", label: "View matches (r1)" },
  { href: "/inbox", label: "Open inbox" },
  { href: "/profile", label: "Review your profile" },
];

export default function Home() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Dev A Step 1
        </p>
        <h1 className="text-3xl font-semibold">Navigation + Layout Shell</h1>
        <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          The shared top navigation is live. Use the links above to explore
          placeholder routes while backend wiring is still in progress.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-900 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
