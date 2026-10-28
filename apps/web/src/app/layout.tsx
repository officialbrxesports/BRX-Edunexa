import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'BRX EduNexa | Education, connected.',
  description:
    'A connected learning experience for students, educators, and institutions.',
  applicationName: 'BRX EduNexa',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}