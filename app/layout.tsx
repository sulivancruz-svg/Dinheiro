import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dinheiro com Direcao",
  description:
    "Diagnostico financeiro, plano de acao e mentor IA para organizar dinheiro com clareza.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
