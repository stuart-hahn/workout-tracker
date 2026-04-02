import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "Mobile-first workout logging and progression tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full" suppressHydrationWarning>
        <div className="flex min-h-full flex-col overflow-x-hidden bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
        <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-zinc-50/90 backdrop-blur dark:border-white/10 dark:bg-black/70">
          <div className="mx-auto flex w-full min-w-0 max-w-md items-center justify-between gap-2 px-4 py-3">
            <Link href="/" className="text-base font-semibold tracking-tight">
              Workout Tracker
            </Link>
            <Link
              href="/today"
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Log
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-md flex-1 px-4 py-4">
          {children}
        </main>

        <nav className="sticky bottom-0 z-10 border-t border-zinc-200/70 bg-zinc-50/90 backdrop-blur dark:border-white/10 dark:bg-black/70">
          <div className="mx-auto grid w-full min-w-0 max-w-md grid-cols-4 gap-0.5 px-1 py-2 text-[11px] sm:gap-1 sm:px-2 sm:text-xs">
            <Link
              href="/"
              className="rounded-lg px-2 py-2 text-center font-medium text-zinc-700 hover:bg-zinc-100 sm:px-3 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              Home
            </Link>
            <Link
              href="/today"
              className="rounded-lg px-2 py-2 text-center font-medium text-zinc-700 hover:bg-zinc-100 sm:px-3 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              Today
            </Link>
            <Link
              href="/program"
              className="rounded-lg px-2 py-2 text-center font-medium text-zinc-700 hover:bg-zinc-100 sm:px-3 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              Program
            </Link>
            <Link
              href="/analytics/volume"
              className="rounded-lg px-2 py-2 text-center font-medium text-zinc-700 hover:bg-zinc-100 sm:px-3 dark:text-zinc-200 dark:hover:bg-white/10"
            >
              Volume
            </Link>
          </div>
        </nav>
        </div>
      </body>
    </html>
  );
}
