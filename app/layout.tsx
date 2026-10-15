import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0c0c0d",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  // ── Títulos ──────────────────────────────────────────────────
  title: {
    default: "teescribisinnombre — poemas para quien no tiene nombre",
    template: "%s | teescribisinnombre",
  },
  description:
    "Poemas íntimos y anónimos. Tal vez te llegue, pero si no es así, siempre estarás en forma de letras. Archivo de poesía en español.",

  // ── Canónica ──────────────────────────────────────────────────
  alternates: {
    canonical: "https://teescribisinnombre.com",
    languages: {
      "es-MX": "https://teescribisinnombre.com",
      "es":    "https://teescribisinnombre.com",
    },
  },

  // ── Keywords (ayuda en buscadores secundarios) ────────────────
  keywords: [
    "poemas anónimos",
    "poesía en español",
    "poemas de amor sin nombre",
    "poesía íntima",
    "teescribisinnombre",
    "poemas cortos",
    "poesía mexicana",
    "anonymous poems in spanish",
  ],

  // ── Autores y categoría ───────────────────────────────────────
  authors: [{ name: "teescribisinnombre", url: "https://teescribisinnombre.com" }],
  creator: "teescribisinnombre",
  category: "poetry",

  // ── OpenGraph ─────────────────────────────────────────────────
  openGraph: {
    title: "teescribisinnombre — poemas para quien no tiene nombre",
    description:
      "Poemas íntimos y anónimos. Tal vez te llegue, pero si no es así, siempre estarás en forma de letras.",
    url: "https://teescribisinnombre.com",
    siteName: "teescribisinnombre",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "https://teescribisinnombre.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "teescribisinnombre — poemas para quien no tiene nombre",
      },
    ],
  },

  // ── Twitter / X ───────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "teescribisinnombre — poemas para quien no tiene nombre",
    description:
      "Poemas íntimos y anónimos. Siempre estarás en forma de letras.",
    images: ["https://teescribisinnombre.com/og-image.png"],
    creator: "@teescribisinnombre",
  },

  // ── Robots ────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${cormorant.variable} ${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Schema.org — datos estructurados para Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "teescribisinnombre",
              description:
                "Archivo de poemas íntimos y anónimos en español.",
              url: "https://teescribisinnombre.com",
              inLanguage: ["es", "es-MX"],
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate:
                    "https://teescribisinnombre.com/?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
              author: {
                "@type": "Person",
                name: "teescribisinnombre",
                url: "https://teescribisinnombre.com",
                sameAs: [
                  "https://www.tiktok.com/@teescribisinnombre",
                  "https://www.instagram.com/teescribisinnombre",
                ],
              },
            }),
          }}
        />
      </head>
      <body>{children}</body>
      <Analytics />
    </html>
  );
}