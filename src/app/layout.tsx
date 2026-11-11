import type { Metadata } from "next";
import localFont from "next/font/local";
import "@phosphor-icons/web/regular";
import "./globals.css";
import { Providers } from "@/components/providers";

const font = localFont({
  src: "./fonts/OpenSans-Variable.ttf",
  weight: "400 600",
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
