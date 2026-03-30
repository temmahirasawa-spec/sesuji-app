import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '背筋ウィーク | パーソナル夢叶えるタスクマネジメント',
  description: '人生を変える7日間。習慣を変える。自分を変える。',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🌊</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#a8e6e1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
