import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-[220px] min-h-screen">
            <div className="max-w-6xl mx-auto p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}

