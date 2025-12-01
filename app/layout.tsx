import type { Metadata } from "next";
import "./globals.css";
import { LayoutWrapper } from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "Go Reports",
  description: "Sales reports for Game Over",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FAFAFA]">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}

