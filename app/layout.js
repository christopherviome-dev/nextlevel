import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "Sheeba",
  description: "Beauty, wherever you are.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-ink font-body">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
