import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "React Bench",
  description:
    "A benchmark for evaluating coding agents on React source-retrieval tasks in complex, real-world codebases.",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html
    lang="en"
    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
    <body>
      <NuqsAdapter>{children}</NuqsAdapter>
    </body>
  </html>
);

export default RootLayout;
