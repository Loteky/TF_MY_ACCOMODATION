import './globals.css';
import { ReactNode } from 'react';
import { AuthProvider } from '../lib/auth-context';

export const metadata = {
  title: 'Home Swap',
  description: 'Secure accommodation transfer portal for officers',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
