import type { Metadata, Viewport } from 'next';
import '@fontsource/onest/400.css';
import '@fontsource/onest/500.css';
import '@fontsource/onest/600.css';
import '@fontsource/onest/700.css';
import '@fontsource/onest/800.css';
import '@fontsource/golos-text/600.css';
import '@fontsource/golos-text/700.css';
import '@fontsource/golos-text/800.css';
import '@fontsource/comfortaa/700.css';
import '@fontsource/unbounded/800.css';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: { default: 'hobbyl — хобі на карті Києва', template: '%s — hobbyl' },
  description: 'Гончарство, бокс, шахи, йога, танці. Дивись на карті, що відбувається сьогодні поруч, і записуйся в один клік.',
};

export const viewport: Viewport = {
  themeColor: '#2F6B4F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="min-h-dvh">
        <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
          До вмісту
        </a>
        <Header />
        <div id="content">{children}</div>
      </body>
    </html>
  );
}
