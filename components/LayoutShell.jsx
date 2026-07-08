"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

// Routes that should NOT show the sidebar (public pages)
const publicRoutes = ["/", "/sign-in", "/sign-up"];

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isPublic) {
    // Public pages: full-width, no sidebar
    return <main className="min-h-screen">{children}</main>;
  }

  // Authenticated pages: sidebar + offset main content
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
