import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Footer, Header } from "@/components/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Around — Community Events Board", template: "%s | Around" },
  description:
    "Find local music, workshops, food, sports, and family events. Your next good memory is closer than you think.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Providers>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
