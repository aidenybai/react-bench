import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const fontSerif = localFont({
  src: "./fonts/IvarTextTRIAL-Regular.otf",
  variable: "--font-ivar-text",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "React Bench",
  description: "Evaluating coding agents on React.js tasks",
  icons: {
    icon: "/logo.svg",
  },
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang="en"
    className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable}`}
  >
    <head>
      {process.env.NODE_ENV === "development" && (
        <Script
          src="//unpkg.com/react-grab/dist/index.global.js"
          crossOrigin="anonymous"
          strategy="beforeInteractive"
        />
      )}
    </head>
    <body className={`${fontSans.className} antialiased tracking-tighter`}>
      <NuqsAdapter>{children}</NuqsAdapter>
    </body>
  </html>
);

export default RootLayout;
