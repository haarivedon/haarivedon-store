import type { Metadata } from "next";
import { Fraunces, Mulish, Tangerine } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const mulish = Mulish({
  subsets: ["latin"],
  variable: "--font-mulish",
  display: "swap",
});

const tangerine = Tangerine({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-tangerine",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://haarivedon.com"),
  title: {
    default: "Haarivedon — Ancient Wisdom & Personalized Guidance",
    template: "%s · Haarivedon",
  },
  description:
    "Ancient wisdom and personalized guidance for life's important decisions. Find clarity, balance, and direction with Neelam Niranjan.",
  keywords: [
    "spiritual guidance",
    "vedic wisdom",
    "predictions",
    "consultation",
    "Neelam Niranjan",
    "Haarivedon",
  ],
  openGraph: {
    title: "Haarivedon — Ancient Wisdom & Personalized Guidance",
    description:
      "Ancient wisdom and personalized guidance for life's important decisions.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full antialiased",
        fraunces.variable,
        mulish.variable,
        tangerine.variable,
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
