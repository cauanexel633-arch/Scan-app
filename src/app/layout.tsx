import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Scan-app",
  description: "Leitura de códigos de barras e integração por webhook."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}