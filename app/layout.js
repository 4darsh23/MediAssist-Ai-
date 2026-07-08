import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/ThemeProvider";
import LayoutShell from "@/components/LayoutShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "MedAssist AI - AI-Powered Medical Image Analysis",
  description: "Detect diseases early with powerful AI. Upload medical images, track vitals, and get instant CNN-powered analysis.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
      >
        <body className={inter.className}>
          <ThemeProvider>
            <LayoutShell>{children}</LayoutShell>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
