"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBull } from "@/lib/state/use-bull";
import { copyEn } from "@/content/copy.en";
import { copyHiEn } from "@/content/copy.hi-en";

export function Navbar() {
  const pathname = usePathname();
  const { locale, setLocale, streak, level, xp } = useBull();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copy = locale === "hi-en" ? copyHiEn : copyEn;

  const navLinks = [
    { href: "/", label: copy.nav.chat },
    { href: "/shortlist", label: copy.nav.shortlist },
    { href: "/compare", label: copy.nav.compare },
    { href: "/academy", label: copy.nav.academy },
    { href: "/progress", label: copy.nav.progress },
    { href: "/method", label: copy.nav.method },
  ];

  const toggleLocale = () => {
    setLocale(locale === "en" ? "hi-en" : "en");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-transform active:scale-95"
            aria-label="Bull Home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-100 font-bold dark:bg-zinc-100 dark:text-zinc-900 shadow-xs">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M4 10l8-6 8 6" />
                <path d="M12 4v16" />
                <path d="M6 14l6 6 6-6" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-zinc-900 dark:text-zinc-100 text-lg">
              Bull
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 font-semibold"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Streak pill */}
          <Link
            href="/academy"
            title={`${streak.current} day learning streak (${streak.todayActive ? "Active today" : "Not yet active today"})`}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium border border-amber-200/90 bg-amber-50/80 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 hover:opacity-90 transition-opacity"
          >
            <span>🔥</span>
            <span>{streak.current}d</span>
          </Link>

          {/* XP & Level pill */}
          <Link
            href="/progress"
            title={`Level ${level.level}: ${level.title} (${xp} XP)`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              Lv {level.level}
            </span>
            <span className="text-zinc-400 dark:text-zinc-600">·</span>
            <span>{xp} XP</span>
          </Link>

          {/* Bilingual Switcher */}
          <button
            type="button"
            onClick={toggleLocale}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label={`Switch language. Current: ${locale === "en" ? "English" : "Hinglish"}`}
          >
            <span className={locale === "en" ? "text-zinc-900 dark:text-zinc-100 font-bold" : "text-zinc-400"}>
              EN
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <span className={locale === "hi-en" ? "text-zinc-900 dark:text-zinc-100 font-bold" : "text-zinc-400"}>
              HI
            </span>
          </button>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                pathname === link.href
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 font-bold"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-500">
            <span>Streak: {streak.current}d</span>
            <span>Level {level.level} ({xp} XP)</span>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
