import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { boot } from "@/lib/ready";
import "./globals.css";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif" });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "EBOMI Highschool International", template: "%s · EBOMI Highschool International" },
  description: "EBOMI Highschool International, from Creche to Senior Secondary. Education for development.",
  robots: { index: false, follow: false },
  icons: { icon: "/logo.png" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  (await boot());
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
