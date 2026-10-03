import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent Run Explorer",
  description: "Browse and understand agent runs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <strong>Agent Run Explorer</strong>
          <nav>
            <Link href="/runs">Runs</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}