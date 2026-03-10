"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useClerk } from "@clerk/nextjs";
import { Activity, LayoutDashboard, Scan, Heart, History, FileText, Users, BarChart3, Settings, LogOut, ChevronLeft, Menu, Sun, Moon, Monitor } from "lucide-react";
import { useState, useEffect } from "react";

const mainNav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Scan", href: "/scan", icon: Scan },
  { name: "Vitals", href: "/vitals", icon: Heart },
  { name: "History", href: "/history", icon: History },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Patients", href: "/patients", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const bottomNav = [{ name: "Settings", href: "/settings", icon: Settings }];

export default function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme toggle function
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  // Handle logout
  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 lg:hidden transition-colors"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50
          flex flex-col transition-all duration-300
          ${collapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500 dark:bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            {!collapsed && <span className="text-lg font-bold text-gray-900 dark:text-white">MedAssist AI</span>}
          </div>
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <ChevronLeft className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"}
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
          {mounted && (
            <button
              onClick={toggleTheme}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full
                text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all
                ${collapsed ? "justify-center" : ""}
              `}
            >
              {resolvedTheme === "dark" ? <Sun className="w-5 h-5 flex-shrink-0 text-yellow-500" /> : <Moon className="w-5 h-5 flex-shrink-0 text-blue-500" />}
              {!collapsed && <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
            </button>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-700 space-y-1">
          {bottomNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"}
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-blue-500 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full
              text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all
              ${collapsed ? "justify-center" : ""}
            `}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
