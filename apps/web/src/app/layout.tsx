import './global.css';
import { AuthProvider } from '../contexts/AuthContext';
import Providers from '../components/Providers';

export const metadata = {
  title: 'EchoDocs – AI-Powered RAG Knowledge Engine',
  description: 'Grounded AI documentation search and question answering engine.',
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
      </body>
    </html>
  );
}
