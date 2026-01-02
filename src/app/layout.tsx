import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import { siteConfig, siteUrl } from "./lib/seo";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Spotmusic - AI Music DJ for instant, adaptive mixes",
    template: "%s | Spotmusic",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "AI Music DJ",
    "AI DJ",
    "smart music mixing",
    "adaptive playlists",
    "live music curation",
    "mood-based music",
    "real-time music assistant",
  ],
  authors: [{ name: "Spotmusic" }],
  creator: "Spotmusic",
  publisher: "Spotmusic",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Spotmusic - AI Music DJ for instant, adaptive mixes",
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spotmusic - AI Music DJ for instant, adaptive mixes",
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "Music",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
