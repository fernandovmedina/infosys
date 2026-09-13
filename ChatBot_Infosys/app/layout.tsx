import type { Metadata } from 'next'
import { Poppins, Open_Sans } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
})

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-open-sans',
})

export const metadata: Metadata = {
  title: 'ChatBot Infosys — Local AI Assistant',
  description: 'AI Chatbot powered by Qwen2.5:7b running locally via Ollama & FastAPI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${poppins.variable} ${openSans.variable}`}>
      <body className="antialiased min-h-screen bg-background text-foreground overflow-hidden">
        {children}
      </body>
    </html>
  )
}
