import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import GhibliLeavesCanvas from '@/components/background/GhibliLeavesCanvas';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Rekindle — A Cozy Life RPG',
  description: 'Tend to your days, nurture your sanctuary. A Studio Ghibli-inspired mindful productivity RPG with your observant pet companion and the glass token jar.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-amber-200 selection:text-amber-950`}>
        <AuthProvider>
          <GhibliLeavesCanvas />
          <div className="relative z-20 min-h-screen">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
