import type { ReactNode } from 'react';
import { Noto_Sans_JP } from 'next/font/google';

import { StyledComponentsRegistry } from './StyledComponentsRegistry';
import './globals.css';

const notoSansJp = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='ja'>
      <body className={notoSansJp.className}>
        <StyledComponentsRegistry>
          <main className='min-h-screen bg-white px-4 py-10 text-slate-900 sm:px-8'>{children}</main>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
