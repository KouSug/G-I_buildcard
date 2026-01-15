import type { Metadata } from "next";
import { Inter, Cinzel, Noto_Sans_JP, Sawarabi_Gothic } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });
const notoSansJP = Noto_Sans_JP({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-noto-sans" });
const sawarabiGothic = Sawarabi_Gothic({ weight: "400", subsets: ["latin"], variable: "--font-sawarabi" });

export const metadata: Metadata = {
  title: "Genshin Build Card Creator",
  description: "Create and share your Genshin Impact character builds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} ${cinzel.variable} ${notoSansJP.variable} ${sawarabiGothic.variable} font-sans bg-[#1C1C22] text-[#ECE5D8]`}>{children}</body>
    </html>
  );
}
