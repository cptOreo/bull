import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bull",
  description:
    "Stock discovery and research for first-time investors. Education only: no advice, no target prices.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
