import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "We United — Connect. Refer. Grow.",
    template: "%s | We United",
  },
  description:
    "We United is a business networking platform for chapters. Track referrals, manage members, attend meetings, and grow your business together.",
  keywords: ["business networking", "referrals", "chapter management", "professional network", "We United"],
  authors: [{ name: "We United" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "We United — Connect. Refer. Grow.",
    description: "Track referrals, manage chapter meetings, and build meaningful professional relationships.",
    type: "website",
    locale: "en_IN",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${jakarta.variable} ${inter.variable}`}>
      <body className="min-h-full flex flex-col font-body">{children}</body>
    </html>
  );
}
