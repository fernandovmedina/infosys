import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ChatbotWidget } from "@/components/chatbot/chatbot-widget";
import { SiteHeader } from "@/components/site-header";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Infosys",
  description: "SAT fraud detection",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <SiteHeader />
        {children}
        <ChatbotWidget />
      </body>
    </html>
  );
}
