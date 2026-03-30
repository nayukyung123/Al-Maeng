import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ToastContainer from "@/components/layout/ToastContainer";
import SessionExpiredToast from "@/components/layout/SessionExpiredToast";
import GoogleTagManager from "@/components/common/GoogleTagManager";
import { GTM_ID } from "@/lib/gtag";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AL-MAENG",
  description: "AL-MAENG 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <Header />
          <main className="pt-16">{children}</main>
          <Footer />
          <ToastContainer />
          <SessionExpiredToast />
          <GoogleTagManager />
          {GTM_ID && (
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>
          )}
        </QueryProvider>
      </body>
    </html>
  );
}
