import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "MSA University — Faculty of Biotechnology | Dean Executive Dashboard",
  description: "Executive platform for Faculty of Biotechnology Dean's office to monitor staff tasks, verify submissions, and maintain an immutable audit trail.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logos/faculty-of-biotechnology.jpeg",
    apple: "/logos/faculty-of-biotechnology.jpeg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Faculty Biotech",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              try {
                var theme = localStorage.getItem('faculty_theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch(e) {}
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(){});
                });
              }
            })();`
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
