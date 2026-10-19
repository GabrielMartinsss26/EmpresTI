import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "@phosphor-icons/web/regular";
import "./globals.css";
import { Providers } from "@/components/providers";

const font = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-open-sans",
  display: "swap",
});
export const metadata: Metadata = {
  title: "EmpresTI · Empréstimo de equipamentos",
  description: "Controle interno de empréstimo de equipamentos.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={font.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
