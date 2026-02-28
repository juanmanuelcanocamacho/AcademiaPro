import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import Sidebar from "@/components/Sidebar";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | AcademiaPro",
    default: "Bienvenido | AcademiaPro"
  },
  description: "Plataforma de exámenes y gestión educativa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geist.variable} font-sans antialiased bg-gray-50`}>
        <Toaster position="top-center" richColors />
        <div className="flex min-h-screen">
          <Sidebar />
          {/* Main content shifted by sidebar width */}
          <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
