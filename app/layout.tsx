import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  title: "Akoben Event Rentals",
  description: "Rental management system — Cape Coast, Ghana",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} h-full`}>
      <body className="h-full bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
