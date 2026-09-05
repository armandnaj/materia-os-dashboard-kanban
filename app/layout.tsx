import type { Metadata } from "next";
import "@fontsource/pt-serif/400.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/roboto-condensed/400.css";
import "@fontsource/roboto-condensed/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "МИСТЕРИЯ OS — AIAIAI lab",
  description: "Рабочая доска гипотез, кейсов, инструментов, процессов и решений Materia AI.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
