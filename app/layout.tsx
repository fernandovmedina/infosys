import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Infosys",
  description: "Detección de fraudes en el SAT",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
