import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/lib/auth-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RepairGraph — Intelligent Product Repair & Lifecycle Platform',
  description: 'Evidence-based device diagnosis, repairability scoring, lifecycle economics, and standardized digital repair history.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAF9] text-stone-900 selection:bg-orange-100 selection:text-orange-950 font-sans">
        <AuthProvider>
          <Navbar />
          <AppShell>
            {children}
          </AppShell>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
