import './global.css';
import { AuthProvider } from '../contexts/AuthContext';
import Providers from '../components/Providers';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'EchoDocs – AI-Powered RAG Knowledge Engine',
  description: 'Grounded AI documentation search and question answering engine.',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
