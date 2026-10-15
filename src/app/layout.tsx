import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { is } from "@/i18n/is";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: is.app.name, template: `%s · ${is.app.name}` },
  description: is.app.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="is"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only rounded-lg bg-card px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          {is.app.skipToContent}
        </a>
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-md items-center px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              {is.app.name}
            </Link>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-md flex-1 px-4 py-6">
          <noscript>
            <p className="card mb-4">{is.app.noScript}</p>
          </noscript>
          {children}
        </main>
      </body>
    </html>
  );
}
