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
    <div className="space-y-8 animate-fadeUp">
      {/* Hero Card - Legomode Style */}
      <section className="relative bg-leeds-cream rounded-[2.5rem] p-12 sm:p-20 text-center shadow-sm border border-leeds-border overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/60 to-transparent opacity-50 pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-leeds-border/50 text-sm font-medium text-leeds-blue-dark/80 mx-auto mb-4 hover:shadow-[0_0_15px_rgba(var(--leeds-teal),0.2)] transition-shadow duration-300">
            <span className="w-2 h-2 rounded-full bg-leeds-teal animate-pulse-glow" />
            Welcome to CampusConnect
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold text-leeds-blue tracking-tight leading-[1.1] animate-float">
            <span className="text-glow-sm">Connect, Collaborate,</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-leeds-teal via-leeds-teal-light to-leeds-teal bg-[length:200%_auto] animate-shimmer text-glow">
              Create Together.
            </span>
          </h1>

          <p className="text-xl text-leeds-blue-dark/70 max-w-2xl mx-auto leading-relaxed">
            The community platform for students, creators, and innovators at the University of Leeds.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/request/new"
              className="px-8 py-4 bg-leeds-blue text-white rounded-full font-bold text-lg hover:bg-leeds-blue-dark transition-all hover:scale-105 active:scale-95 shadow-lg shadow-leeds-blue/20 hover:shadow-[0_0_20px_rgba(var(--leeds-teal),0.4)]"
            >
              Ask For Help
            </Link>
            <Link
              href="/matches/r1"
              className="px-8 py-4 bg-white text-leeds-blue-dark border-2 border-leeds-border rounded-full font-bold text-lg hover:border-leeds-teal hover:text-leeds-teal transition-all hover:scale-105 active:scale-95"
            >
              Find Collaborators
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Grid - Cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group relative flex flex-col justify-between bg-white rounded-[2rem] border border-leeds-border p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full min-h-[280px]"
          >
            {/* Hover Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-leeds-cream/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative z-10">
              <div className={`h-14 w-14 rounded-2xl ${link.color} flex items-center justify-center text-3xl shadow-sm mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-[0_0_15px_rgba(var(--leeds-teal),0.3)]`}>
                <span className="text-white drop-shadow-sm">{link.iconEmoji || "✨"}</span>
              </div>

              <h2 className="text-2xl font-bold text-leeds-blue-dark group-hover:text-leeds-teal transition-colors group-hover:text-glow-sm">
                {link.label}
              </h2>
              <p className="text-base text-gray-500 mt-3 leading-relaxed">
                {link.description}
              </p>
            </div>

            <div className="relative z-10 mt-8 flex items-center text-sm font-bold text-leeds-teal uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
              Go to {link.label} &rarr;
            </div>

            {/* Corner aesthetic */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-leeds-border/10 rounded-full group-hover:bg-leeds-teal/10 transition-colors" />
          </Link>
        ))}
      </section>

      {/* Activity Section */}
      <section className="bg-leeds-blue-dark rounded-[2.5rem] p-8 sm:p-12 shadow-sm text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-leeds-teal/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-3xl font-bold">Community Activity</h3>
            <p className="text-white/60 mt-1">See what's happening on campus right now.</p>
          </div>
          <button className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors font-semibold text-sm">View All</button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 relative z-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-2xl hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-leeds-teal text-leeds-blue-dark flex items-center justify-center font-bold text-xs">
                  {["JD", "AS", "MK"][i - 1]}
                </div>
                <span className="text-sm font-bold text-white/90">{["John Doe", "Alice Smith", "Mike K."][i - 1]}</span>
              </div>
              <p className="text-sm text-white/70">
                {["Started a new project: 'Campus Map'", "Replied to 'React Help'", "Matched with Sarah"][i - 1]}
              </p>
              <p className="text-xs text-white/30 mt-3">2 hours ago</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
