import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApiConnectionNotice } from "@/components/api-connection-notice";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "UniVote — Secure University Elections",
    template: "%s · UniVote",
  },
  description:
    "Secure and Transparent Campus Election Management System (STCEMS) for university student government elections.",
  icons: { icon: "/univote-mark.png", apple: "/univote-mark.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        {children}
        <ApiConnectionNotice />
      </body>
    </html>
  );
}
