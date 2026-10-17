import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import ThemeRegistry from "@/components/ThemeRegistry";
import SiteFooter from "@/components/SiteFooter";
import {
  ADSENSE_CLIENT, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL,
} from "@/lib/site";

// Rounded terminals that match the logo mark's round stroke ends. latin-ext covers accented
// characters in video titles; its files only download when such characters appear.
const nunito = Nunito({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const TITLE = `${SITE_NAME}: ${SITE_TAGLINE}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    url: "/",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
  },
  // AdSense site verification; only present once the publisher ID is configured.
  ...(ADSENSE_CLIENT ? { other: { "google-adsense-account": ADSENSE_CLIENT } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={nunito.variable}>
      <body className="site-body">
        <ThemeRegistry>
          <main className="site-main">{children}</main>
          <SiteFooter />
        </ThemeRegistry>
        {ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <Analytics />
      </body>
    </html>
  );
}
