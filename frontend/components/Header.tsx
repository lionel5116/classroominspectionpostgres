'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Record Inspection', href: '/inspections/new' },
    { label: 'User Maintenance', href: '/users' },
  ];

  return (
    <header className="bg-hisd-navy text-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-end gap-0.5 h-8">
            {[3, 5, 4, 6, 4].map((h, i) => (
              <div
                key={i}
                className="w-2 rounded-sm bg-hisd-teal"
                style={{ height: `${h * 4}px` }}
              />
            ))}
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight leading-none">HISD</div>
            <div className="text-[10px] text-hisd-teal leading-tight font-medium tracking-wide">
              Classroom Temperatre Monitoring
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right info */}
        <div className="text-right hidden md:block">
          <div className="text-xs font-semibold text-white">Innovation &amp; Development</div>
          <div className="text-[10px] text-white/60">TEC 328.0253</div>
        </div>
      </div>
    </header>
  );
}
