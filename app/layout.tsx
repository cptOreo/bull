import type { Metadata } from "next";
import "./globals.css";
import { BullProvider } from "@/lib/state/store";
import { QueryProvider } from "@/components/providers/query-provider";
import { Navbar } from "@/components/nav/navbar";
import { Footer } from "@/components/nav/footer";
import { DisclaimerBanner } from "@/components/chat/disclaimer-banner";

export const metadata: Metadata = {
  title: "Bull — Educational Learning Studio",
  description:
    "Applied-literacy stock discovery for first-time investors in India. Pure educational analysis with uncapped live data and zero buy/sell recommendations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-100">
        <QueryProvider>
          <BullProvider>
            <DisclaimerBanner />
            <Navbar />
            <div className="flex-1 flex flex-col">{children}</div>
            <Footer />
          </BullProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
