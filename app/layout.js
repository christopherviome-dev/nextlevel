import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "Sheeba",
  description: "Beauty, wherever you are.",
};

// Runs before the page is drawn, so someone who chose dark mode never sees
// a white flash. Choice is "light", "dark" or "system" (follow the phone).
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('sheeba:theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning: the theme script changes this tag before React loads, on purpose.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-surface text-ink font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
