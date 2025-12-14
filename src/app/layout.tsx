import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

// Premium Typography System - Matching abfi.io design
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Playfair Display for elegant section headings (italic serif)
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ABFI - Australian Bioenergy Feedstock Institute",
    template: "%s | ABFI",
  },
  description:
    "Australia's national feedstock coordination platform connecting bioenergy suppliers with producers through standardised ratings and verified records.",
  keywords: [
    "bioenergy",
    "feedstock",
    "Australia",
    "SAF",
    "sustainable aviation fuel",
    "biofuel",
    "renewable energy",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfairDisplay.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className:
              "bg-card border-border shadow-lg rounded-xl font-sans text-sm",
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
