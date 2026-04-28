import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "Webhook Admin",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full theme">
      <body className="h-full bg-muted">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
