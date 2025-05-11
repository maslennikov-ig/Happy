import './globals.css';
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { AuthProvider } from './providers/AuthProvider';
import { Toaster } from "@/components/ui/toaster";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Платформа для предпринимателей',
  description: 'MVP платформы для предпринимателей',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
