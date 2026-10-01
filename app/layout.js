import ErrorReporter from "../components/ErrorReporter";
import { API_ORIGIN } from "../lib/serverAddress";
import AnnouncementBanner from "../components/AnnouncementBanner";
import SourceCapture from "../components/SourceCapture";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

// What WhatsApp, Instagram, X and others show when a Mepluge link is shared.
// SITE_URL: the live address (change to https://mepluge.com when the domain is ready).
const SITE_URL = "https://maviolevel.netlify.app";
const DESCRIPTION = "Find and book hairdressers, barbers, makeup artists, nail technicians and photographers near you, and see their real work first.";
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Mepluge: your plug for every look",
  description: DESCRIPTION,
  openGraph: {
    type: "website", siteName: "Mepluge", url: "/", title: "Mepluge: your plug for every look", description: DESCRIPTION,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Mepluge: your plug for every look" }],
  },
  twitter: { card: "summary_large_image", title: "Mepluge: your plug for every look", description: DESCRIPTION, images: ["/og.png"] },
};

// Runs before the page is drawn, so someone who chose dark mode never sees
// a white flash. Choice is "light", "dark" or "system" (follow the phone).
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('sheeba:theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the theme script changes this tag before React loads, on purpose.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Start the secure connection to the server while the page loads, not on the first tap (it is far away). */}
        <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={API_ORIGIN} />
        {/* Add to Home Screen: opens like an app, with its own icon (needed for alerts on iPhone). */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Mepluge" />
        <meta name="theme-color" content="#4b2069" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-surface text-ink font-body">
        <SourceCapture />
        <ErrorReporter />
        <AnnouncementBanner />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
