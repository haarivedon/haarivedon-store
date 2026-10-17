import type { Metadata } from "next";
import { Schibsted_Grotesk, Be_Vietnam_Pro, Tangerine } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Matches the reference site (astroarunpandit.org): Be Vietnam Pro for body.
// Their headings use the commercial FH Total (trial files) which we can't
// license/bundle, so Schibsted Grotesk — the closest free modern grotesque —
// stands in for the display face. Swap to next/font/local if FH Total is bought.
const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  variable: "--font-schibsted",
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  variable: "--font-be-vietnam",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
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
        schibsted.variable,
        beVietnam.variable,
        tangerine.variable,
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
