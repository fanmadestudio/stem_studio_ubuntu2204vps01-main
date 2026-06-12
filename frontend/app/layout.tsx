import { AuthGate } from "./components/auth-gate";
import { LanguageProvider } from "./components/language-provider";
import { ThemeProvider } from "./components/theme-provider";
import "./globals.css";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthGate>{children}</AuthGate>
      </LanguageProvider>
    </ThemeProvider>
  );
}
