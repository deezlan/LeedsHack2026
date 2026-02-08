import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-leeds-blue-dark text-white py-12 mt-auto">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-2">
                        <Link href="/" className="inline-block">
                            <span className="text-xl font-bold tracking-tight text-white">
                                Campus<span className="text-leeds-teal">Connect</span>
                            </span>
                        </Link>
                        <p className="mt-4 text-sm text-white/70 max-w-sm">
                            Connecting students, researchers, and creators at the University of Leeds.
                            Build the future together.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-leeds-teal uppercase tracking-wider">Resources</h3>
                        <ul className="mt-4 space-y-3">
                            <li><Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">Documentation</Link></li>
                            <li><Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">Guides</Link></li>
                            <li><Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">Support</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-leeds-teal uppercase tracking-wider">Legal</h3>
                        <ul className="mt-4 space-y-3">
                            <li><Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="text-sm text-white/70 hover:text-white transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-white/50">
                        &copy; 2026 CampusConnect. All rights reserved.
                    </p>
                    <div className="flex gap-4">
                        {/* Social Icons Placeholder */}
                    </div>
                </div>
            </div>
        </footer>
    );
}
