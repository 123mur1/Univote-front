<<<<<<< HEAD
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ApiConnectionNotice } from "@/components/api-connection-notice";
import { Toaster } from "@/components/toast";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});
=======
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApiConnectionNotice } from "@/components/api-connection-notice";
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36

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
<<<<<<< HEAD
    "Secure and Transparent Campus Election Management System (STCEMS) for University of Rwanda student government elections.",
  icons: { icon: "/univote-mark.png", apple: "/univote-mark.png" },
};

export const viewport: Viewport = {
  themeColor: "#00628b",
};

=======
    "Secure and Transparent Campus Election Management System (STCEMS) for university student government elections.",
  icons: { icon: "/univote-mark.png", apple: "/univote-mark.png" },
};

>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
<<<<<<< HEAD
      className={`${jakarta.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        {children}
        <Toaster />
=======
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white">
        {children}
>>>>>>> 168f6c33363971e3d72fb08c35b72f9e8ea1af36
        <ApiConnectionNotice />
      </body>
    </html>
  );
}
