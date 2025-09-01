import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FTC League Selection",
  description: "FIRST Tech Challenge League Selection System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-orange-500 text-white p-4">
          <div className="max-w-6xl mx-auto flex justify-center items-center">
            <Link href="/" className="text-xl font-bold hover:text-blue-200">
              San Diego FIRST Tech Challenge
            </Link>
          </div>
        </nav>
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <footer className="bg-slate-100 text-slate-600 p-6 mt-12 flex items-center">
          <div className=" mx-auto text-center flex flex-col">
            <Link href="https://edlweiss.me/" className="text-sm hover:underline">
              Developed by Jay Buensuceso
            </Link>
            <p className="text-sm">
              If you run into any errors please email:
              {" "}
              <a href="mailto:jbuens001@gmail.com" className="underline">
                jbuens001@gmail.com
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
