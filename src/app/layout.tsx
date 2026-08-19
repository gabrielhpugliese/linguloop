import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinguLoop",
  description: "Video-based German language learning MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ThemeRegistry>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '16px 0', background: '#000' }}>
            <div style={{ width: 728, height: 90, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', border: '1px solid #555' }}>
              728x90 Leaderboard Ad
            </div>
          </div>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
