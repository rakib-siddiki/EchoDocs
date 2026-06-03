import './global.css';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
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
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
