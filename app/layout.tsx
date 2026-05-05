import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
 
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
  weight: ["200", "300"],
  display: "swap",
});
 
export const metadata: Metadata = {
  title: "teescribisinnombre",
  description: "Tal vez te llegue, pero si no es así, siempre estarás en forma de letras.",
  openGraph: {
    title: "teescribisinnombre",
    description: "Tal vez te llegue, pero si no es así, siempre estarás en forma de letras.",
    url: "https://teescribisinnombre.com",
    siteName: "teescribisinnombre",
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "teescribisinnombre",
    description: "Tal vez te llegue, pero si no es así, siempre estarás en forma de letras.",
  },
  robots: {
    index: true,
    follow: true,
  },
};
 
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${inter.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
