import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://finnkvittering.no"
  ),
  title: {
    default: "Finn Kvittering - Generer kvitteringer fra Finn.no",
    template: "%s | Finn Kvittering",
  },
  description:
    "Generer profesjonelle kvitteringer og regnskapsbilag direkte fra Finn.no-annonser. Gratis og enkelt å bruke. Perfekt for regnskapsføring av kjøp og salg.",
  keywords: [
    "Finn.no",
    "kvittering",
    "regnskapsbilag",
    "kvitteringsgenerator",
    "Finn kvittering",
    "regnskapsføring",
    "egen dokumentasjon",
    "PDF generator",
    "kvittering Finn.no",
    "bilag generator",
    "gratis kvittering",
  ],
  authors: [{ name: "Finn Kvittering" }],
  creator: "Finn Kvittering",
  publisher: "Finn Kvittering",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "no_NO",
    url: "/",
    siteName: "Finn Kvittering",
    title: "Finn Kvittering - Generer kvitteringer fra Finn.no",
    description:
      "Generer profesjonelle kvitteringer og regnskapsbilag direkte fra Finn.no-annonser. Gratis og enkelt å bruke.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Finn Kvittering - Generer kvitteringer fra Finn.no",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Finn Kvittering - Generer kvitteringer fra Finn.no",
    description:
      "Generer profesjonelle kvitteringer og regnskapsbilag direkte fra Finn.no-annonser. Gratis og enkelt å bruke.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://finnkvittering.no";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Finn Kvittering",
    description:
      "Generer profesjonelle kvitteringer og regnskapsbilag direkte fra Finn.no-annonser. Gratis og enkelt å bruke.",
    url: siteUrl,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "NOK",
    },
    featureList: [
      "Automatisk henting av data fra Finn.no-annonser",
      "Generering av profesjonelle PDF-kvitteringer",
      "Regnskapsbilag i henhold til bokføringsforskriften",
      "Gratis bruk uten registrering",
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Finn Kvittering",
    url: siteUrl,
    description:
      "Generer profesjonelle kvitteringer og regnskapsbilag direkte fra Finn.no-annonser.",
    inLanguage: "no-NO",
  };

  return (
    <html lang="no">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Script
          src="https://rybbit.mkapi.no/api/script.js"
          data-site-id="56307a5447db"
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
