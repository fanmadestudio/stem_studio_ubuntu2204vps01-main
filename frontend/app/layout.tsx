import type { Metadata } from "next";
import { AuthGate } from "./components/auth-gate";
import { LanguageProvider } from "./components/language-provider";
import { ThemeProvider } from "./components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stem Studio",
  description: "Stem Studio dashboard for recording operations"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <AuthGate>{children}</AuthGate>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
