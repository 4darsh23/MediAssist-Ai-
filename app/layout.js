import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MedAssist AI - AI-Powered Medical Image Analysis",
  description: "Detect diseases early with powerful AI.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 lg:ml-64 transition-all duration-300">{children}</main>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
