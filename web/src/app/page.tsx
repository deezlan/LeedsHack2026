"use client";

import Link from "next/link";

const quickLinks = [
  {
    href: "/request/new",
    label: "Ask for Help",
    description: "Start a new request to find an expert.",
    icon: "🚀",
    color: "bg-leeds-blue"
  },
  {
    href: "/inbox",
    label: "Check Messages",
    description: "See who has responded to you.",
    icon: "abc",
    // icon above is just a placeholder, I should use svg or emoji
    // let's use emoji for simplicity and vibrancy
    iconEmoji: "📬",
    color: "bg-leeds-teal"
  },
  {
    href: "/matches/r1",
    label: "View Matches",
    description: "Browse recommended helpers.",
    iconEmoji: "👥",
    color: "bg-leeds-bright"
  },
  {
    href: "/profile",
    label: "Update Profile",
    description: "Keep your skills and bio up to date.",
    iconEmoji: "👤",
    color: "bg-leeds-blue-dark"
  },
];

export default function Home() {
  return (
    <div className="space-y-10 animate-fadeUp">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-leeds-blue tracking-tight">
          Welcome to <span className="text-leeds-teal">LeedsHack</span>
        </h1>
        <p className="text-lg text-leeds-blue-dark/70 max-w-2xl mx-auto">
          The community platform for students, creators, and innovators at the University of Leeds. Connect, collaborate, and build something amazing.
        </p>
      </section>

      {/* Dashboard Grid */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group relative flex flex-col bg-white rounded-2xl border border-leeds-border p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/0 to-leeds-cream rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`} />

            <div className={`h-12 w-12 rounded-xl ${link.color} flex items-center justify-center text-2xl shadow-md mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <span className="text-white drop-shadow-sm">{link.iconEmoji || "✨"}</span>
            </div>

            <h2 className="text-lg font-bold text-leeds-blue-dark group-hover:text-leeds-teal transition-colors">
              {link.label}
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {link.description}
            </p>

            <div className="mt-auto pt-4 flex items-center text-xs font-bold text-leeds-teal uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              Go &rarr;
            </div>
          </Link>
        ))}
      </section>

      {/* Activity Section Placeholder */}
      <section className="bg-white rounded-2xl border border-leeds-border p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-leeds-blue-dark">Community Activity</h3>
          <button className="text-sm font-semibold text-leeds-teal hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-xl hover:bg-leeds-cream/50 transition-colors border border-transparent hover:border-leeds-border/50">
              <div className="h-10 w-10 rounded-full bg-leeds-cream border border-leeds-border flex items-center justify-center text-lg">
                {["🚀", "💡", "🎨"][i - 1]}
              </div>
              <div>
                <p className="text-sm font-medium text-leeds-blue-dark">
                  <span className="font-bold">Sarah</span> matched with <span className="font-bold">James</span> for a React project.
                </p>
                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
