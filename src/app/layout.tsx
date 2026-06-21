import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import AdminPopup from '@/components/AdminPopup';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers';

const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Krishna Students Printers & Stationery Toys',
  description: 'Online store for textbooks, stationery, custom printing services, spiral binding, kids toys, and birthday gifts in Chennai.',
  keywords: 'stationery Chennai, printing service Medavakkam, spiral binding Chennai, school books, kid toys Medavakkam',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className={`${poppins.className} min-h-screen flex flex-col bg-white antialiased`}>
        <Providers>
          {/* Toast notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#ffffff',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: '16px',
                border: '2px solid #e2e8f0',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
              },
              success: {
                style: {
                  border: '2px solid #bbf7d0',
                  background: '#f0fdf4',
                },
              },
              error: {
                style: {
                  border: '2px solid #fecaca',
                  background: '#fdf2f2',
                },
              },
            }}
          />
          
          {/* Sticky Header */}
          <Navbar />

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>

          {/* Global Promotional Popup */}
          <AdminPopup />

          {/* WhatsApp floating trigger */}
          <WhatsAppFloat />

          {/* Footer */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
