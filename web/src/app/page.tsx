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
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <div className="space-y-8 animate-fadeUp">
      {/* Hero Card - Legomode Style with Dynamic Blobs */}
      <section className="relative bg-leeds-cream rounded-[2.5rem] p-12 sm:p-20 text-center shadow-sm border border-leeds-border overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-leeds-teal/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-leeds-bright/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-leeds-blue/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        </div>

        {/* Glass Overlay */}
        <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-full border border-white/60 text-sm font-medium text-leeds-blue-dark/90 mx-auto mb-4 hover:shadow-[0_0_20px_rgba(var(--leeds-teal),0.3)] transition-all duration-300 hover:scale-105 cursor-default">
            <span className="w-2 h-2 rounded-full bg-leeds-teal animate-pulse-glow" />
            Welcome to CampusConnect
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold text-leeds-blue tracking-tight leading-[1.1] animate-float drop-shadow-sm">
            <span className="text-glow-sm">Connect, Collaborate,</span> <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-leeds-teal via-leeds-bright to-leeds-teal bg-[length:200%_auto] animate-shimmer text-glow">
              Create Together.
            </span>
          </h1>

          <p className="text-xl text-leeds-blue-dark/80 max-w-2xl mx-auto leading-relaxed font-medium">
            The community platform for students, creators, and innovators at the University of Leeds.
          </p>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/request/new"
              className="px-8 py-4 bg-leeds-blue text-white rounded-full font-bold text-lg hover:bg-leeds-blue-dark transition-all hover:scale-110 active:scale-95 shadow-xl shadow-leeds-blue/20 hover:shadow-[0_0_30px_rgba(var(--leeds-teal),0.5)] ring-2 ring-transparent hover:ring-leeds-teal/50"
            >
              Ask For Help
            </Link>
            <Link
              href="/matches/r1"
              className="px-8 py-4 bg-white/80 backdrop-blur-sm text-leeds-blue-dark border-2 border-leeds-border rounded-full font-bold text-lg hover:border-leeds-teal hover:text-leeds-teal transition-all hover:scale-110 active:scale-95 shadow-sm hover:shadow-lg"
            >
              Find Collaborators
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Grid - Spotlight Cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group relative flex flex-col justify-between bg-white rounded-[2rem] border border-leeds-border p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden h-full min-h-[280px] spotlight-card"
            onMouseMove={handleMouseMove}
          >
            {/* Hover Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-leeds-cream/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative z-10">
              <div className={`h-16 w-16 rounded-2xl ${link.color} flex items-center justify-center text-4xl shadow-md mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(var(--leeds-teal),0.4)]`}>
                <span className="text-white drop-shadow-md">{link.iconEmoji || "✨"}</span>
              </div>

              <h2 className="text-2xl font-bold text-leeds-blue-dark group-hover:text-leeds-teal transition-colors group-hover:text-glow-sm">
                {link.label}
              </h2>
              <p className="text-base text-gray-500 mt-3 leading-relaxed group-hover:text-gray-700 transition-colors">
                {link.description}
              </p>
            </div>

            <div className="relative z-10 mt-8 flex items-center text-sm font-bold text-leeds-teal uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
              Go to {link.label} &rarr;
            </div>

            {/* Corner aesthetic */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-leeds-border/10 rounded-full group-hover:bg-leeds-teal/10 transition-colors duration-500 group-hover:scale-150" />
          </Link>
        ))}
      </section>

      {/* Activity Section - Interactive Live Feed */}
      <section className="bg-leeds-blue-dark rounded-[2.5rem] p-8 sm:p-12 shadow-sm text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-leeds-teal/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Header & Stats */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold text-leeds-teal uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-leeds-teal animate-pulse" />
              Live Pulse
            </div>

            <h3 className="text-4xl md:text-5xl font-bold leading-tight">
              See what's happening <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-leeds-teal to-white/80">
                on campus right now.
              </span>
            </h3>

            <p className="text-lg text-white/60 max-w-md">
              Real-time updates from students collaborating, asking questions, and starting new projects.
            </p>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-white">128</div>
                <div className="text-sm text-white/40">Active Students</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-3xl font-bold text-leeds-teal">12</div>
                <div className="text-sm text-white/40">New Projects</div>
              </div>
            </div>

            <button className="px-6 py-3 mt-4 rounded-full bg-white text-leeds-blue-dark font-bold hover:bg-leeds-teal transition-colors shadow-lg shadow-white/5">
              View All Activity
            </button>
          </div>

          {/* Right Side: Scrolling Feed */}
          <div className="relative h-[400px] overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-inner group">
            {/* Gradient Masks */}
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-leeds-blue-dark/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-leeds-blue-dark/50 to-transparent z-10 pointer-events-none" />

            {/* Scrolling Content Container */}
            <div className="animate-scroll-vertical hover:paused px-6 py-4 space-y-4">
              {/* Duplicated items for seamless loop */}
              {[...Array(2)].map((_, setIndex) => (
                <div key={setIndex} className="space-y-4">
                  {[
                    { name: "John Doe", action: "Started 'Campus Map'", time: "2m ago", avatar: "JD" },
                    { name: "Alice Smith", action: "Replied to 'React Help'", time: "5m ago", avatar: "AS" },
                    { name: "Mike K.", action: "Matched with Sarah for 'AI Project'", time: "12m ago", avatar: "MK" },
                    { name: "Sarah J.", action: "Posted a request: 'UI Design'", time: "15m ago", avatar: "SJ" },
                    { name: "David L.", action: "Joined 'Hackathon Team'", time: "22m ago", avatar: "DL" },
                  ].map((item, i) => (
                    <div
                      key={`${setIndex}-${i}`}
                      className="bg-white/5 border border-white/5 p-4 rounded-xl hover:bg-white/10 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer group/item"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-leeds-teal to-leeds-blue flex items-center justify-center font-bold text-xs text-white shadow-sm ring-2 ring-white/10 group-hover/item:ring-leeds-teal/50 transition-all">
                          {item.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-bold text-white/90 truncate">{item.name}</span>
                            <span className="text-xs text-white/40 whitespace-nowrap">{item.time}</span>
                          </div>
                          <p className="text-sm text-leeds-teal/90 truncate mt-0.5 group-hover/item:text-leeds-teal transition-colors">
                            {item.action}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
